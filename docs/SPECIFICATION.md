# iOS Scriptable 股票 Widget **v2.7.0** 規格文件

**版本**: 2.7.0-TimesharesSparkline  
**平台**: iOS Scriptable v1.7+  
**發布日期**: 2025-11-16  
**GitHub**: [https://github.com/hin88188/ios-scriptable-stock-widget/](https://github.com/hin88188/ios-scriptable-stock-widget/)

---

## 📋 版本更新總覽

| 版本 | 日期 | 主要特色 | 文件同步 |
|------|------|----------|----------|
| **2.7.0** | 2025-11-16 | **分時走勢圖 Widget** + 多週期 | ✅ |
| 2.6.0 | 2025-11-08 | `LbkrsClient` API 抽象 | ✅ |
| 2.5.0 | 2025-11-06 | 成交額線條視覺化 | ✅ |
| 2.4.0 | 2025-11-06 | 工具類 + 專業快取 | ✅ |

---

## 🎯 產品架構

### **雙 Widget 系統**（v2.7.0）

| Widget | 檔案 | 尺寸 | 功能 |
|--------|------|------|------|
| **成交額排行** | `Widget.js` | **Large** | 排行榜/自選 + K線 + 成交額線條 |
| **分時走勢圖** | `MiniTimesharesSparklineWidget.js` | **Medium** | 1d/5d/1m/6m/all 多週期分時圖 |

### **資料流**（兩 Widget 共用核心邏輯）

```
CONFIG → LbkrsClient → 快取層 → 數據處理 → UI 渲染
     ↓
CounterIdHelper → StockDataMapper → KlineDataProcessor
```

---

## 🏗️ 核心組件（v2.7.0）

### **1. API 抽象層** `LbkrsClient`
```javascript
class LbkrsClient {
  // 集中管理所有 Lbkrs endpoint
  BASE: 'https://m-gl.lbkrs.com'
  getRankingList(market: 'US'|'HK')
  getDetailByCounterId(counterId)
  getTimeshares(counterId, period: '1d'|'5d')
}
```

### **2. 工具類系統**
| 類別 | 職責 |
|------|------|
| `CounterIdHelper` | `ST/US/00700`、`ETF/HK/9988` 生成/解析 |
| `StockDataMapper` | 排行榜/Detail API → 統一數據格式 |
| `KlineDataProcessor` | K線驗證/重建/快取 |

### **3. 專業快取系統**
| 快取類 | 檔案 | 時效 |
|--------|------|------|
| `RankingCache` | `lbkrs_ranking_US.json` | 1分鐘 |
| `WatchlistCache` | `lbkrs_watchlist.json` | 1分鐘 |
| `KlineCache` | `lbkrs_kline.json` | 1分鐘 |

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
  symbol: 'NVDA',  // Widget 參數覆蓋
  period: 'all',   // 1d/5d/1m/6m/all
  chart: { w: 520, h: 120 }
}
```

---

## 📈 分時走勢圖規格（v2.7.0 新增）

### **多週期支援**
| 週期 | API | 數據點 | 特色 |
|------|-----|--------|------|
| `1d` | `timeshares?trade_session=0` | ~331（港股）/~390（美股） | 當日分時 |
| `5d` | `mutitimeshares?merge_minute=0` | ~1500-2000 | 最近5交易日串接 |
| `1m` | `kline?line_num=24` | 24 | 月K close 線 |
| `6m` | `kline?line_num=130` | 130 | 半年K close 線 |
| `all` | Promise.allSettled() | 4圖並行 | 多圖表布局 |

### **視覺化特色**
- **基準虛線** 昨收價動態虛線（MIXED模式）
- **填充區域** 上漲綠/下跌紅透明填充
- **趨勢模式** `ABOVE`/`BELOW`/`MIXED` 智能Y軸調整
- **百分比標籤** 各週期獨立漲跌幅顯示

---

## ⚙️ 部署指南

### **Large Widget**（成交額排行）
```
1. Scriptable → + → 貼上 Widget.js → 命名"股票排行"
2. 主畫面長按 → + → Scriptable Large → 選擇"股票排行"
3. 編輯 → When Interacting → "Run Script"
```

### **Medium Widget**（分時走勢）
```
1. Scriptable → + → 貼上 MiniTimesharesSparklineWidget.js → 命名"分時走勢"
2. 主畫面長按 → + → Scriptable Medium → 選擇"分時走勢"
3. 編輯 → Widget Parameter → "NVDA" 或 "0700"
```

### **自選股票配置**
```javascript
// Widget.js 第11行取消註解
CUSTOM_WATCHLIST: [
  'NVDA',    // 美股
  '0700',    // 港股騰訊
  'TSLA',    // 美股
  'SPY'      // 美股ETF
]
```

---

## 🧪 效能基準（v2.7.0）

| 指標 | v2.6.0 | v2.7.0 | 改善 |
|------|--------|--------|------|
| **Large Widget** | <4s | <3.2s | **-20%** |
| **Medium Widget** | - | <2.5s | 新增 |
| **All Periods** | - | <3s (並行) | 新增 |
| **快取命中** | <0.5s | <0.4s | **-20%** |
| **代碼行數** | 1050 | 2400 (+Sparkline) | 模組化 |

---

## 🔧 錯誤處理與除錯

### **常見錯誤檔案**
```
debug_ranking_US_error.txt      # 美股排行失敗
debug_stock_NVDA_error.txt      # 自選股票失敗
debug_kline_0700_error.txt      # K線失敗
debug_timeshares_error.txt      # 分時圖失敗
```

### **清除快取**
```javascript
// Scriptable App → 檔案 → 刪除所有 lbkrs_*.json
// 或程式碼清除
caches.ranking.clear();
caches.watchlist.clear();
caches.kline.clear();
```

---

## 📱 Widget 尺寸限制

| 尺寸 | Widget.js | MiniTimesharesSparklineWidget.js |
|------|-----------|---------------------------------|
| **Small** | ❌ 高度不足 | ❌ 高度不足 |
| **Medium** | ⚠️ 資料過少 | ✅ **完美適配** |
| **Large** | ✅ **完美適配** | ⚠️ 過高未優化 |

---

**文件版本**: v2.7.0-TimesharesSparkline  
**最後更新**: 2025-11-16 20:20 UTC+8  
**狀態**: ✅ 與原始碼 **100% 同步**