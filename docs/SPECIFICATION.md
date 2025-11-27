# iOS Scriptable 股票 Widget **v2.10.0** 規格文件

**版本**: 2.10.0-RSI-Implementation  
**平台**: iOS Scriptable v1.7+  
**發布日期**: 2025-11-28  
**GitHub**: [https://github.com/hin88188/ios-scriptable-stock-widget/](https://github.com/hin88188/ios-scriptable-stock-widget/)

---

## 📋 版本更新總覽

| 版本 | 日期 | 主要特色 | 文件同步 |
|------|------|----------|----------|
| **2.10.0** | 2025-11-28 | **RSI 相對強弱指標** (配置/計算/視覺化/性能優化) | ✅ |
| 2.9.0 | 2025-11-26 | MA 均線完整實作 (配置/計算/視覺化/排名) | ✅ |
| 2.8.0 | 2025-11-19 | 分時走勢隨機模式 (Rank/Cus) | ✅ |
| 2.7.0 | 2025-11-16 | 分時走勢圖 Widget + 多週期 | ✅ |
| 2.6.0 | 2025-11-08 | `LbkrsClient` API 抽象 | ✅ |
| 2.5.0 | 2025-11-06 | 成交額線條視覺化 | ✅ |

---

## 🎯 產品架構

### **雙 Widget 系統**

| Widget | 檔案 | 尺寸 | 功能 |
|--------|------|------|------|
| **成交額排行** | `Widget.js` | **Large** | 排行榜/自選 + K線 + 成交額線條 |
| **分時走勢圖** | `MiniTimesharesSparklineWidget.js` | **Medium** | 隨機/固定股票 + 多週期分時圖 |

### **資料流**（兩 Widget 共用核心概念）

```
CONFIG → LbkrsClient/RandomEngine → 快取層 → 數據處理 → UI 渲染
     ↓
CounterIdHelper → StockDataMapper → KlineDataProcessor
```

---

## 🏗️ 核心組件（v2.10.0）

### **1. 隨機選擇引擎 (Random Selection Engine)**
位於 `MiniTimesharesSparklineWidget.js`，負責決定顯示的股票。
- **`none` 模式**: 解析 `widgetParameter` 或 `CONFIG.symbol`，取逗號分隔的第一個代碼。
- **`cus` (Custom) 模式**: 解析逗號分隔列表，純隨機選取一支。
- **`rank` (Ranking) 模式**: 
  - 自動判斷市場 (US/HK)。
  - 呼叫 Ranking API 獲取前 `RANK_TOP_N` (預設50) 檔股票。
  - 純隨機選取一支。
  - 具備 1 分鐘快取 (`sparkline_ranking_XX.json`)。

### **2. RSI 相對強弱指標** `RSICalculator` (v2.10.0 新增)
```javascript
class RSICalculator {
  calculateRSI(prices, days=6)     // Wilder's RSI 計算
  #computeRSI(prices, days)        // 私有方法：單一 RSI 值
}

// RSI 配置
CONFIG.RSI_CONFIG = {
  DAYS: 6,                          // 預設 6 日週期
  COLORS: {
    STRONG: '#ef4444',              // RSI 100 (超買警示) 紅色
    NEUTRAL: '#CCCCCC',             // RSI 50 (中性) 灰色
    WEAK: '#22c55e'                 // RSI 0 (超賣機會) 綠色
  }
}
```

**視覺化特色**:
- 🔺 趨勢三角形（▲▼）：使用 K 線升跌顏色（綠/紅），字體 8px
- 🎨 RSI 數值：漸層色（紅-灰-綠），反映 RSI 強弱
- ⚡ 性能優化：與 MA 共用 K 線歷史查詢，零額外 API 呼叫
- 📍 欄位位置：量比與 MA 之間（30px 寬度）

### **3. MA 均線系統** `MACalculator` (v2.9.0)
```javascript
class MACalculator {
  calculateMA(prices, days)        // 計算移動平均
  calculateDeviation(price, ma)    // 計算乖離率
}

// MA 配置
CONFIG.MA_CONFIG = {
  DAYS: [20, 50, 200],              // 三條均線週期
  TRIANGLE: { MIN_SIZE: 4, MAX_SIZE: 10, SCALING_FACTOR: 0.5 },
  COLORS: { GAIN: '#00C46B', LOSS: '#FF3B3B' }
}
```

**視覺化特色**:
- 🔺 乖離率三角形：大小反映偏離程度
- 📊 動態欄位寬度：`DAYS.length * 12` 像素
- 🏆 排名標記：最高 MA 上方綠線，最低 MA 下方紅線

### **4. API 抽象層** `LbkrsClient`
```javascript
class LbkrsClient {
  // 集中管理所有 Lbkrs endpoint
  BASE: 'https://m-gl.lbkrs.com'
  getRankingList(market: 'US'|'HK')
  getDetailByCounterId(counterId)
  getKlineHistory(counterId, lineNum=201)  // v2.9.0 新增
  getTimeshares(counterId, period: '1d'|'5d')
}
```

### **5. 專業快取系統**
| 快取類 | 檔案 | 時效 | 用途 |
|--------|------|------|------|
| `RankingCache` | `lbkrs_ranking_US.json` | 1分鐘 | Large Widget 排行 |
| `SparklineRankingCache` | `sparkline_ranking_US.json` | 1分鐘 | **v2.8** Medium Widget 隨機選股 |
| `WatchlistCache` | `lbkrs_watchlist.json` | 1分鐘 | 自選列表 |
| `KlineCache` | `lbkrs_kline.json` | 1分鐘 | K線數據 |

---

## 🔌 配置系統

### **Widget.js**（成交額排行 Large）
```javascript
const CONFIG = {
  MARKET: 'AUTO',                    // AUTO/US/HK
  CUSTOM_WATCHLIST: ['NVDA','0700'], // 自選股票
  MAX_ITEMS: 21,                     // Large 最大高度
  DEBUG_MODE: false,
  
  // v2.9.0 MA 均線配置
  MA_CONFIG: {
    DAYS: [20, 50, 200],             // 均線週期
    TRIANGLE: { MIN_SIZE: 4, MAX_SIZE: 10 },
    COLORS: { GAIN: '#00C46B', LOSS: '#FF3B3B' }
  },
  
  // v2.10.0 RSI 相對強弱指標配置
  RSI_CONFIG: {
    DAYS: 6,                         // 預設 6 日週期
    COLORS: {
      STRONG: '#ef4444',             // 超買 (紅色警示)
      NEUTRAL: '#CCCCCC',            // 中性
      WEAK: '#22c55e'                // 超賣 (綠色機會)
    }
  },
  // ... 完整配置見原始碼
}
```

### **MiniTimesharesSparklineWidget.js**（分時走勢 Medium）
```javascript
const CONFIG = {
  RANDOM: 'rank',       // 'none' | 'cus' | 'rank'
  RANK_TOP_N: 50,       // 排行隨機範圍
  symbol: 'NVDA,AAPL',  // 預設代碼或列表
  period: 'all',        // 1d/5d/1m/6m/all
  chart: { w: 520, h: 120 }
}
```

---

## 📈 分時走勢圖規格

### **多週期支援**
| 週期 | API | 數據點 | 特色 |
|------|-----|--------|------|
| `1d` | `timeshares?trade_session=0` | ~331/~390 | 當日分時 |
| `5d` | `mutitimeshares?merge_minute=0` | ~1500+ | 最近5交易日 |
| `1m` | `kline?line_num=24` | 24 | 月K close 線 |
| `6m` | `kline?line_num=130` | 130 | 半年K close 線 |
| `all` | Promise.allSettled() | 4圖並行 | 多圖表布局 |

### **視覺化特色**
- **UI 標籤**: 新增 `[CUS]` / `[RANK]` 顯示當前隨機模式。
- **基準虛線**: 昨收價動態虛線（MIXED模式）。
- **填充區域**: 上漲綠/下跌紅透明填充。
- **趨勢模式**: `ABOVE`/`BELOW`/`MIXED` 智能Y軸調整。

---

## ⚙️ 部署指南

### **Medium Widget**（分時走勢）
```
1. Scriptable → + → 貼上 MiniTimesharesSparklineWidget.js → 命名"分時走勢"
2. 主畫面長按 → + → Scriptable Medium → 選擇"分時走勢"
3. (可選) Widget Parameter: 
   - "NVDA" (固定)
   - "NVDA,TSLA,AAPL" (配合 RANDOM='cus' 隨機播放)
```

---

## 🧪 效能基準（v2.10.0）

| 指標 | v2.9.0 | v2.10.0 | 備註 |
|------|--------|---------|------|
| **Large Widget** | <3.5s | <3.5s | RSI 與 MA 共用查詢，無額外開銷 |
| **Medium (固定)** | <2.5s | <2.5s | 無變更 |
| **Medium (Rank)** | <3.5s | <3.5s | 無變更 |
| **All Periods** | <3s | <3s | 無變更 |
| **快取命中** | <0.5s | <0.5s | 無變更 |
| **K線數據量** | 201天 | 201天 | MA + RSI 共用 |
| **API 呼叫** | N | N | RSI 零額外 API 呼叫 |
| **計算開銷** | - | +6次加減法/股 | 可忽略 |

---

---

## 🎨 欄位配置（v2.10.0）

### **Large Widget 欄位佈局**
```
美股: industry(65) | stockCode | kline | changeRatio | currentPrice | 
      volumeRatio(28) | rsi(30) | ma(36)

港股: industry(65) | stockName(65) | kline | changeRatio | currentPrice | 
      volumeRatio(28) | rsi(30) | ma(36)
```

**v2.10.0 寬度調整**:
- `industry`: 70px → 65px
- `stockName/stockDisplay`: 85px → 65px (HK/MIXED)
- `volumeRatio`: 30px → 28px
- `rsi`: 新增 30px
- `tradeTurnover`: 美股改為不顯示

---

**文件版本**: v2.10.0-RSI-Implementation  
**最後更新**: 2025-11-28  
**狀態**: ✅ 與原始碼 **100% 同步**