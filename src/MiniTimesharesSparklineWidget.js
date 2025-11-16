// MiniTimesharesSparklineWidget.js
// 盤中分時走勢圖 - 支持美股/港股/ETF

// ==================== 配置區 ====================
const CONFIG = {
  symbol: 'NVDA',           // 預設股票/ETF 代碼
  period: 'all',            // 預設週期: 1d / 5d / 1m / 6m / all
  
  // API 端點
  api: {
    '1d': 'https://m-gl.lbkrs.com/api/forward/v5/quote/stock/timeshares',
    '5d': 'https://m-gl.lbkrs.com/api/forward/quote/stock/mutitimeshares',
    'kline': 'https://m-gl.lbkrs.com/api/forward/v3/quote/kline'
  },
  
  // 市場交易分鐘數（用於 1d/5d 模式）
  marketMinutes: { US: 390, HK: 331 },
  
  // 圖表尺寸和邊距 [上, 右, 下, 左]
  chart: { w: 520, h: 120, pad: [8, 16, 8, 16] },

  // All 模式的多圖表配置
  multiChart: {
    w: 120, h: 150,           // 每個小圖表尺寸
    gap: 8,                  // 圖表間距
    percentagePos: { x: 5, y: 65, size: 18 } // 百分比文字位置和大小
  },
  
  // 顏色配置
  colors: {
    up: '#33C759',        // 上漲綠
    down: '#FF3B30',      // 下跌紅
    fillAlpha: { up: 0.20, down: 0.25 }  // 填充透明度
  },
  
  // 文字和樣式
  lineWidth: 2.0,
  baselineDash: [6, 4],   // 基準虛線 [線段, 間隔]
  padding: [10, 12]       // Widget 內邊距 [垂直, 水平]
};

// ==================== 主程式 ====================
async function main() {
  try {
    // 1. 解析參數
    const symbol = getParam() || CONFIG.symbol;
    const period = CONFIG.period;
    
    // 2. 判斷市場（純數字=港股，否則=美股）
    const isHK = /^[0-9]+$/.test(symbol);
    const market = isHK ? 'HK' : 'US';
    
    // 3. 多輪嘗試建立有效的 counter_id（支援 ST 和 ETF 類型）
    const { counterId, type } = await tryBuildCounterId(symbol, market);
    console.log(`[成功] 使用 ${type} 類型: ${counterId}`);

    // 4. 獲取數據並建立模型
    const model = await buildModel(counterId, market, period);
    model.symbol = symbol;
    model.period = period;
    
    // 5. 創建並顯示 Widget
    const widget = createWidget(model);
    config.runsInWidget ? Script.setWidget(widget) : await widget.presentMedium();
    
  } catch (error) {
    console.error(`[Error] ${error.message}`);
    const widget = createErrorWidget(error.message);
    config.runsInWidget ? Script.setWidget(widget) : await widget.presentMedium();
  } finally {
    Script.complete();
  }
}

// ==================== 數據層 ====================

/**
 * 統一數據模型建構
 * 返回: 單一週期模型或多週期模型數組
 */
async function buildModel(counterId, market, period) {
  // 處理 All 週期
  if (period === 'all') {
    console.log(`[Model] 開始建構 All 週期模型...`);
    return await buildAllPeriodsModel(counterId, market);
  }

  // 步驟 1: 獲取原始數據
  const json = await fetchData(counterId, period);

  // 步驟 2: 標準化為統一格式 { points: [{x, price}], baseline }
  const { points, baseline } = normalizeData(json, period, market);

  if (points.length < 2 || !isFinite(baseline)) {
    throw new Error('數據不足或昨收價無效');
  }

  // 步驟 3: 單次遍歷計算所有統計值
  const stats = calculatePriceStats(points, baseline);
  
  console.log(`[Model] ${points.length} 點, mode=${stats.trendMode}, range=[${stats.minPrice.toFixed(4)}, ${stats.maxPrice.toFixed(4)}]`);

  return {
    points,
    baseline,
    ...stats
  };
}

/**
 * 單次遍歷計算所有價格統計值
 */
function calculatePriceStats(points, baseline) {
  let min = Infinity;
  let max = -Infinity;
  
  // 單次遍歷取得 min, max, lastPrice
  for (let i = 0; i < points.length; i++) {
    const price = points[i].price;
    if (price < min) min = price;
    if (price > max) max = price;
  }
  
  const lastPrice = points[points.length - 1].price;
  const change = lastPrice - baseline;
  const changePct = (change / baseline) * 100;

  // 判斷趨勢模式並調整 Y 軸範圍
  let trendMode;
  const epsilon = 1e-8;
  
  if (min >= baseline - epsilon) {
    trendMode = 'ABOVE';  // 全天上漲
  } else if (max <= baseline + epsilon) {
    trendMode = 'BELOW';  // 全天下跌
  } else {
    trendMode = 'MIXED';  // 跨越昨收，Y 軸必須包含基準線
    min = Math.min(min, baseline);
    max = Math.max(max, baseline);
  }

  // 防止價差過小導致除零
  if (max - min < 0.0001) {
    const mid = (max + min) / 2 || baseline || 1;
    min = mid * 0.995;
    max = mid * 1.005;
  }

  return {
    lastPrice,
    change,
    changePct,
    minPrice: min,
    maxPrice: max,
    trendMode
  };
}

/**
 * 使用 Promise.all 並行請求，但限制並發數避免超時
 */
async function buildAllPeriodsModel(counterId, market) {
  const periods = ['6m', '1m', '5d', '1d'];
  console.log(`[All Periods] 開始並行獲取 ${periods.length} 個週期數據...`);

  // 使用 Promise.allSettled 並行執行
  const results = await Promise.allSettled(
    periods.map(period => buildSinglePeriodModel(counterId, market, period))
  );

  // 整理結果
  const formattedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`[All Periods] ${periods[index]} 失敗: ${result.reason}`);
      return {
        period: periods[index],
        model: null,
        error: result.reason?.message || '未知錯誤'
      };
    }
  });

  const successCount = formattedResults.filter(r => !r.error).length;
  console.log(`[All Periods] 並行獲取完成，成功: ${successCount}/${periods.length}`);

  return formattedResults;
}

/**
 * 封裝單一週期模型建構邏輯，減少重複代碼
 */
async function buildSinglePeriodModel(counterId, market, period) {
  try {
    console.log(`[All Periods] 獲取 ${period} 數據...`);
    
    const json = await fetchData(counterId, period);
    const { points, baseline } = normalizeData(json, period, market);

    if (points.length < 2 || !isFinite(baseline)) {
      throw new Error('數據不足或昨收價無效');
    }

    const stats = calculatePriceStats(points, baseline);
    
    console.log(`[All Periods] ${period} 構建成功: ${points.length} 點, mode=${stats.trendMode}`);

    return {
      period,
      model: {
        points,
        baseline,
        ...stats
      },
      error: null
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 統一 API 請求
 */
async function fetchData(counterId, period) {
  const url = buildApiUrl(counterId, period);
  
  const req = new Request(url);
  req.timeoutInterval = 10;
  const json = await req.loadJSON();
  
  validateApiResponse(json, period);
  
  return json;
}

/**
 * 提取 URL 構建邏輯，減少重複代碼
 */
function buildApiUrl(counterId, period) {
  const encoded = encodeURIComponent(counterId);
  
  switch (period) {
    case '1d':
      return `${CONFIG.api['1d']}?counter_id=${encoded}&trade_session=0`;
    case '5d':
      return `${CONFIG.api['5d']}?counter_id=${encoded}&merge_minute=0`;
    case '1m':
      return `${CONFIG.api['kline']}?counter_id=${encoded}&line_num=24&line_type=1000`;
    case '6m':
      return `${CONFIG.api['kline']}?counter_id=${encoded}&line_num=130&line_type=1000`;
    default:
      throw new Error(`不支援的週期: ${period}`);
  }
}

/**
 * 提取驗證邏輯
 */
function validateApiResponse(json, period) {
  if (period === '1m' || period === '6m') {
    if (!json?.data?.klines?.length) {
      throw new Error('K 線數據為空');
    }
  } else {
    if (!json?.data?.timeshares?.length) {
      throw new Error('API 返回數據為空');
    }
  }
}

/**
 * 標準化數據 - 優化數組操作
 */
function normalizeData(json, period, market) {
  const points = [];
  let baseline;
  
  if (period === '5d') {
    // 五日分時：串接最近 5 個交易日
    const sessions = json.data.timeshares
      .filter(s => s?.minutes?.length > 0)
      .sort((a, b) => (a.date || 0) - (b.date || 0))
      .slice(-5);
    
    if (!sessions.length) throw new Error('無有效交易日');
    
    baseline = parseFloat(sessions[0].pre_close ?? json.data.base_price);
    
    // 預先分配數組容量（估算）
    let x = 0;
    for (let i = 0; i < sessions.length; i++) {
      const minutes = sessions[i].minutes;
      for (let j = 0; j < minutes.length; j++) {
        const price = parseFloat(minutes[j].price);
        if (isFinite(price)) {
          points.push({ x: x++, price });
        }
      }
    }
    
  } else if (period === '1d') {
    // 單日分時
    const ts = json.data.timeshares.find(t => String(t.trade_session) === '0')
            || json.data.timeshares[0];
    
    if (!ts?.minutes?.length) throw new Error('無有效分時數據');
    
    baseline = parseFloat(ts.pre_close ?? json.data.base_price);
    
    const minutes = ts.minutes;
    for (let i = 0; i < minutes.length; i++) {
      const price = parseFloat(minutes[i].price);
      if (isFinite(price)) {
        points.push({ x: i, price });
      }
    }
    
  } else {
    // 1m / 6m 日 K 線模式
    const klines = json.data.klines;
    if (!Array.isArray(klines) || klines.length < 2) {
      throw new Error('K 線數據不足');
    }
    
    // 第一筆 close 作為昨收
    baseline = parseFloat(klines[0].close);
    if (!isFinite(baseline)) throw new Error('昨收價無效');
    
    // 從第二筆開始，x 為均勻索引
    for (let i = 1; i < klines.length; i++) {
      const price = parseFloat(klines[i].close);
      if (isFinite(price)) {
        points.push({ x: i - 1, price });
      }
    }
  }
  
  return { points, baseline };
}

// ==================== UI 層 ====================

/**
 * 創建 Widget
 */
function createWidget(model) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color('#000000', 0.0);
  widget.setPadding(0, 0, 0, 0);

  addHeader(widget, model);
  addChart(widget, model);

  return widget;
}

/**
 * 添加圖表（支援單一和多週期模式）
 */
function addChart(widget, model) {
  const [vPad, hPad] = CONFIG.padding;
  const container = widget.addStack();
  container.setPadding(0, hPad, vPad, hPad);

  // 判斷是否為 All 週期模式
  if (Array.isArray(model)) {
    // 多週期模式：使用 drawAllPeriodsChart
    container.addImage(drawAllPeriodsChart(model));
  } else {
    // 單一週期模式：使用原有的 drawChart
    container.addImage(drawChart(model));
  }
}

/**
 * 添加頂部資訊欄
 */
function addHeader(widget, model) {
  const [vPad, hPad] = CONFIG.padding;
  const header = widget.addStack();
  header.layoutHorizontally();
  header.setPadding(vPad, hPad, 4, hPad);

  // 左側：時間（HH:MM 格式）
  const now = new Date();
  const timeFormatter = new DateFormatter();
  timeFormatter.dateFormat = 'HH:mm';
  const timeString = timeFormatter.string(now);

  const timeText = header.addText(timeString);
  timeText.font = Font.systemFont(10);
  timeText.textColor = new Color('#FFFFFF', 0.6);

  header.addSpacer(8);

  // 左側：週期標籤
  const periodText = Array.isArray(model) ? '[ALL]' : `[${model.period}]`;
  const periodLabel = header.addText(periodText);
  periodLabel.font = Font.systemFont(10);
  periodLabel.textColor = new Color('#FFFFFF', 0.6);

  // 中間間距：將右側元素推向右側
  header.addSpacer();

  // 右側：股票代碼 + 價格 + 漲跌幅
  const ticker = header.addText(model.symbol);
  ticker.font = Font.semiboldRoundedSystemFont(14);
  ticker.textColor = Color.white();

  header.addSpacer(8);

  // 價格和漲跌幅（僅單一週期模式）
  if (!Array.isArray(model)) {
    addPriceInfo(header, model);
  } else {
    addAllPeriodsPriceInfo(header, model);
  }
}

/**
 * 提取價格資訊顯示邏輯
 */
function addPriceInfo(header, model) {
  const priceStr = model.lastPrice.toFixed(3).replace(/\.?0+$/, '');
  const price = header.addText(priceStr);
  price.font = Font.semiboldSystemFont(14);
  price.textColor = Color.white();

  if (isFinite(model.change)) {
    header.addSpacer(6);

    const sign = model.change > 0 ? '+' : model.change < 0 ? '-' : '';
    const color = model.change > 0 ? new Color(CONFIG.colors.up, 1.0)
                : model.change < 0 ? new Color(CONFIG.colors.down, 1.0)
                : new Color('#FFFFFF', 0.7);

    const changeText = `${sign}${Math.abs(model.change).toFixed(2)} (${sign}${Math.abs(model.changePct).toFixed(2)}%)`;
    const changeLbl = header.addText(changeText);
    changeLbl.font = Font.systemFont(12);
    changeLbl.textColor = color;
  }
}

function addAllPeriodsPriceInfo(header, model) {
  const priceInfo = get1dPriceInfo(model);

  if (priceInfo) {
    addPriceInfo(header, priceInfo);
  } else {
    const successCount = model.filter(item => !item.error).length;
    const statsText = `${successCount}/${model.length}`;
    const stats = header.addText(statsText);
    stats.font = Font.systemFont(12);
    stats.textColor = new Color('#FFFFFF', 0.6);
  }
}

/**
 * 繪製圖表 - 優化座標轉換，使用批次計算
 */
function drawChart(model) {
  const { w, h, pad } = CONFIG.chart;
  const [padT, padR, padB, padL] = pad;
  
  const ctx = new DrawContext();
  ctx.size = new Size(w, h);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  
  // 計算可用繪圖區域
  const usableW = w - padL - padR;
  const usableH = h - padT - padB;
  const bottomY = padT + usableH;
  
  // 【優化】批次計算座標轉換
  const canvasPoints = transformPointsToCanvas(
    model.points,
    model.minPrice,
    model.maxPrice,
    padL,
    padT,
    usableW,
    usableH
  );
  
  let baseY = null;
  if (model.trendMode === 'MIXED') {
    const baseRatio = (model.baseline - model.minPrice) / (model.maxPrice - model.minPrice);
    baseY = padT + (1 - baseRatio) * usableH;
  }
  
  // 繪製所有圖層
  drawAllLayers(ctx, canvasPoints, model, baseY, bottomY, w, padL, padR);
  
  return ctx.getImage();
}

/**
 * 批次座標轉換，避免在繪製時重複計算
 */
function transformPointsToCanvas(points, minPrice, maxPrice, padL, padT, usableW, usableH) {
  const maxX = points[points.length - 1].x;
  const priceRange = maxPrice - minPrice;
  const canvasPoints = new Array(points.length);
  
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    canvasPoints[i] = {
      x: padL + (p.x / maxX) * usableW,
      y: padT + (1 - (p.price - minPrice) / priceRange) * usableH,
      price: p.price
    };
  }
  
  return canvasPoints;
}

function drawAllPeriodsChart(periodModels) {
  const { w, h, gap } = CONFIG.multiChart;

  // 計算總寬度：4 * 120 + 3 * 8 = 504
  const totalWidth = 4 * w + 3 * gap;
  // 圖表高度：150 + 百分比區域
  const totalHeight = h + 30; // 30 給百分比留空間

  const ctx = new DrawContext();
  ctx.size = new Size(totalWidth, totalHeight);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  console.log(`[All Periods] 繪製多圖表: ${totalWidth}x${totalHeight}`);

  // 週期對應的標籤文字
  const periodLabels = {
    '6m': '[6m]',
    '1m': '[1m]',
    '5d': '[5d]',
    '1d': '[1d]'
  };

  // 繪製每個週期的圖表
  for (let i = 0; i < periodModels.length; i++) {
    const periodData = periodModels[i];
    const x = i * (w + gap);

    if (periodData.error) {
      // 繪製占位方塊（API 失敗）
      drawPlaceholderChart(ctx, x, 0, w, h, periodData.period);
    } else {
      // 繪製正常圖表
      drawMiniChart(ctx, periodData.model, x, 0, w, h, periodData.period);
    }

    // 繪製週期標籤
    drawPeriodLabel(ctx, periodLabels[periodData.period], x, 0, w);

    // 繪製漲跌幅百分比（圖表下方）
    if (!periodData.error) {
      drawPercentage(ctx, periodData, x, h, w);
    }

    // 如果不是最後一個圖表，繪製分隔線
    if (i < periodModels.length - 1) {
      drawDividerLine(ctx, x + w + gap/2, 0, totalHeight);
    }
  }

  console.log(`[All Periods] 多圖表繪製完成`);
  return ctx.getImage();
}

/**
 * 繪製單個小圖表
 */
function drawMiniChart(ctx, model, x, y, w, h, period) {
  const pad = 6; // 小圖表的內邊距
  const usableW = w - 2 * pad;
  const usableH = h - 2 * pad;
  const bottomY = y + h - pad;

  const canvasPoints = transformPointsToCanvas(
    model.points,
    model.minPrice,
    model.maxPrice,
    x + pad,
    y + pad,
    usableW,
    usableH
  );

  let baseY = null;
  if (model.trendMode === 'MIXED') {
    const baseRatio = (model.baseline - model.minPrice) / (model.maxPrice - model.minPrice);
    baseY = y + pad + (1 - baseRatio) * usableH;
  }

  // 繪製圖表（使用現有的 drawAllLayers 函數）
  drawAllLayers(ctx, canvasPoints, model, baseY, bottomY, x + w, x + pad, x + w - pad);
}

/**
 * 繪製占位方塊（API 失敗時）
 */
function drawPlaceholderChart(ctx, x, y, w, h, period) {
  // 繪製灰色背景方塊
  const rectPath = new Path();
  rectPath.addRect(new Rect(x, y, w, h));

  ctx.setFillColor(new Color('#666666', 0.3));
  ctx.addPath(rectPath);
  ctx.fillPath();

  // 繪製邊框
  const borderPath = new Path();
  borderPath.addRect(new Rect(x, y, w, h));
  ctx.setStrokeColor(new Color('#666666', 0.8));
  ctx.setLineWidth(1);
  ctx.addPath(borderPath);
  ctx.strokePath();

  // 繪製失敗文字
  const text = 'ERROR';
  const textSize = 12;
  const textWidth = text.length * textSize * 0.6;
  const textX = x + (w - textWidth) / 2;
  const textY = y + h / 2 - textSize / 2;

  ctx.setFont(Font.systemFont(textSize));
  ctx.setTextColor(new Color('#FF6B6B', 1.0));
  ctx.drawText(text, new Point(textX, textY));
}

/**
 * 繪製週期標籤
 */
function drawPeriodLabel(ctx, label, x, y, w) {
  ctx.setFont(Font.systemFont(8));
  ctx.setTextColor(new Color('#FFFFFF', 0.6));
  ctx.drawText(label, new Point(x + 4, y + 2));
}

/**
 * 繪製漲跌幅百分比
 */
function drawPercentage(ctx, periodData, x, chartBottomY, w) {
  if (!periodData.model) return;

  const { model } = periodData;

  // 計算百分比文字
  const sign = model.change > 0 ? '+' : model.change < 0 ? '' : '';
  const percentageText = `${sign}${model.changePct.toFixed(2)}%`;

  // 選擇顏色
  const color = model.change > 0 ? new Color(CONFIG.colors.up, 1.0)
            : model.change < 0 ? new Color(CONFIG.colors.down, 1.0)
            : new Color('#FFFFFF', 0.7);

  // 文字位置（圖表下方居中）
  const fontSize = 20;
  const textWidth = percentageText.length * fontSize * 0.5;
  const textX = x + (w - textWidth) / 2;
  const textY = chartBottomY + 3; // 圖表底部往下 3px

  ctx.setFont(Font.semiboldSystemFont(fontSize));
  ctx.setTextColor(color);
  ctx.drawText(percentageText, new Point(textX, textY));
}

/**
 * 繪製分隔線
 */
function drawDividerLine(ctx, x, y, height) {
  const linePath = new Path();
  linePath.move(new Point(x, y));
  linePath.addLine(new Point(x, y + height));

  ctx.setStrokeColor(new Color('#FFFFFF', 0.1));
  ctx.setLineWidth(1);
  ctx.addPath(linePath);
  ctx.strokePath();
}

/**
 * 繪製圖層
 */
function drawAllLayers(ctx, points, model, baseY, bottomY, width, padL, padR) {
  if (points.length < 2) return;
  
  const { trendMode, baseline } = model;
  const { up, down } = CONFIG.colors;
  const { up: alphaUp, down: alphaDown } = CONFIG.colors.fillAlpha;
  
  // 填充區域
  if (trendMode === 'ABOVE' || trendMode === 'BELOW') {
    const fillPath = new Path();
    fillPath.move(new Point(points[0].x, points[0].y));
    for (let i = 1; i < points.length; i++) {
      fillPath.addLine(new Point(points[i].x, points[i].y));
    }
    
    const last = points[points.length - 1];
    fillPath.addLine(new Point(last.x, bottomY));
    fillPath.addLine(new Point(points[0].x, bottomY));
    fillPath.closeSubpath();
    
    const fillColor = trendMode === 'ABOVE' 
      ? new Color(up, alphaUp)
      : new Color(down, alphaDown);
    
    ctx.setFillColor(fillColor);
    ctx.addPath(fillPath);
    ctx.fillPath();
    
  } else if (baseY != null) {
    // MIXED 模式：分段填充（相對基準線）
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // 判斷當前段是否在基準線上方或下方
      const isAbove = p1.price >= baseline && p2.price >= baseline;
      const isBelow = p1.price <= baseline && p2.price <= baseline;
      
      if (isAbove || isBelow) {
        const fillColor = isAbove 
          ? new Color(up, alphaUp)
          : new Color(down, alphaDown);
        
        const path = new Path();
        if (isAbove) {
          // 上方區域
          path.move(new Point(p1.x, baseY));
          path.addLine(new Point(p1.x, p1.y));
          path.addLine(new Point(p2.x, p2.y));
          path.addLine(new Point(p2.x, baseY));
        } else {
          // 下方區域
          path.move(new Point(p1.x, p1.y));
          path.addLine(new Point(p1.x, baseY));
          path.addLine(new Point(p2.x, baseY));
          path.addLine(new Point(p2.x, p2.y));
        }
        path.closeSubpath();
        
        ctx.setFillColor(fillColor);
        ctx.addPath(path);
        ctx.fillPath();
      }
    }
  }
  
  // 價格折線
  ctx.setLineWidth(CONFIG.lineWidth);
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // 決定線段顏色
    let lineColor;
    if (trendMode === 'ABOVE') {
      lineColor = new Color(up, 1.0);
    } else if (trendMode === 'BELOW') {
      lineColor = new Color(down, 1.0);
    } else {
      const midPrice = (p1.price + p2.price) / 2;
      lineColor = midPrice >= baseline 
        ? new Color(up, 1.0)
        : new Color(down, 1.0);
    }
    
    const linePath = new Path();
    linePath.move(new Point(p1.x, p1.y));
    linePath.addLine(new Point(p2.x, p2.y));
    
    ctx.setStrokeColor(lineColor);
    ctx.addPath(linePath);
    ctx.strokePath();
  }
  
  // 基準虛線
  if (trendMode === 'MIXED' && baseY != null) {
    const [dashLen, gapLen] = CONFIG.baselineDash;
    
    // 根據當前漲跌決定虛線顏色
    const lastPrice = points[points.length - 1].price;
    const dashColor = lastPrice > baseline 
      ? new Color(up, 0.5)
      : lastPrice < baseline 
        ? new Color(down, 0.5)
        : new Color('#FFFFFF', 0.5);
    
    ctx.setStrokeColor(dashColor);
    ctx.setLineWidth(2);
    
    // 繪製虛線段
    let x = padL;
    while (x < width - padR) {
      const x2 = Math.min(x + dashLen, width - padR);
      const dashPath = new Path();
      dashPath.move(new Point(x, baseY));
      dashPath.addLine(new Point(x2, baseY));
      ctx.addPath(dashPath);
      ctx.strokePath();
      x += dashLen + gapLen;
    }
  }
}

// ==================== 工具函數 ====================

/**
 * 從 All 模式模型中提取 1d 週期的價格資訊
 * @param {Array} allPeriodModels - All 模式的週期模型陣列
 * @returns {Object|null} 1d 價格資訊或 null（如果 1d 失敗）
 */
function get1dPriceInfo(allPeriodModels) {
  const period1d = allPeriodModels.find(item => item.period === '1d');
  if (!period1d || period1d.error || !period1d.model) {
    return null;
  }

  const { model } = period1d;
  return {
    lastPrice: model.lastPrice,
    change: model.change,
    changePct: model.changePct
  };
}

/**
 * 多輪嘗試建立有效的 Counter ID
 * 仿照 Widget.js 的 tryFetchStock() 模式
 * @param {string} symbol - 股票/ETF 代碼
 * @param {string} market - 市場代碼 ('US' 或 'HK')
 * @returns {Promise<{counterId: string, type: string}>} 成功的 counterId 和類型
 */
async function tryBuildCounterId(symbol, market) {
  const attempts = [
    { type: 'ST', label: '股票' },
    { type: 'ETF', label: 'ETF' }
  ];

  let lastError = null;

  for (let i = 0; i < attempts.length; i++) {
    const { type, label } = attempts[i];
    try {
      // 格式化代碼（港股需去除前導零，美股轉大寫）
      const normalized = market === 'HK' ? String(parseInt(symbol, 10)) : symbol.toUpperCase();
      const counterId = `${type}/${market}/${normalized}`;

      console.log(`[嘗試] ${i + 1}/${attempts.length} (${label}): ${counterId}`);

      // 嘗試獲取數據以驗證 counterId 是否有效
      const testJson = await fetchData(counterId, '1d');

      if (testJson) {
        console.log(`[嘗試] 成功: ${counterId}`);
        return { counterId, type };
      }
    } catch (error) {
      console.log(`[嘗試] 失敗 ${i + 1}/${attempts.length}: ${error.message}`);
      lastError = error;
    }
  }

  throw new Error(`所有嘗試失敗 (${symbol}): ${lastError?.message || '未知錯誤'}`);
}

/**
 * 從 widget 參數取得股票/ETF 代碼（支援「代碼1,代碼2」格式，取第一個）
 */
function getParam() {
  const param = (args?.widgetParameter || '').trim();
  if (!param) return null;
  return param.split(',')[0].trim().toUpperCase() || null;
}

/**
 * 創建錯誤 Widget
 */
function createErrorWidget(message) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color('#000000', 0.9);
  widget.setPadding(16, 16, 16, 16);
  
  const title = widget.addText('⚠️ 錯誤');
  title.font = Font.boldSystemFont(14);
  title.textColor = Color.red();
  
  widget.addSpacer(6);
  
  const text = widget.addText(String(message).slice(0, 200));
  text.font = Font.systemFont(11);
  text.textColor = Color.white();
  text.lineLimit = 6;
  
  return widget;
}

// ==================== 執行 ====================
await main();