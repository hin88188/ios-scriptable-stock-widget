# iOS Scriptable Stock Widget

<div align="center">

📊 iOS Scriptable Widget for Stock Turnover Rankings

一個基於 Scriptable 的 iOS 小組件，即時顯示港股/美股成交額排行

[功能特色](#-功能特色) • [安裝方法](#-安裝方法) • [使用說明](#-使用說明) • [配置選項](#️-配置選項)

</div>

---

## ✨ 功能特色

- 🔄 **智慧市場切換** - 自動判斷並顯示開盤中的市場（港股/美股）
- 📈 **即時 K 線圖** - 顯示當日 OHLC 數據，綠漲紅跌配色
- 🎨 **階梯式配色** - 漲跌幅 5 級漸變色彩，一眼辨識市場熱度
- 📊 **期權比例** - 顯示美股 Call/Put 比例，洞察市場情緒
- 🏭 **產業分類** - 自動顯示股票所屬產業
- 💧 **量比分析** - 冷→熱漸變色彩顯示成交量變化
- ⚡ **高效快取** - 分層快取系統，減少網路請求
- 🌙 **深淺模式** - 自動適配 iOS 深淺色主題

## 📱 預覽

### 美股模式
```
更新時間    代號    K線  漲跌%    價格    成交額  量比  Call%
────────────────────────────────────────────────────
半導體     NVDA    📊  +3.58%  181.57  13.79B  1.88   52%
科技       TSLA    📊  -2.15%  242.30   8.92B  2.34   48%
...
```

### 港股模式
```
更新時間    名稱        K線  漲跌%    價格    成交額  量比
────────────────────────────────────────────────
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
    
    // 顯示控制
    SHOW_STOCK: true,         // 顯示股票
    SHOW_ETF: true,           // 顯示 ETF
    MAX_ITEMS: 20,            // 最多顯示筆數（建議 ≤ 20）
    FONT_SIZE: 12,            // 字體大小
    
    // 快取時效（分鐘）
    CACHE_DURATION: 1,        // 主列表
    OPTIONS_CACHE_DURATION: 1,    // Call/Put 比例
    INDUSTRY_CACHE_DURATION: 1440, // 產業資訊（24小時）
    KLINE_CACHE_DURATION: 1,      // K 線數據
    
    // 效能設定
    MAX_CONCURRENT_REQUESTS: 10,  // 最大並發請求數
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

// Call% 色彩
CALL_RATIO_COLORS: {
    extremeBearish: '#D32F2F',  // < 35%: 過度悲觀
    bearish: '#F44336',         // 35-45%: 偏空
    neutral: '#757575',         // 45-55%: 中性
    bullish: '#4CAF50',         // 55-65%: 偏多
    extremeBullish: '#00ACC1'   // > 65%: 過度樂觀
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
3. 刪除 `futunn_*_cache*.json` 檔案

### Q: 如何調整顯示數量？
**A**: 修改 `MAX_ITEMS` 參數（建議 ≤ 20，Large Widget 高度限制）

## 📊 資料來源

- **成交額排行**: [Futunn](https://www.futunn.com/)
- **產業資訊**: [TradingView](https://tw.tradingview.com/)
- **期權資料**: Futunn Options Chain（僅美股）

## 🛠 技術架構

### 核心類別
- **RequestQueue**: 並發請求管理
- **DataFetcher**: HTTP 請求與解析
- **CacheManager**: 分層快取系統
- **ColorCalculator**: 色彩計算與快取

### 快取策略
- **主列表**: 1 分鐘（即時更新）
- **期權資料**: 1 分鐘
- **K 線數據**: 1 分鐘
- **產業資訊**: 24 小時（變動緩慢）

### 效能優化
- 並發請求佇列（預設 10 個並發）
- 請求重試機制（指數退避）
- 色彩計算快取
- 市場特定快取（美股/港股獨立）

## 📝 版本歷史

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

## ⭐ Star History

如果這個專案對你有幫助，請給個 Star ⭐️

---

<div align="center">

Made with ❤️ by [hin88188]

[⬆ 回到頂部](#iOS-Scriptable-Stock-Widget)

</div>