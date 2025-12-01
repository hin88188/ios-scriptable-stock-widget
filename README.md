# 📊 iOS Scriptable 股票 Widget

<div align="center">

[![Scriptable](https://img.shields.io/badge/Scriptable-1.7%2B-blue.svg)](https://apps.apple.com/app/scriptable/id1405459188)
[![GitHub](https://img.shields.io/badge/GitHub-hin88188%2Fios--scriptable--stock--widget-green.svg?logo=github)](https://github.com/hin88188/ios-scriptable-stock-widget)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

**港股/美股成交額排行 | 自選股票追蹤 | 分時走勢圖 | 隨機熱門股**

[📱 預覽](#-預覽) • [🚀 快速安裝](#-快速安裝) • [⚙️ 配置指南](#%EF%B8%8F-配置指南)

</div>

---

## ✨ 功能特色

| 特色 | 描述 |
|------|------|
| 🎯 **雙 Widget 系統** | **成交額排行**(`Widget.js`) + **分時走勢圖**(`MiniTimesharesSparklineWidget.js`) |
| 🏗️ **現代化架構** | **v3.1.0** 採用分層架構 (Layered Architecture) 與物件導向設計，高內聚低耦合 |
| ⚡ **極速效能** | 智慧並發請求 (Max 20) + 非阻塞延遲 + 統一數據獲取，載入速度提升顯著 |
| 🎲 **隨機展示** | 支援從自選列表或市場排行前 50 名中隨機顯示一支股票 |
| 🔄 **智能雙模式** | 自選股票優先，無自選自動切換排行榜 |
| 🌍 **自動市場識別** | 純數字→港股，字母→美股/ETF |
| 📈 **K線 + 分時圖** | Large顯示成交排行+K線，Medium顯示動態分時走勢(支援 1d/5d/1m/6m/All) |
| 📊 **技術指標** | RSI 相對強弱指標（6日週期）+ MA 均線（20/50/200日）+ 乖離率 |
| 🎨 **階梯配色** | 漲跌幅5級漸變 + 量比冷熱色譜 + RSI 漸層色 |
| 💾 **通用快取** | `CacheService` 統一管理 JSON 快取，支援 TTL 過期控制 |

## 📱 預覽

### **Large Widget** - 成交額排行 + 自選股票 + K線

```
更新時間    名稱/代號      K線  漲跌%    價格   量比   RSI   MA
────────────────────────────────────────────────────────────
半導體     NVDA          📊  +3.58%  181.57  1.88  ▲65  ▲▲▲
金融服務   騰訊控股      📊  +2.15%  385.20  1.25  ▼45  ▲▲-
科技       TSLA          📊  -2.15%  242.30  2.34  ▼28  ▼▼▼
```

| 美股 | 港股 |
|-----|-----|
| ![美股](https://github.com/hin88188/ios-scriptable-stock-widget/blob/main/screenshot/us-stocks.png) | ![港股](https://github.com/hin88188/ios-scriptable-stock-widget/blob/main/screenshot/hk-stocks.png) |

### **Medium Widget** - 分時走勢圖（支援隨機/多週期）

```
14:30  [1d]  [RANK]  NVDA  181.57  +3.58%
[6m]  [1m]  [5d]  [1d]
+2.1%  -0.8%  +1.2%  +3.58%
```

| 全週期 | 1日 |
|-------|-------|
| ![全週期](https://github.com/hin88188/ios-scriptable-stock-widget/blob/main/screenshot/4-cycle-trend-chart.png) | ![1日](https://github.com/hin88188/ios-scriptable-stock-widget/blob/main/screenshot/1d-trend-chart.png) |

## 🚀 快速安裝

### 1. **下載 Scriptable**
[App Store](https://apps.apple.com/app/scriptable/id1405459188)

### 2. **匯入腳本**
```bash
# 方法1：Git Clone（推薦開發者）
git clone https://github.com/hin88188/ios-scriptable-stock-widget.git

# 方法2：直接下載
# 點擊綠色 "Code" → "Download ZIP"
```

### 3. **Large Widget** - 成交額排行
1. Scriptable → `+` 新增 → 貼上 [`src/Widget.js`](https://github.com/hin88188/ios-scriptable-stock-widget/blob/main/src/Widget.js) → 命名 **"股票排行"**
2. 長按主畫面 → `+` → **Scriptable Large** → 編輯 → 選擇 **"股票排行"**

### 4. **Medium Widget** - 分時走勢圖
1. Scriptable → `+` 新增 → 貼上 [`src/MiniTimesharesSparklineWidget.js`](https://github.com/hin88188/ios-scriptable-stock-widget/blob/main/src/MiniTimesharesSparklineWidget.js) → 命名 **"分時走勢"**
2. 長按主畫面 → `+` → **Scriptable Medium** → 編輯 → 選擇 **"分時走勢"**
3. **Widget 參數**輸入：
   - 單一股票：`NVDA`
   - 自選隨機列表：`NVDA,TSLA,0700,AAPL` (需配合 `RANDOM: 'cus'`)

## ⚙️ 配置指南

### **分時走勢圖配置** (`MiniTimesharesSparklineWidget.js`)

```javascript
const CONFIG = {
  // 隨機股票選擇配置
  RANDOM: 'none',    // 'none' (固定) | 'cus' (自選隨機) | 'rank' (排行隨機)
  RANK_TOP_N: 50,    // 排行前 N 支中隨機選一支
  
  // 預設股票/清單 (支援逗號分隔)
  symbol: 'NVDA,AAPL,0700', 
  
  // 顯示週期
  period: 'all',     // 1d / 5d / 1m / 6m / all
  // ...
};
```

- **`none`**: 顯示參數中的第一支股票（預設）。
- **`cus`**: 從 `symbol` 或 Widget 參數提供的逗號分隔列表中，**隨機**挑選一支顯示。
- **`rank`**: 自動抓取當前市場（美股/港股）成交額前 50 名，**隨機**挑選一支顯示。

### **自選股票模式**（Large Widget）
```javascript
// 在 Widget.js 第11行取消註解並修改
CUSTOM_WATCHLIST: ['NVDA', '0700', 'TSLA', 'SPY'],
```

## 🔧 常見問題

| 問題 | 解決方案 |
|------|----------|
| **Widget空白** | 確認 **Large/Medium** 尺寸 + 正確腳本 |
| **隨機功能無效** | 檢查 `CONFIG.RANDOM` 是否設為 `'cus'` 或 `'rank'` |
| **自選不顯示** | 確認 `CUSTOM_WATCHLIST` 格式（美股字母，港股數字） |
| **排行隨機無數據** | 可能為非交易時段或 API 限流，會自動 fallback 到預設股票 |

## 📊 資料來源
- **Lbkrs API**：成交額排行、分時走勢、K線數據
- **即時更新**：1分鐘快取，開盤時自動刷新

## 🤝 貢獻指南
1. Fork 儲存庫
2. 建立功能分支
3. 提交 Pull Request

**開發規範**：ES6+、Scriptable v1.7+、保持向後相容

---

<div align="center">

**⭐ Star 支援開發** | **Made with ❤️ by [[hin88188](https://github.com/hin88188)]** | [⬆ 回到頂部](#iOS-Scriptable-股票-Widget)

</div>