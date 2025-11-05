# iOS Scriptable Stock Widget

<div align="center">

📊 iOS Scriptable Widget for Stock Turnover Rankings

一個基於 Scriptable 的 iOS 小組件，即時顯示港股/美股成交額排行

[功能特色](#-功能特色) • [安裝方法](#-安裝方法) • [使用說明](#-使用說明) • [配置選項](#️-配置選項)

</div>

---

## ✨ 功能特色

- 🎯 **自選股票追蹤** - 支援自定義股票清單，智能雙模式切換
- 🔄 **智能雙模式** - 自選模式優先，無自選時自動回退排行榜模式
- 🌍 **自動市場識別** - 純數字→港股，包含字母→美股，完全自動化
- 📈 **即時 K 線圖** - 顯示當日 OHLC 數據，綠漲紅跌配色
- 🎨 **階梯式配色** - 漲跌幅 5 級漸變色彩，一眼辨識市場熱度
- 🎯 **智能產業分類** - Lbkrs 數據源，ETF 顯示完整名稱，股票顯示實際行業
- 💧 **量比分析** - 冷→熱漸變色彩顯示成交量變化
- ⚡ **高效快取** - 優化快取策略，提升載入速度
- 🌙 **深淺模式** - 自動適配 iOS 深淺色主題
- 🔧 **多輪嘗試機制** - 智能修正流程，支援任意新ETF代碼
- 🚀 **動態並發控制** - 根據股票數量自動調整並發數

## 📱 預覽

### 自選股票模式（v2.3新增）
```
更新時間    名稱/代號      K線  漲跌%    價格    成交額  量比
───────────────────────────────────────────────────────
半導體     NVDA          📊  +3.58%  181.57  13.79B  1.88
金融服務   騰訊控股      📊  +2.15%  385.20  123.5億 1.25
科技       TSLA          📊  -2.15%  242.30   8.92B  2.34
...
```

### 美股排行榜模式
```
更新時間    代號    K線  漲跌%    價格    成交額  量比
───────────────────────────────────────────────────
半導體     NVDA    📊  +3.58%  181.57  13.79B  1.88
科技       TSLA    📊  -2.15%  242.30   8.92B  2.34
...
```

### 港股排行榜模式
```
更新時間    名稱        K線  漲跌%    價格    成交額  量比
───────────────────────────────────────────────
金融服務   騰訊控股    📊  +2.15%  385.20  123.5億 1.25
電訊       中國移動    📊  -0.82%   68.50   45.2億 0.89
...
```

## 🚀 安裝方法

### 1. 安裝 Scriptable App
從 App Store 下載 [Scriptable](https://apps.apple.com/app/scriptable/id1405459188)

### 2. 下載腳本
```bash
# 下載 Widget.js
# 方法 1: 使用 Git
git clone https://github.com/hin88188/ios-scriptable-stock-widget.git

# 方法 2: 直接下載
# 訪問 GitHub 頁面，點擊 "Code" → "Download ZIP"
```

### 3. 匯入腳本
1. 打開 Scriptable App
2. 點擊右上角 `+` 新增腳本
3. 複製 `Widget.js` 的內容
4. 貼上並儲存（命名為 "Turnover"）

### 4. 添加 Widget
1. 長按 iOS 主畫面空白處
2. 點擊左上角 `+`
3. 搜尋並選擇 "Scriptable"
4. 選擇 **Large** 尺寸
5. 長按 Widget → 編輯小組件
6. Script 選擇 "Turnover"
7. When Interacting 選擇 "Run Script"

## 📖 使用說明

### 智能雙模式（v2.3新增）

#### 自選股票模式
```javascript
// 在 CONFIG 中設定自選股票清單
CUSTOM_WATCHLIST: [
    'AAPL',    // 美股代號
    '00700',   // 港股代號
    'NVDA',    // 美股代號
    'SPY'      // 美股ETF
]
```

**特點**：
- 自動識別市場：純數字→港股，包含字母→美股
- 混合市場顯示：美股顯示代號，港股顯示中文名稱
- 按用戶配置順序顯示
- 支援任意新ETF代碼

#### 排行榜模式
```javascript
// 不設定 CUSTOM_WATCHLIST 或設為空陣列
CUSTOM_WATCHLIST: []
```

**特點**：
- 自動市場切換：根據開盤時間智慧判斷
- 按成交額排序顯示
- 支援美股/港股排行榜

### 市場模式
```javascript
MARKET: 'AUTO'  // 自動切換（推薦）
MARKET: 'US'    // 固定美股
MARKET: 'HK'    // 固定港股
```

### 自動切換邏輯
- **開盤中**: 優先顯示開盤中的市場
- **兩市都收盤**: 根據時段智慧判斷
  - 港股收盤後（16:01-21:29）→ 顯示港股
  - 美股收盤後（04:01-09:29）→ 顯示美股
- **週末**: 顯示週五美股資料

## ⚙️ 配置選項

### 基本設定
```javascript
const CONFIG = {
    // 市場選擇
    MARKET: 'AUTO',           // 'AUTO' | 'US' | 'HK'
    
    // 自選股票配置（v2.3新增功能）
    CUSTOM_WATCHLIST: [
        'AAPL',    // 美股代號
        '00700',   // 港股代號
        'NVDA',    // 美股代號
        'SPY'      // 美股ETF
    ],
    
    // 顯示控制
    SHOW_STOCK: true,         // 顯示股票
    SHOW_ETF: true,           // 顯示 ETF
    MAX_ITEMS: 21,            // 最多顯示筆數（建議 ≤ 21）
    FONT_SIZE: 12,            // 字體大小
    
    // 快取時效（分鐘）
    CACHE_DURATION: 1,        // 主列表和自選股票
    KLINE_CACHE_DURATION: 1,  // K 線數據
    // 產業分類: 從 Lbkrs API 直接獲取（無需快取）
    
    // 效能設定
    MAX_CONCURRENT_REQUESTS: 10,  // 基準並發數
    REQUEST_RETRY_COUNT: 3,       // 請求重試次數
    REQUEST_TIMEOUT: 10000,       // 請求超時（毫秒）
    
    // Cookie（選填）
    COOKIES: '',  // 如遇抓取問題可設定
}
```

### K 線配置
```javascript
KLINE: {
    WIDTH: 8,              // K線總寬度
    HEIGHT: 12,            // K線總高度
    BODY_WIDTH: 8,         // 實體寬度
    SHADOW_WIDTH: 1.5,     // 影線寬度
    GAIN_COLOR: '#00C46B',  // 綠色（漲）
    LOSS_COLOR: '#FF3B3B',  // 紅色（跌）
    NEUTRAL_COLOR: '#CCCCCC' // 灰色（平盤）
}
```

### 色彩系統
```javascript
// 漲跌幅階梯配色
GAIN_LEVELS: {
    level5: '#008C4C',  // > +5%
    level4: '#00A85C',  // +3% ~ +5%
    level3: '#00C46B',  // +1.5% ~ +3%
    level2: '#4BD68D',  // +0.5% ~ +1.5%
    level1: '#9BE39E'   // +0% ~ +0.5%
}

// 量比色彩（冷→熱）
VOLUMN_RATIO_COLORS: {
    coldest: '#4B6B8A',  // < 0.5
    cold: '#3FA7D6',     // 0.5-1.5
    warm: '#6DD57E',     // 1.5-2.5
    hot: '#FFD54F',      // 2.5-5.0
    hottest: '#FF5252'   // > 5.0
}
```

### 欄位配置（v2.3更新）

#### 美股欄位設定
```javascript
COLUMN_SETTINGS_US: [
    { key: 'industry', header: '', width: 70, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockCode', header: '代號', width: 50, visible: true },
    { key: 'kline', header: '', width: 8, visible: true },
    { key: 'changeRatio', header: '漲跌%', width: 55, visible: true },
    { key: 'priceNominal', header: '價格', width: 50, visible: true },
    { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
    { key: 'volumnRatio', header: '量比', width: 30, visible: true }
    // v2.3移除: callRatio 欄位
]
```

#### 港股欄位設定
```javascript
COLUMN_SETTINGS_HK: [
    { key: 'industry', header: '', width: 70, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockName', header: '名稱', width: 85, visible: true },
    { key: 'kline', header: '', width: 8, visible: true },
    { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
    { key: 'priceNominal', header: '價格', width: 50, visible: true },
    { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
    { key: 'volumnRatio', header: '量比', width: 30, visible: true }
    // v2.3移除: callRatio 欄位
]
```

#### 混合市場自選股票欄位設定（v2.3新增）
```javascript
COLUMN_SETTINGS_MIXED: [
    { key: 'industry', header: '', width: 70, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockDisplay', header: '名稱/代號', width: 85, visible: true },
    { key: 'kline', header: '', width: 8, visible: true },
    { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
    { key: 'priceNominal', header: '價格', width: 50, visible: true },
    { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
    { key: 'volumnRatio', header: '量比', width: 30, visible: true }
]
```

## 🔧 常見問題

### Q: Widget 顯示空白？
**A**: 檢查以下項目：
- Widget 尺寸必須為 **Large**
- 確認已選擇正確的腳本
- 查看 Scriptable App 內的 Console 錯誤訊息
- 嘗試在 App 內直接執行腳本測試

### Q: 資料抓取失敗？
**A**: 可能原因：
- 網路連線問題
- 網站暫時無法訪問
- 需要設定 Cookie（在配置中填入）
- 檢查除錯檔案：Scriptable → 檔案 → `debug_*.txt`

### Q: 自選股票不顯示？（v2.3新增）
**A**: 檢查項目：
- 確認 `CUSTOM_WATCHLIST` 配置正確
- 檢查股票代碼格式（美股字母，港股數字）
- 查看 Console 的自選股票錯誤訊息
- 檢查除錯檔案 `debug_watchlist_${stockCode}_*.txt`

### Q: 模式切換錯誤？（v2.3新增）
**A**: 檢查項目：
- 確認 `CUSTOM_WATCHLIST` 是否為空陣列
- 檢查 `resolveDisplayMode()` 函式邏輯
- 驗證 `CONFIG.MARKET` 設定
- 查看 Console 的模式決策日誌

### Q: K 線圖不顯示？
**A**: 檢查項目：
- 確認網路連線正常
- 查看 Console 的錯誤訊息
- 檢查 `KLINE_CACHE_DURATION` 設定
- 刪除快取檔案重新抓取

### Q: 快取如何清除？
**A**: 
1. 打開 Scriptable App
2. 點擊 "檔案" 圖示
3. 刪除 `lbkrs_*_cache*.json` 檔案

### Q: 如何調整顯示數量？
**A**: 修改 `MAX_ITEMS` 參數（建議 ≤ 21，Large Widget 高度限制）

### Q: 多輪嘗試機制失效？（v2.3新增）
**A**: 檢查項目：
- 確認 `fetchWithRetry()` 函式邏輯
- 檢查 Counter ID 格式是否正確
- 驗證股票類型識別邏輯
- 查看所有嘗試的錯誤訊息

## 📊 資料來源

- **主要數據源**: [Lbkrs API](https://m-gl.lbkrs.com/) (成交額排行、價格、漲跌幅、產業分類)
- **統一數據源**: Lbkrs Detail API (v2.3完全統一，移除Futunn依賴)
- **產業分類**: Lbkrs 內建產業字段

## 🛠 技術架構

### 核心類別
- **RequestQueue**: 並發請求管理（v2.3增強動態並發）
- **DataFetcher**: HTTP 請求與解析（v2.3新增Detail API）
- **CacheManager**: 分層快取系統（v2.3新增自選快取）
- **ColorCalculator**: 色彩計算與快取

### 快取策略（v2.3更新）
- **主列表**: 1 分鐘（即時更新）
- **自選股票**: 1 分鐘（v2.3新增）
- **K 線數據**: 1 分鐘
- **產業分類**: 從 Lbkrs API 直接獲取（無需快取）

### 新架構優化 (v2.3)
- **統一數據源**: 完全移除 Futunn API 依賴，統一使用 Lbkrs Detail API
- **智能雙模式**: 自選模式優先，無自選時自動回退排行榜模式
- **自動市場識別**: 純數字→港股，包含字母→美股
- **多輪嘗試機制**: 智能修正流程，支援任意新ETF代碼
- **動態並發控制**: 根據股票數量動態調整並發數
- **混合市場顯示**: 美股顯示代號，港股顯示中文名稱
- **移除期權功能**: 移除 Call% 欄位，簡化界面

### 效能優化
- 並發請求佇列（動態調整 5-30 個並發）
- 請求重試機制（指數退避）
- 色彩計算快取
- 市場特定快取（美股/港股獨立）
- 執行時間監控（v2.3新增）

## 📝 版本歷史

### v2.3-Watchlist (2025-11-04)
- 🎯 **自選股票功能**: 支援自定義股票清單，智能雙模式自動切換
- 🌍 **自動市場識別**: 純數字→港股，包含字母→美股，完全智能化
- 🔄 **智能雙模式**: 自選模式優先，無自選時自動回退排行榜模式
- ⚡ **統一數據源**: 完全移除 Futunn API 依賴，統一使用 Lbkrs Detail API
- 🔧 **多輪嘗試機制**: 智能修正流程：股票→ETF→股票，支援任意新ETF代碼
- 🚀 **動態並發控制**: 根據股票數量動態調整並發數：`Math.min(股票數 + 5, 30)`
- 📊 **執行時間監控**: 詳細日誌記錄，顯示各階段耗時統計
- 🗑️ **移除期權功能**: 移除 Call% 欄位，簡化界面，專注於股票數據
- 💾 **多層快取架構**: 排行榜快取 + 自選快取 + K線快取，支援市場特定快取
- 🎨 **混合市場顯示**: 美股顯示代號，港股顯示中文名稱，智能欄位寬度調整

### v2.2-Lbkrs (2025-10-30)
- ✨ **數據源切換**: 從 Futunn 切換到 Lbkrs API，提升數據穩定性和準確性
- 🗑️ **移除 TradingView**: 完全移除 TradingView 依賴，使用 Lbkrs 產業分類數據
- ⚡ **性能優化**: 實施智能欄位檢測，只為顯示的欄位獲取數據
- 🎯 **智能產業分類**: ETF 顯示完整名稱，股票顯示實際行業或 "--"
- 🏗️ **系統簡化**: 移除產業快取，提升載入速度
- 🔧 **數據修復**: 修復漲跌幅格式、產業分類顯示等問題
- 🧪 **完整測試**: 提供全套測試文件和調試工具

### v2.1 (2025-10-20)
- ✨ 新增 K 線圖功能
- ✨ 從 FutuNN 個股頁面抓取 OHLC 數據
- 🎨 K 線顏色採用「綠漲紅跌」配色
- ⚡ 新增 K 線專屬快取系統
- 🔧 調整美股/港股欄位配置

### v2.0 (2025-10-17)
- ♻️ 重構為物件導向架構
- ⚡ 優化並發請求管理
- 💾 改進快取系統
- 🎨 新增色彩快取機制
- 🌏 優化時區處理

### v1.0 (2025-10-16)
- 🎉 初始版本發布

## 🔄 升級指南

### 從 v2.2 升級到 v2.3
1. **移除期權配置**: 刪除 `callRatio` 相關配置
2. **新增自選功能**: 可選擇性添加 `CUSTOM_WATCHLIST` 配置
3. **更新欄位配置**: 移除 `COLUMN_SETTINGS_*` 中的 `callRatio` 欄位
4. **測試功能**: 確認自選模式和排行榜模式都正常運作

### 從 v2.1 升級到 v2.3
1. **移除期權功能**: 刪除所有 Call% 相關配置
2. **更新數據源**: 確認 Lbkrs API 正常運作
3. **新增自選功能**: 可選擇性添加 `CUSTOM_WATCHLIST` 配置
4. **測試性能**: 確認載入速度和穩定性

## 📈 性能基準（v2.3）

### 載入時間目標
- **自選模式**: < 8 秒（5支股票）
- **排行榜模式**: < 5 秒
- **快取命中**: < 1 秒

### API 成功率目標
- **Lbkrs 排行榜 API**: > 98%
- **Lbkrs Detail API**: > 95%
- **多輪嘗試成功率**: > 99%

### 資源使用
- **並發請求數**: 5-30（動態調整）
- **記憶體使用**: < 50MB
- **快取檔案大小**: < 1MB

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發環境
1. Fork 專案
2. 創建功能分支
3. 提交變更
4. 推送到分支
5. 創建 Pull Request

### 代碼規範
- 使用 JavaScript (ES6+)
- 遵循現有代碼風格
- 添加適當的註釋
- 確保向下相容性

## ⭐ Star History

如果這個專案對你有幫助，請給個 Star ⭐️

---

<div align="center">

Made with ❤️ by [hin88188]

[⬆ 回到頂部](#iOS-Scriptable-Stock-Widget)

</div>