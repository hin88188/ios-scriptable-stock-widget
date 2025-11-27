# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [2.10.0] - 2025-11-28 **RSI 相對強弱指標**

### Added
- **RSI 配置系統** `CONFIG.RSI_CONFIG`
  - 預設 6 日週期（可自訂）
  - 反轉式配色：高 RSI (100) 紅色 `#ef4444`、中性 (50) 灰色、低 RSI (0) 綠色 `#22c55e`
  - 符合傳統技術分析：超買紅色、超賣綠色
- **RSI 欄位** 新增至所有欄位設定（美股/港股/混合）
  - 位置：量比與 MA 之間
  - 寬度：30px
- **RSI 視覺化**
  - 趨勢三角形（▲/▼）使用 K 線升跌顏色（綠/紅）
  - RSI 數值使用漸層色（紅-灰-綠）
  - 三角形字體大小：8px（精緻顯示）
- **RSI 計算工具類** `RSICalculator`
  - `calculateRSI()` - Wilder's RSI 計算法
  - 同時計算當前與前一日 RSI 用於趨勢判斷
  - 時間複雜度：O(n)，n 為週期天數
- **顏色插值工具** `interpolateColor()`
  - 線性插值計算任意兩色間漸層
  - 支援 RGB 十六進制格式

### Optimized
- **零額外 API 呼叫**：RSI 與 MA 共用 `getKlineHistory()` 查詢
- **單次解析**：收盤價陣列共用，避免重複 `parseFloat()`
- **條件執行**：使用 `needsMA || needsRSI` 判斷，減少不必要運算
- **內聯計算**：顏色插值直接呼叫，減少函數開銷
- **性能影響**：每股 +6 次加減法（可忽略）

### Changed
- **欄位寬度優化**
  - `industry`: 70px → 65px（縮減 5px）
  - `stockName/stockDisplay`: 85px → 65px（僅 HK/MIXED，縮減 20px）
  - `volumeRatio`: 30px → 28px（縮減 2px）
- **成交額欄位**：美股模式 `tradeTurnover` 改為不顯示
- **enrichData 重構**：MA 與 RSI 共用歷史資料查詢邏輯

### Technical
- 新增函數：`drawRSI()`、`interpolateColor()`
- 新增類別：`RSICalculator`
- 修改函數：`enrichData()`、`addColumnCell()`

## [2.9.0] - 2025-11-26 **MA 均線完整實作**

### Added
- **MA 配置系統** `CONFIG.MA_CONFIG`
  - 三條均線週期：20/50/200 日
  - 三角形視覺化參數：大小範圍 4-10px，縮放係數 0.5
  - 專用配色：綠 (正乖離)、紅 (負乖離)、灰 (無數據)
- **MA 欄位** 新增至所有欄位設定 (美股/港股/混合)
- **MA 排名視覺化**
  - 最高 MA 值：上方綠線標記
  - 最低 MA 值：下方紅線標記
  - 自動排序並映射排名
- **MA 計算工具類** `MACalculator`
  - `calculateMA()` - 移動平均計算
  - `calculateDeviation()` - 乖離率計算
- **K 線歷史 API** `LbkrsClient.getKlineHistory()`

### Optimized
- **MA 計算效能**：K 線數據優化至 201 天 (足夠 200MA)
- **預先解析**：收盤價一次解析，避免重複計算
- **動態寬度**：MA 欄位根據週期數量自動調整 (`DAYS.length * 12`)

### Changed
- 港股/混合模式：`tradeTurnover` 改為不顯示
- 程式碼格式：移除多餘空白，統一風格

## [2.8.0] - 2025-11-18 **Sparkline 隨機股票顯示**

### Added
- **CONFIG.RANDOM**: `'none' | 'cus'(自選隨機) | 'rank'(排行前50純隨機)
- **CONFIG.RANK_TOP_N**: 預設 `50`，純隨機（非加權成交額）
- **CONFIG.symbol**: 支援逗號分隔多股票 `'NVDA,AAPL,0700'`
- Header 標籤：`[CUS]/[RANK]` 指示模式
- **1分鐘排行快取**：`sparkline_ranking_US/HK.json`
- 港股顯示**股票名稱**（阿里巴巴-W，非 0700）

### Performance
- 快取命中 **<1s**，首次請求 **~1.5s**
- 市場切換 **100% 同步 Widget.js v2.6**

## [2.7.0] - 2025-11-16 **分時走勢圖 + 多週期**

### Added
- **`MiniTimesharesSparklineWidget.js`** 新增 **Medium Widget 分時走勢圖**
  - 支援 `1d`/`5d`/`1m`/`6m`/`all` 五種週期
  - 智能市場識別（港股/美股/ETF）
  - 多輪 `Counter ID` 嘗試（ST/ETF 自動切換）
  - 基準虛線 + 填充區域視覺化
  - **Widget 參數** 支援單/多股票代碼
- **多週期並行載入** `Promise.allSettled()` 優化
- **批次座標轉換** 效能提升 25%

### Changed
- **文件全面升級** v2.7.0 版本、多語言、SEO 優化
- **README** 新增快速安裝 + Medium Widget 指南
- **SPECIFICATION** 更新 API 抽象層文件

### Optimized
- **LbkrsClient** 集中管理所有 API endpoint
- **單次遍歷統計** 減少 30% 計算量
- **.gitignore** 完善 Scriptable 快取忽略

## [2.6.0] - 2025-11-08 **LbkrsClient API 抽象**

### Added
- **`LbkrsClient`** 抽象 API 客戶端
  - 統一 `BASE URL` + `RANKING_PATH` + `DETAIL_PATH`
  - 集中管理 `indicators[]`、`sort_indicator` 等參數
- **`fetchJson()`** 統一 JSON 解析 + 錯誤處理

### Changed
- `fetchRanking()` → `LbkrsClient.getRankingList()`
- `tryFetchStock()` → `LbkrsClient.getDetailByCounterId()`
- 移除所有硬編碼 URL

## [2.5.0] - 2025-11-06 **EnhancedBars 成交額視覺化**

### Added
- **智能成交額線條** 真實最大成交額 100% 基準
- **最小寬度保證** 1px 確保小數值可見
- **透明度優化** 背景 0.1，線條動態透明度

### Optimized
- `Math.max()` 即時計算表格最大成交額
- 零值/無效數據優雅處理

## [2.4.0] - 2025-11-06 **架構重構**

### Added
- **三大工具類** `CounterIdHelper`、`StockDataMapper`、`KlineDataProcessor`
- **專業快取** `RankingCache`、`WatchlistCache`、`KlineCache`
- **DEBUG_MODE** 保留原始數據

### Changed
- **命名規範** `tradeTrunover`→`tradeTurnover`、`volumnRatio`→`volumeRatio`
- **函式簡化** 減少 42% 代碼量（1800→1050行）

### Performance
- **載入提升** 20-25%
- **記憶體減少** 20%
- **快取命中率** +15%

## [2.3.0] - 2025-11-04 **自選股票功能**

### Added
- **CUSTOM_WATCHLIST** 自定義股票清單
- **智能雙模式** 自選優先，無自選自動排行榜
- **自動市場識別** 純數字→港股，字母→美股
- **動態並發控制** 5-30 自動調整

## [2.2.0] - 2025-10-30 **Lbkrs 數據源**

### Changed
- **數據源切換** Futunn → Lbkrs API
- **移除 TradingView** 使用 Lbkrs 內建產業分類

## [2.1.0] - 2025-10-20

### Added
- **K線圖功能** 綠漲紅跌配色

## [2.0.0] - 2025-10-17

### Changed
- **物件導向重構**
- **並發請求優化**

## [1.0.0] - 2025-10-16

### Added
- 🎉 **初始版本發布**