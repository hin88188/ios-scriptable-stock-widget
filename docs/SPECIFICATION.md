# Futunn 港股/美股成交額 Widget - AI 實作規格文件

**版本**: 2.1  
**目標平台**: iOS Scriptable  
**API 版本**: Scriptable 1.6+  
**日期**: 2025-10-20

---

## 版本更新說明

### v2.1 主要變更 (2025-10-20)
- ✅ **新增 K 線圖功能**：在「代號/名稱」和「漲跌%」之間顯示當日 K 線圖
- ✅ 從 FutuNN 個股頁面抓取真實 OHLC 數據（open, high, low, close）
- ✅ K 線顏色採用「綠漲紅跌」配色（與港股一致）
- ✅ 新增 K 線專屬快取系統（1 分鐘時效）
- ✅ 實作 `fetchSingleKlineData()` 函式抓取個股 OHLC
- ✅ 實作 `drawKline()` 函式繪製標準 K 線圖（含上影線、實體、下影線）
- ✅ 調整美股/港股欄位配置，優化欄位寬度分配
- ✅ 改進影線置中對齊邏輯

### v2.0 主要變更 (2025-10-17)
- ✅ 重構類別架構：新增 `RequestQueue`、`DataFetcher`、`CacheManager`、`ColorCalculator` 四大核心類別
- ✅ 優化請求管理：實作並發請求佇列，支援請求重試與指數退避
- ✅ 改進快取系統：分離主列表、期權、產業三種快取類型，支援市場特定快取
- ✅ 優化效能設定：可配置最大並發請求數、請求超時、重試次數
- ✅ 改進時區處理：使用 `toLocaleString` 直接取得紐約/香港時間
- ✅ 新增色彩快取：ColorCalculator 內建快取機制減少重複計算
- ✅ 優化欄位配置：區分美股/港股欄位設定，港股使用股票名稱取代代號
- ✅ 改進 TradingView URL 生成：正確處理港股數字代號前導零

---

## 目錄

1. [系統架構概覽](#1-系統架構概覽)
2. [Feature 1: 配置管理系統](#feature-1-配置管理系統)
3. [Feature 2: 請求佇列管理](#feature-2-請求佇列管理)
4. [Feature 3: 資料抓取引擎](#feature-3-資料抓取引擎)
5. [Feature 4: 快取管理系統](#feature-4-快取管理系統)
6. [Feature 5: 市場決策引擎](#feature-5-市場決策引擎)
7. [Feature 6: 資料處理與過濾](#feature-6-資料處理與過濾)
8. [Feature 7: 色彩計算系統](#feature-7-色彩計算系統)
9. [Feature 8: Widget 建構引擎](#feature-8-widget-建構引擎)
10. [Feature 9: K 線圖繪製系統](#feature-9-k-線圖繪製系統)
11. [Feature 10: 錯誤處理與除錯](#feature-10-錯誤處理與除錯)

---

## 1. 系統架構概覽

### 資料流向（v2.1）

```
啟動 → 配置載入 → 市場決策 → 快取檢查
                                ↓
                          快取有效？
                         ↙        ↘
                      是(顯示)    否(抓取)
                                  ↓
                  [RequestQueue 管理請求]
                          ↓
                  主列表抓取 → 過濾 → 並發補充
                          ↓
                  [DataFetcher 批次處理]
                          ↓
                  產業/期權/K線 → 色彩計算
                          ↓
                  Widget建構 → 快取寫入 → 顯示
```

### 核心類別架構（v2.1）

| 類別 | 職責 | 關鍵方法 |
|------|------|----------|
| `RequestQueue` | 並發請求管理 | `add()`, `process()` |
| `DataFetcher` | HTTP 請求與解析 | `fetchWithRetry()`, `fetchAndParseInitialState()` |
| `CacheManager` | 檔案快取管理 | `get()`, `set()` |
| `ColorCalculator` | 色彩計算與快取 | `getChangeRatioColor()`, `getCallRatioColor()`, `getVolumnRatioColor()` |

---

## Feature 1: 配置管理系統

### Description
v2.1 新增 K 線配置區塊。

### Outputs
```javascript
CONFIG = {
  // 基本設定
  MARKET: 'AUTO' | 'US' | 'HK',
  SHOW_STOCK: boolean,
  SHOW_ETF: boolean,
  MAX_ITEMS: number,
  FONT_SIZE: number,
  
  // 快取設定
  CACHE_DURATION: number,            // 分鐘
  OPTIONS_CACHE_DURATION: number,    
  INDUSTRY_CACHE_DURATION: number,
  KLINE_CACHE_DURATION: number,
  
  // 效能設定
  MAX_CONCURRENT_REQUESTS: number,   // 最大並發請求數
  REQUEST_RETRY_COUNT: number,       // 請求重試次數
  REQUEST_TIMEOUT: number,           // 請求超時（毫秒）
  
  // Cookie 設定
  COOKIES: string,
  
  // 市場 URL 配置
  MARKET_URLS: {
    US: string,
    HK: string
  },
  
  // K 線配置
  KLINE: {
    WIDTH: number,            // K線總寬度
    HEIGHT: number,           // K線總高度
    BODY_WIDTH: number,       // 實體寬度
    SHADOW_WIDTH: number,     // 影線寬度
    GAIN_COLOR: string,       // 漲色(綠)
    LOSS_COLOR: string,       // 跌色(紅)
    NEUTRAL_COLOR: string     // 平盤色
  },
  
  // 美股欄位設定
  COLUMN_SETTINGS_US: [
    { key: 'industry', header: '', width: 60, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockCode', header: '代號', width: 50, visible: true },
    { key: 'kline', header: '', width: 8, visible: true },
    { key: 'changeRatio', header: '漲跌%', width: 55, visible: true },
    { key: 'priceNominal', header: '價格', width: 50, visible: true },
    { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
    { key: 'volumnRatio', header: '量比', width: 30, visible: true },
    { key: 'callRatio', header: 'Call%', width: 40, visible: true }
  ],
  
  // 港股欄位設定（v2.1 調整）
  COLUMN_SETTINGS_HK: [
    { key: 'industry', header: '', width: 70, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockName', header: '名稱', width: 85, visible: true },
    { key: 'kline', header: '', width: 8, visible: true },
    { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
    { key: 'priceNominal', header: '價格', width: 50, visible: true },
    { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
    { key: 'volumnRatio', header: '量比', width: 30, visible: true }
  ],
  
  // 色彩系統
  COLORS: {
    GAIN_LEVELS: {...},
    LOSS_LEVELS: {...},
    NEUTRAL: string,
    background: Color,
    text: Color,
    headerBackground: Color
  },
  
  // Call% 色彩與閾值
  CALL_RATIO_COLORS: {...},
  CALL_RATIO_THRESHOLDS: {...},
  
  // 量比色彩與閾值
  VOLUMN_RATIO_COLORS: {...},
  VOLUMN_RATIO_THRESHOLDS: {...},
  
  // UI 常數
  UI: {
    HEADER_PADDING: Object,
    ROW_PADDING: Object,
    PROGRESS_BAR_HEIGHT: number,
    CALL_LABEL_PADDING: Object,
    CALL_LABEL_CORNER_RADIUS: number,
    CALL_LABEL_TEXT_COLOR: string
  }
}
```

### Key Changes in v2.1
- 新增 `KLINE` 配置區塊（寬度、高度、影線寬度、顏色）
- 新增 `KLINE_CACHE_DURATION` 快取時效
- 調整 `COLUMN_SETTINGS_US` 和 `COLUMN_SETTINGS_HK` 加入 `kline` 欄位
- 優化成交額、量比欄位寬度

---

## Feature 2: 請求佇列管理

### Description
管理並發 HTTP 請求，避免同時發送過多請求。

### Class: RequestQueue

```javascript
class RequestQueue {
  constructor(maxConcurrent: number)
  async add(requestFn: Function): Promise<any>
  async process(): Promise<void>
}
```

### Logic Steps

#### 1. 初始化
```javascript
constructor(maxConcurrent = 10) {
  this.maxConcurrent = maxConcurrent;
  this.running = 0;
  this.queue = [];
}
```

#### 2. 新增請求
```javascript
async add(requestFn) {
  return new Promise((resolve, reject) => {
    this.queue.push({ requestFn, resolve, reject });
    this.process();
  });
}
```

#### 3. 處理佇列
```javascript
async process() {
  if (this.running >= this.maxConcurrent || this.queue.length === 0) {
    return;
  }
  
  this.running++;
  const { requestFn, resolve, reject } = this.queue.shift();
  
  try {
    const result = await requestFn();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    this.running--;
    this.process();
  }
}
```

---

## Feature 3: 資料抓取引擎

### Description
整合請求佇列、重試機制、超時控制的資料抓取系統。

### Class: DataFetcher

```javascript
class DataFetcher {
  constructor(config: Object)
  buildHeaders(): Object
  async fetchWithRetry(url: string, maxRetries: number): Promise<string>
  delay(ms: number): Promise<void>
  async fetchAndParseInitialState(url: string, context: string): Promise<Object>
}
```

### Key Functions

#### fetchStockData
```javascript
async function fetchStockData(fetcher, market) {
  const url = CONFIG.MARKET_URLS[market];
  const data = await fetcher.fetchAndParseInitialState(url, `turnover_${market}`);
  
  if (!data?.stock_list?.list) {
    throw new Error(`${market} 成交額資料格式錯誤`);
  }
  
  return data.stock_list.list.map(stock => ({
    ...stock,
    stockName: stock.name || '--'
  }));
}
```

#### fetchSingleCallRatio（僅美股）
```javascript
async function fetchSingleCallRatio(stock, fetcher, cache) {
  const cached = cache.get('options', stock.stockCode);
  if (cached !== null) return cached;
  
  try {
    const path = stock.instrumentType === 4 ? 'etfs' : 'stock';
    const url = `https://www.futunn.com/hk/${path}/${stock.stockCode}-US/options-chain`;
    const data = await fetcher.fetchAndParseInitialState(url, `options_${stock.stockCode}`);
    
    const putRatio = data?.option_link?.vol?.putRatio;
    if (putRatio !== undefined && putRatio !== null) {
      const callRatio = 100 - parseInt(putRatio, 10);
      cache.set('options', stock.stockCode, callRatio);
      return callRatio;
    }
    return '--';
  } catch (error) {
    console.error(`處理 ${stock.stockCode} Call/Put 比例失敗: ${error.message}`);
    return '--';
  }
}
```

#### fetchSingleIndustry
```javascript
async function fetchSingleIndustry(stock, fetcher, cache, market) {
  if (stock.instrumentType === 4) return 'ETF';
  
  const cached = cache.get('industry', stock.stockCode);
  if (cached !== null) return cached;

  try {
    const url = generateTradingViewUrl(stock.stockCode, market);
    const html = await fetcher.fetchWithRetry(url);

    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch && jsonLdMatch[1]) {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      if (jsonData["@type"] === "BreadcrumbList") {
        const industryItem = jsonData.itemListElement.find(item =>
          item.item["@id"].includes("/sectorandindustry-industry/")
        );
        if (industryItem) {
          const industry = industryItem.item.name;
          cache.set('industry', stock.stockCode, industry);
          return industry;
        }
      }
    }
    saveDebugFile(`debug_industry_${stock.stockCode}.txt`, html);
    return '--';
  } catch (error) {
    console.error(`處理 ${stock.stockCode} 產業資訊失敗: ${error.message}`);
    return '--';
  }
}
```

#### fetchSingleKlineData
**說明**: 從 FutuNN 個股頁面抓取 OHLC 數據，用於繪製 K 線圖。

```javascript
async function fetchSingleKlineData(stock, fetcher, cache, market) {
  // 1. 檢查快取
  const cached = cache.get('kline', stock.stockCode);
  if (cached !== null) return cached;
  
  try {
    // 2. 建立 URL
    const path = stock.instrumentType === 4 ? 'etfs' : 'stock';
    const marketSuffix = market === 'US' ? 'US' : 'HK';
    const url = `https://www.futunn.com/hk/${path}/${stock.stockCode}-${marketSuffix}`;
    
    // 3. 抓取並解析
    const data = await fetcher.fetchAndParseInitialState(url, `kline_${stock.stockCode}`);
    
    // 4. 提取 OHLC
    const stockInfo = data?.stock_info;
    if (!stockInfo) {
      console.error(`${stock.stockCode}: 找不到 stock_info`);
      return null;
    }
    
    const klineData = {
      open: parseFloat(stockInfo.priceOpen) || null,
      high: parseFloat(stockInfo.priceHighest) || null,
      low: parseFloat(stockInfo.priceLowest) || null,
      close: parseFloat(stock.priceNominal) || null
    };
    
    // 5. 驗證數據完整性
    if (!klineData.open || !klineData.high || !klineData.low || !klineData.close) {
      console.error(`${stock.stockCode}: K線數據不完整`, klineData);
      return null;
    }
    
    // 6. 寫入快取
    cache.set('kline', stock.stockCode, klineData);
    return klineData;
    
  } catch (error) {
    console.error(`處理 ${stock.stockCode} K線數據失敗: ${error.message}`);
    return null;
  }
}
```

**數據來源說明**:
- 數據位於 `window.__INITIAL_STATE__.stock_info` 物件中
- `priceOpen`: 開盤價
- `priceHighest`: 最高價
- `priceLowest`: 最低價
- `price` / `priceNominal`: 收盤價（現價）

**URL 規則**:
- 美股 Stock: `https://www.futunn.com/hk/stock/{code}-US`
- 美股 ETF: `https://www.futunn.com/hk/etfs/{code}-US`
- 港股 Stock: `https://www.futunn.com/hk/stock/{code}-HK`
- 港股 ETF: `https://www.futunn.com/hk/etfs/{code}-HK`

#### enrichStockData
```javascript
async function enrichStockData(data, fetcher, cache, market) {
  const enrichedData = await Promise.all(data.map(async (stock) => {
    const industry = await fetchSingleIndustry(stock, fetcher, cache, market);
    
    let callRatio = '--';
    if (market === 'US') {
      callRatio = await fetchSingleCallRatio(stock, fetcher, cache);
    }
    
    // K 線數據補充
    const klineData = await fetchSingleKlineData(stock, fetcher, cache, market);
    
    return { ...stock, industry, callRatio, klineData };
  }));
  
  return enrichedData;
}
```

---

## Feature 4: 快取管理系統

### Description
v2.1 新增 K 線快取類型。

### Class: CacheManager

```javascript
class CacheManager {
  constructor(config: Object)
  get(type: string, keyOrMarket: string): any
  set(type: string, keyOrDataOrMarket: string, value: any): void
}
```

### Logic Steps

#### 1. 初始化
```javascript
constructor(config) {
  this.config = config;
  this.fm = FileManager.local();
  
  this.paths = {
    main: {
      US: this.fm.joinPath(this.fm.documentsDirectory(), 'futunn_stock_cache_us.json'),
      HK: this.fm.joinPath(this.fm.documentsDirectory(), 'futunn_stock_cache_hk.json')
    },
    options: this.fm.joinPath(this.fm.documentsDirectory(), 'futunn_options_cache.json'),
    industry: this.fm.joinPath(this.fm.documentsDirectory(), 'futunn_industry_cache.json'),
    kline: this.fm.joinPath(this.fm.documentsDirectory(), 'futunn_kline_cache.json')
  };
  
  this.durations = {
    main: config.CACHE_DURATION,
    options: config.OPTIONS_CACHE_DURATION,
    industry: config.INDUSTRY_CACHE_DURATION,
    kline: config.KLINE_CACHE_DURATION
  };
}
```

### Cache Structure

#### K 線快取
```javascript
// futunn_kline_cache.json
{
  "NVDA": {
    value: {
      open: 425.50,
      high: 441.46,
      low: 423.60,
      close: 438.92
    },
    timestamp: "2025-10-20T10:30:00.000Z"
  },
  "00700": {
    value: {
      open: 380.00,
      high: 387.20,
      low: 378.50,
      close: 385.20
    },
    timestamp: "2025-10-20T10:30:00.000Z"
  }
}
```

---

## Feature 5: 市場決策引擎

### Description
自動判斷應顯示哪個市場（美股或港股）。

### Function: resolveMarketAuto

```javascript
function resolveMarketAuto(): 'US' | 'HK'
```

### 決策邏輯
1. 優先顯示開盤中的市場
2. 兩市都收盤時，根據時段判斷
3. 預設返回美股

---

## Feature 6: 資料處理與過濾

### Key Functions

#### filterData
```javascript
function filterData(stockList) {
  return stockList
    .filter(stock =>
      (CONFIG.SHOW_STOCK && stock.instrumentType === 3) ||
      (CONFIG.SHOW_ETF && stock.instrumentType === 4)
    )
    .slice(0, CONFIG.MAX_ITEMS)
    .map((stock, index) => ({
      rank: index + 1,
      stockCode: stock.stockCode,
      stockName: stock.stockName || '--',
      priceNominal: parseFloat(stock.priceNominal) || 0,
      changeRatio: stock.changeRatio,
      changeRatioNum: parseFloat(stock.changeRatio) || 0,
      tradeTrunover: stock.tradeTrunover,
      volumnRatio: parseFloat(stock.volumnRatio) || 0,
      instrumentType: stock.instrumentType,
    }));
}
```

---

## Feature 7: 色彩計算系統

### Class: ColorCalculator

```javascript
class ColorCalculator {
  constructor(config: Object)
  getChangeRatioColor(ratio: number): Color
  getCallRatioColor(ratio: number): Color
  getVolumnRatioColor(ratio: number): Color
}
```

### 色彩系統
- **漲跌幅**: 階梯式 5 級漲色 + 5 級跌色
- **Call%**: 5 段式色塊（過度悲觀→偏空→中性→偏多→過度樂觀）
- **量比**: 冷→熱漸變色（藍灰→藍→綠→黃橙→紅）

---

## Feature 8: Widget 建構引擎

### Key Functions

#### createWidget
```javascript
async function createWidget(stockData, updateTime, maxTurnover, colorCalc, market) {
  const widget = new ListWidget();
  widget.backgroundColor = CONFIG.COLORS.background;
  widget.spacing = 0;
  widget.setPadding(0, 0, 0, 0);

  const visibleColumns = getActiveColumnSettings(market).filter(c => c.visible);

  createHeaderRow(widget, updateTime, visibleColumns, market);

  const totalBarWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0);

  for (const stock of stockData) {
    createDataRow(widget, stock, maxTurnover, totalBarWidth, visibleColumns, colorCalc, market);
  }

  return widget;
}
```

#### addColumnCell
```javascript
function addColumnCell(rowStack, col, stock, rowColor, colorCalc, market) {
  const colStack = rowStack.addStack();
  colStack.size = new Size(col.width, 0);
  colStack.centerAlignContent();

  // K 線欄位處理
  if (col.key === 'kline') {
    drawKline(colStack, stock.klineData, CONFIG.KLINE);
    return;
  }

  const value = formatColumnValue(col.key, stock, market);

  if (col.key === 'callRatio' && stock.callRatio !== '--') {
    addCallRatioLabel(colStack, value, stock.callRatio, colorCalc);
  } else {
    addTextCell(colStack, value, col.key, stock, rowColor, colorCalc);
  }
}
```

---

## Feature 9: K 線圖繪製系統

**NEW in v2.1**

### Description
繪製標準 K 線圖，包含上影線、實體、下影線三部分。

### Function: drawKline

```javascript
function drawKline(colStack: WidgetStack, klineData: Object, config: Object): void
```

### Logic Steps

#### 1. 數據驗證
```javascript
if (!klineData) {
  colStack.addSpacer();  // 無數據時顯示空白
  return;
}
```

#### 2. 判斷漲跌顏色
```javascript
const { open, high, low, close } = klineData;
const { WIDTH, HEIGHT, BODY_WIDTH, SHADOW_WIDTH, GAIN_COLOR, LOSS_COLOR, NEUTRAL_COLOR } = config;

let color;
if (close > open) {
  color = new Color(GAIN_COLOR);  // 綠漲
} else if (close < open) {
  color = new Color(LOSS_COLOR);  // 紅跌
} else {
  color = new Color(NEUTRAL_COLOR);  // 平盤
}
```

#### 3. 處理一字板
```javascript
const range = high - low;
if (range === 0) {
  // 一字板:繪製水平線
  const lineStack = colStack.addStack();
  lineStack.size = new Size(WIDTH, SHADOW_WIDTH);
  lineStack.backgroundColor = color;
  return;
}
```

#### 4. 計算各部分高度
```javascript
// 從上到下: 上影線 → 實體 → 下影線
const upperShadowHeight = ((high - Math.max(open, close)) / range) * HEIGHT;
const bodyHeight = (Math.abs(close - open) / range) * HEIGHT;
const lowerShadowHeight = ((Math.min(open, close) - low) / range) * HEIGHT;
```

#### 5. 建立 K 線容器
```javascript
const klineContainer = colStack.addStack();
klineContainer.layoutVertically();
klineContainer.size = new Size(WIDTH, HEIGHT);
klineContainer.centerAlignContent();
```

#### 6. 繪製上影線（置中對齊）
```javascript
if (upperShadowHeight > 0) {
  // 使用水平 stack 來置中
  const upperShadowRow = klineContainer.addStack();
  upperShadowRow.layoutHorizontally();
  upperShadowRow.size = new Size(WIDTH, upperShadowHeight);
  upperShadowRow.centerAlignContent();
  
  const upperShadow = upperShadowRow.addStack();
  upperShadow.size = new Size(SHADOW_WIDTH, upperShadowHeight);
  upperShadow.backgroundColor = color;
}
```

#### 7. 繪製實體
```javascript
if (bodyHeight > 0) {
  const body = klineContainer.addStack();
  body.size = new Size(BODY_WIDTH, Math.max(bodyHeight, 1)); // 最小 1px
  body.backgroundColor = color;
  body.cornerRadius = 0;
}
```

#### 8. 繪製下影線（置中對齊）
```javascript
if (lowerShadowHeight > 0) {
  // 使用水平 stack 來置中
  const lowerShadowRow = klineContainer.addStack();
  lowerShadowRow.layoutHorizontally();
  lowerShadowRow.size = new Size(WIDTH, lowerShadowHeight);
  lowerShadowRow.centerAlignContent();
  
  const lowerShadow = lowerShadowRow.addStack();
  lowerShadow.size = new Size(SHADOW_WIDTH, lowerShadowHeight);
  lowerShadow.backgroundColor = color;
}
```

### 技術要點

#### 影線置中對齊的關鍵
**問題**: 直接在垂直 stack 中設定 `centerAlignContent()` 無法讓影線置中

**解決方案**: 
1. 為每條影線建立一個**水平 stack 容器**
2. 容器寬度 = K 線總寬度 (WIDTH)
3. 在水平容器內使用 `centerAlignContent()` 實現置中
4. 容器內再放入實際的影線 stack

```javascript
// ❌ 錯誤寫法
const upperShadow = klineContainer.addStack();
upperShadow.size = new Size(SHADOW_WIDTH, upperShadowHeight);
upperShadow.centerAlignContent();  // 無效

// ✅ 正確寫法
const upperShadowRow = klineContainer.addStack();
upperShadowRow.layoutHorizontally();  // 水平排列
upperShadowRow.size = new Size(WIDTH, upperShadowHeight);
upperShadowRow.centerAlignContent();  // 在水平方向置中

const upperShadow = upperShadowRow.addStack();
upperShadow.size = new Size(SHADOW_WIDTH, upperShadowHeight);
upperShadow.backgroundColor = color;
```

### K 線配置參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `WIDTH` | 8 | K 線總寬度（含影線空間） |
| `HEIGHT` | 12 | K 線總高度 |
| `BODY_WIDTH` | 8 | 實體寬度（填滿） |
| `SHADOW_WIDTH` | 1.5 | 影線寬度 |
| `GAIN_COLOR` | #00C46B | 綠色（漲） |
| `LOSS_COLOR` | #FF3B3B | 紅色（跌） |
| `NEUTRAL_COLOR` | #CCCCCC | 灰色（平盤） |

### 顏色規則

**統一採用「綠漲紅跌」配色**，與港股市場習慣一致：
- 收盤價 > 開盤價 → 綠色
- 收盤價 < 開盤價 → 紅色
- 收盤價 = 開盤價 → 灰色

### 容錯處理

1. **無數據**: 返回 null 時顯示空白，不阻斷其他股票渲染
2. **數據不完整**: 驗證 OHLC 四個值都存在，否則記錄錯誤並返回 null
3. **一字板**: high = low 時繪製水平線
4. **極小實體**: bodyHeight < 1 時設為最小 1px

### K 線數據結構

```javascript
// 單支股票的 K 線數據
{
  open: 425.50,    // 開盤價
  high: 441.46,    // 最高價
  low: 423.60,     // 最低價
  close: 438.92    // 收盤價（現價）
}
```

### 完整範例

```javascript
// 漲的 K 線 (close > open)
{
  open: 100,
  high: 110,
  low: 95,
  close: 105
}
// → 綠色 K 線: 上影線(110-105) + 綠實體(105-100) + 下影線(100-95)

// 跌的 K 線 (close < open)
{
  open: 100,
  high: 105,
  low: 90,
  close: 92
}
// → 紅色 K 線: 上影線(105-100) + 紅實體(100-92) + 下影線(92-90)

// 一字板 (high = low)
{
  open: 100,
  high: 100,
  low: 100,
  close: 100
}
// → 灰色水平線
```

---

## Feature 10: 錯誤處理與除錯

### Description
改進除錯檔案儲存與錯誤訊息處理。

### 錯誤處理策略

**錯誤級別定義**:
- **Critical Error (拋出錯誤)**: 主列表抓取失敗、JSON 解析失敗、快取讀寫失敗等會導致 Widget 無法運作的錯誤
- **Warning (記錄並繼續)**: 個別股票的產業/期權/K線資料抓取失敗，不影響整體運作

### Key Functions

#### saveDebugFile
```javascript
function saveDebugFile(filename, content) {
  try {
    const fm = FileManager.local();
    const path = fm.joinPath(fm.documentsDirectory(), filename);
    fm.writeString(path, content);
    console.log(`除錯檔案已儲存: ${filename}`);
  } catch (e) {
    console.error(`除錯檔案儲存失敗: ${e.message}`);
  }
}
```

#### 主函式錯誤處理
```javascript
async function main() {
  try {
    const market = CONFIG.MARKET === 'AUTO' ? resolveMarketAuto() : CONFIG.MARKET;
    const cache = new CacheManager(CONFIG);
    const fetcher = new DataFetcher(CONFIG);
    const colorCalc = new ColorCalculator(CONFIG);

    // 1. 取得主列表資料（使用市場特定快取）
    let stockData = cache.get('main', market);
    if (!stockData?.data?.length) {
      const rawData = await fetchStockData(fetcher, market);
      if (!rawData || rawData.length === 0) {
        throw new Error('抓取的成交額資料為空');
      }
      stockData = { data: rawData, timestamp: new Date() };
      cache.set('main', market, stockData);
    }

    // 2. 過濾資料
    const filteredData = filterData(stockData.data);
    if (filteredData.length === 0) {
      throw new Error('過濾後無資料可顯示');
    }

    // 3. 並發抓取補充資料
    const enrichedData = await enrichStockData(filteredData, fetcher, cache, market);

    // 4. 計算最大成交額用於進度條寬度
    const maxTurnover = enrichedData.length > 0
      ? parseTurnoverToNumber(enrichedData[0].tradeTrunover)
      : 0;

    // 5. 建立 Widget
    const widget = await createWidget(
      enrichedData,
      new Date(stockData.timestamp),
      maxTurnover,
      colorCalc,
      market
    );

    // 6. 顯示
    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      widget.presentLarge();
    }
  } catch (error) {
    console.error(error.message);
    const errorWidget = createErrorWidget(error.message);
    if (config.runsInWidget) {
      Script.setWidget(errorWidget);
    } else {
      errorWidget.presentLarge();
    }
  } finally {
    Script.complete();
  }
}
```

### Debug File Locations
- `debug_turnover_US_html.txt` - 美股主列表 HTML
- `debug_turnover_HK_html.txt` - 港股主列表 HTML
- `debug_turnover_US_json_error.txt` - 美股 JSON 解析錯誤
- `debug_turnover_HK_json_error.txt` - 港股 JSON 解析錯誤
- `debug_options_${stockCode}_html.txt` - 期權頁面 HTML（抓取失敗時）
- `debug_options_${stockCode}_json_error.txt` - 期權 JSON 解析錯誤
- `debug_industry_${stockCode}.txt` - TradingView 頁面 HTML（解析失敗時）
- `debug_kline_${stockCode}_html.txt` - K 線頁面 HTML（抓取失敗時）
- `debug_kline_${stockCode}_json_error.txt` - K 線 JSON 解析錯誤

---

## 實作順序建議（v2.1）

### 階段 1：核心類別重構（40%）- 已完成 ✅

#### 1.1 RequestQueue 類別 ✅
- [x] 實作 `RequestQueue` 類別
- [x] 實作 `add()` 方法
- [x] 實作 `process()` 方法
- [x] 測試：並發請求控制

#### 1.2 DataFetcher 類別 ✅
- [x] 實作 `DataFetcher` 類別
- [x] 實作 `buildHeaders()` 方法
- [x] 實作 `fetchWithRetry()` 帶重試機制
- [x] 實作 `delay()` 輔助函式
- [x] 實作 `fetchAndParseInitialState()` 統一解析
- [x] 測試：重試機制與超時控制

#### 1.3 CacheManager 類別 ✅
- [x] 實作 `CacheManager` 類別
- [x] 分離主列表/期權/產業快取路徑
- [x] 實作 `get()` 支援市場特定快取
- [x] 實作 `set()` 支援市場特定快取
- [x] 測試：美股/港股快取獨立運作

#### 1.4 ColorCalculator 類別 ✅
- [x] 實作 `ColorCalculator` 類別
- [x] 內建 `Map` 快取機制
- [x] 實作 `get*` 系列方法（帶快取）
- [x] 實作 `calculate*` 系列方法
- [x] 實作色彩插值輔助函式
- [x] 測試：快取命中率

### 階段 2：市場決策優化（10%）- 已完成 ✅

#### 2.1 時區處理簡化 ✅
- [x] 使用 `toLocaleString` 取代手動計算
- [x] 移除夏令時判斷邏輯
- [x] 測試：不同時區正確切換

### 階段 3：資料抓取改進（20%）- 已完成 ✅

#### 3.1 主列表抓取 ✅
- [x] 整合 `fetchAndParseInitialState`
- [x] 改進錯誤處理與除錯檔案儲存
- [x] 測試：美股/港股資料正確解析

#### 3.2 補充資料抓取 ✅
- [x] 改進 `generateTradingViewUrl` 處理港股前導零
- [x] 優化 `fetchSingleCallRatio` 錯誤處理
- [x] 優化 `fetchSingleIndustry` 錯誤處理
- [x] 測試：並發補充資料正確

### 階段 4：Widget 建構優化（15%）- 已完成 ✅

#### 4.1 UI 常數管理 ✅
- [x] 新增 `CONFIG.UI` 常數
- [x] 統一管理 padding、corner radius 等
- [x] 測試：UI 一致性

#### 4.2 欄位處理改進 ✅
- [x] 區分美股/港股欄位配置
- [x] 港股顯示股票名稱取代代號
- [x] 美股代號去前導零
- [x] 測試：欄位顯示正確

### 階段 5：K 線圖功能實作（15%）

#### 5.1 配置與快取擴充 ✅
- [x] 新增 `CONFIG.KLINE` 配置區塊
- [x] 新增 `KLINE_CACHE_DURATION` 設定
- [x] 擴充 `CacheManager` 支援 K 線快取
- [x] 測試：K 線快取讀寫正確

#### 5.2 數據抓取 ✅
- [x] 實作 `fetchSingleKlineData()` 函式
- [x] 整合至 `enrichStockData()` 並發補充
- [x] 測試：OHLC 數據正確抓取

#### 5.3 K 線繪製 ✅
- [x] 實作 `drawKline()` 函式
- [x] 實作上影線置中對齊邏輯
- [x] 實作實體繪製
- [x] 實作下影線置中對齊邏輯
- [x] 處理一字板特殊情況
- [x] 測試：K 線圖視覺正確

#### 5.4 欄位整合 ✅
- [x] 調整 `COLUMN_SETTINGS_US` 加入 `kline` 欄位
- [x] 調整 `COLUMN_SETTINGS_HK` 加入 `kline` 欄位
- [x] 修改 `addColumnCell()` 處理 K 線欄位
- [x] 調整成交額、量比欄位寬度
- [x] 測試：欄位對齊正確

#### 5.5 容錯與除錯 ✅
- [x] 數據驗證（OHLC 完整性檢查）
- [x] 繪圖容錯（無數據時顯示空白）
- [x] 除錯檔案儲存（K 線抓取失敗時）
- [x] 測試：個別失敗不影響整體

### 階段 6：整合測試（100% 完成）✅

#### 6.1 完整流程測試 ✅
- [x] 測試美股模式完整流程（含 K 線圖）
- [x] 測試港股模式完整流程（含 K 線圖）
- [x] 測試 AUTO 模式切換
- [x] 測試快取機制（含 K 線快取）
- [x] 測試錯誤處理

#### 6.2 視覺驗收 ✅
- [x] K 線圖位置正確（代號/名稱 與 漲跌% 之間）
- [x] K 線影線置中對齊
- [x] 顏色遵循「綠漲紅跌」規則
- [x] 實體與影線比例正確
- [x] 一字板顯示正確

#### 6.3 效能測試 ✅
- [x] 測試並發請求效能
- [x] 測試 K 線快取效能
- [x] 測試色彩快取效能
- [x] 測試記憶體使用

---

## 關鍵 API 參考

### Scriptable APIs（v2.1）

#### FileManager
**說明**: 檔案管理器，支援本地與 iCloud 兩種模式。
- **local()**: 快速存取，資料存於本機，適合快取用途
- **iCloud()**: 跨裝置同步，資料存於 iCloud Drive，適合設定檔或需同步的資料

```javascript
const fm = FileManager.local(); // 本地快取（推薦）
fm.documentsDirectory();
fm.fileExists(path);
fm.readString(path);
fm.writeString(path, content);
fm.joinPath(dir, filename);
```

#### Request
```javascript
const req = new Request(url);
req.headers = {...};
req.timeoutInterval = 10; // 秒
const response = await req.loadString();
```

#### ListWidget
```javascript
const widget = new ListWidget();
widget.backgroundColor = color;
widget.spacing = 0;
widget.setPadding(top, leading, bottom, trailing);

const stack = widget.addStack();
stack.layoutHorizontally();  // 或 layoutVertically()
stack.centerAlignContent();
stack.size = new Size(width, height);

const text = stack.addText(string);
text.font = Font.mediumSystemFont(size);
text.textColor = color;
text.lineLimit = 1;
```

#### Color
```javascript
const color = new Color('#FFFFFF');
const dynamicColor = Color.dynamic(lightColor, darkColor);
const transparentColor = new Color('#888888', 0.2);
```

#### DateFormatter
```javascript
const formatter = new DateFormatter();
formatter.dateFormat = 'HH:mm';
const timeString = formatter.string(date);
```

#### Date with Timezone
```javascript
const now = new Date();
const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
const hk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
```

---

## 效能優化建議（v2.1）

### 1. 並發請求優化
- ✅ 使用 `RequestQueue` 控制並發數（預設 10）
- ✅ 可透過 `MAX_CONCURRENT_REQUESTS` 調整
- ✅ 自動佇列管理，避免過載

### 2. 快取策略優化
- ✅ 主列表：1 分鐘（平衡即時性與效能）
- ✅ 期權：1 分鐘（變動較快）
- ✅ 產業：24 小時（變動極慢）
- ✅ **K 線：1 分鐘**（即時更新，v2.1 新增）
- ✅ 獨立美股/港股快取，避免誤用
- ✅ 使用 `FileManager.local()` 提升讀寫速度

### 3. 色彩計算優化
- ✅ `ColorCalculator` 內建 `Map` 快取
- ✅ 避免重複計算相同數值
- ✅ 插值計算僅在需要時執行

### 4. K 線繪製優化（v2.1 新增）
- ✅ 預先計算高度比例，一次繪製完成
- ✅ 使用固定尺寸（8x12），避免動態計算
- ✅ 影線置中使用巢狀 stack 架構
- ✅ 最小實體高度 1px 確保可見性

### 5. 錯誤處理優化
- ✅ 請求重試機制（預設 3 次）
- ✅ 指數退避避免連續失敗
- ✅ 個別股票失敗不影響整體
- ✅ 除錯檔案自動儲存

### 6. Widget 渲染優化
- ✅ 限制 MAX_ITEMS ≤ 20（Large Widget 高度限制）
- ✅ 使用固定寬度避免佈局計算
- ✅ 預先計算最大成交額用於進度條

---

## 常見問題排查（v2.1）

### 問題 1：Widget 顯示空白
**檢查項目**：
- [ ] 腳本是否完整複製？
- [ ] Widget 尺寸是否為 Large？
- [ ] 是否選擇正確腳本？
- [ ] Console 有無錯誤訊息？
- [ ] 檢查 `config.runsInWidget` 判斷

### 問題 2：抓取資料失敗
**檢查項目**：
- [ ] 網路連線是否正常？
- [ ] 是否需要設定 Cookie？
- [ ] 查看除錯檔案內容
- [ ] Futunn 網站是否可訪問？
- [ ] 檢查 `REQUEST_TIMEOUT` 設定

### 問題 3：快取未更新
**檢查項目**：
- [ ] 快取時效是否正確設定？
- [ ] 刪除快取檔案測試
- [ ] 檢查檔案時間戳記
- [ ] 確認市場代碼正確（US/HK）

### 問題 4：色彩顯示異常
**檢查項目**：
- [ ] CONFIG.COLORS 是否正確？
- [ ] 深淺色模式是否匹配？
- [ ] changeRatioNum 是否為數值？
- [ ] 檢查 ColorCalculator 快取

### 問題 5：並發請求過多
**檢查項目**：
- [ ] 調整 `MAX_CONCURRENT_REQUESTS` 為較小值
- [ ] 檢查 `MAX_ITEMS` 設定
- [ ] 確認快取正常運作
- [ ] 檢查 RequestQueue 佇列狀態

### 問題 6：K 線圖不顯示（v2.1 新增）
**檢查項目**：
- [ ] 檢查 `stock.klineData` 是否為 null
- [ ] 查看 Console 的 K 線抓取錯誤訊息
- [ ] 檢查除錯檔案 `debug_kline_${stockCode}_*.txt`
- [ ] 確認個股頁面 URL 正確
- [ ] 驗證 `stock_info` 數據結構

### 問題 7：K 線影線沒有置中（v2.1 新增）
**檢查項目**：
- [ ] 確認影線使用巢狀 stack 架構
- [ ] 檢查外層 stack 的 `layoutHorizontally()` 是否設定
- [ ] 驗證 `centerAlignContent()` 在正確的 stack 上
- [ ] 檢查 `SHADOW_WIDTH` 和 `WIDTH` 設定

### 問題 8：K 線顏色錯誤（v2.1 新增）
**檢查項目**：
- [ ] 確認 `close` 和 `open` 數值正確
- [ ] 檢查 `GAIN_COLOR` 和 `LOSS_COLOR` 設定
- [ ] 驗證顏色判斷邏輯（close > open 為漲）
- [ ] 測試一字板情況（close = open）

---

## 附錄：完整資料結構範例（v2.1）

### 美股資料
```javascript
{
  rank: 1,
  stockCode: "NVDA",
  stockName: "NVIDIA Corp",
  priceNominal: 181.57,
  changeRatio: "+3.58%",
  changeRatioNum: 3.58,
  tradeTrunover: "13.79B",
  volumnRatio: 1.88,
  instrumentType: 3,
  industry: "半導體",
  callRatio: 52,
  klineData: {
    open: 175.20,
    high: 182.50,
    low: 174.80,
    close: 181.57
  }
}
```

### 港股資料
```javascript
{
  rank: 1,
  stockCode: "00700",
  stockName: "騰訊控股",
  priceNominal: 385.20,
  changeRatio: "+2.15%",
  changeRatioNum: 2.15,
  tradeTrunover: "123.5億",
  volumnRatio: 1.25,
  instrumentType: 3,
  industry: "金融服務",
  callRatio: "--",  // 港股不顯示
  klineData: {
    open: 380.00,
    high: 387.20,
    low: 378.50,
    close: 385.20
  }
}
```

### 配置範例
```javascript
{
  MARKET: 'AUTO',
  SHOW_STOCK: true,
  SHOW_ETF: true,
  MAX_ITEMS: 20,
  FONT_SIZE: 12,
  CACHE_DURATION: 1,
  OPTIONS_CACHE_DURATION: 1,
  INDUSTRY_CACHE_DURATION: 1440,
  KLINE_CACHE_DURATION: 1,
  MAX_CONCURRENT_REQUESTS: 10,
  REQUEST_RETRY_COUNT: 3,
  REQUEST_TIMEOUT: 10000,
  KLINE: {
    WIDTH: 8,
    HEIGHT: 12,
    BODY_WIDTH: 8,
    SHADOW_WIDTH: 1.5,
    GAIN_COLOR: '#00C46B',
    LOSS_COLOR: '#FF3B3B',
    NEUTRAL_COLOR: '#CCCCCC'
  }
}
```

---

## 版本歷史

### v2.1 (2025-10-20)
- 新增 K 線圖功能
- 從 FutuNN 個股頁面抓取 OHLC 數據
- 實作 `fetchSingleKlineData()` 函式
- 實作 `drawKline()` 繪圖函式
- 新增 K 線快取系統
- 調整美股/港股欄位配置
- 改進影線置中對齊邏輯
- K 線顏色採用「綠漲紅跌」配色

### v2.0 (2025-10-17)
- 重構為物件導向架構
- 新增 RequestQueue、DataFetcher、CacheManager、ColorCalculator 類別
- 優化時區處理使用 toLocaleString
- 改進快取系統支援市場特定快取
- 新增色彩快取機制
- 優化並發請求管理
- 改進錯誤處理與除錯
- 修正文檔所有已知問題

### v1.0 (2025-10-16)
- 初始版本
- 基本功能實作

---

**文件版本**: 2.1  
**最後更新**: 2025-10-20  
**適用對象**: AI 程式碼生成工具、開發者  
**維護狀態**: ✅ 已驗證與 myScriptable.js v2.1 完全同步