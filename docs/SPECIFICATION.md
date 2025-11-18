# iOS Scriptable 股票 Widget **v2.8.0** 規格文件

**版本**: 2.8.0-RandomSparkline  
**平台**: iOS Scriptable v1.7+  
**發布日期**: 2025-11-19  
**GitHub**: [https://github.com/hin88188/ios-scriptable-stock-widget/](https://github.com/hin88188/ios-scriptable-stock-widget/)

---

## 📋 版本更新總覽

| 版本 | 日期 | 主要特色 | 文件同步 |
|------|------|----------|----------|
| **2.8.0** | 2025-11-19 | **分時走勢隨機模式** (Rank/Cus) | ✅ |
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

## 🏗️ 核心組件（v2.8.0）

### **1. 隨機選擇引擎 (Random Selection Engine)**
位於 `MiniTimesharesSparklineWidget.js`，負責決定顯示的股票。
- **`none` 模式**: 解析 `widgetParameter` 或 `CONFIG.symbol`，取逗號分隔的第一個代碼。
- **`cus` (Custom) 模式**: 解析逗號分隔列表，純隨機選取一支。
- **`rank` (Ranking) 模式**: 
  - 自動判斷市場 (US/HK)。
  - 呼叫 Ranking API 獲取前 `RANK_TOP_N` (預設50) 檔股票。
  - 純隨機選取一支。
  - 具備 1 分鐘快取 (`sparkline_ranking_XX.json`)。

### **2. API 抽象層** `LbkrsClient`
```javascript
class LbkrsClient {
  // 集中管理所有 Lbkrs endpoint
  BASE: 'https://m-gl.lbkrs.com'
  getRankingList(market: 'US'|'HK')
  getDetailByCounterId(counterId)
  getTimeshares(counterId, period: '1d'|'5d')
}
```

### **3. 專業快取系統**
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

## 🧪 效能基準（v2.8.0）

| 指標 | v2.7.0 | v2.8.0 | 備註 |
|------|--------|--------|------|
| **Large Widget** | <3.2s | <3.2s | 無變更 |
| **Medium (固定)** | <2.5s | <2.5s | `RANDOM: 'none'` |
| **Medium (Rank)** | - | <3.5s | 首次需抓取排行 API |
| **All Periods** | <3s | <3s | 並行請求 |
| **快取命中** | <0.4s | <0.4s | 包含 Sparkline Ranking |

---

**文件版本**: v2.8.0-RandomSparkline  
**最後更新**: 2025-11-19  
**狀態**: ✅ 與原始碼 **100% 同步**