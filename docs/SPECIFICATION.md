# Lbkrs 港股/美股成交額 Widget - AI 實作規格文件

**版本**: 2.3-Watchlist
**目標平台**: iOS Scriptable
**API 版本**: Scriptable 1.6+
**日期**: 2025-11-04

---

## 版本更新說明

### v2.3-Watchlist 主要變更 (2025-11-04)
- ✅ **自選股票功能**：支援自定義股票清單，智能雙模式自動切換
- ✅ **自動市場識別**：純數字→港股，包含字母→美股，完全智能化
- ✅ **智能雙模式**：自選模式優先，無自選時自動回退排行榜模式
- ✅ **統一數據源**：完全移除 Futunn API 依賴，統一使用 Lbkrs Detail API
- ✅ **多輪嘗試機制**：智能修正流程：股票→ETF→股票，支援任意新ETF代碼
- ✅ **動態並發控制**：根據股票數量動態調整並發數：`Math.min(股票數 + 5, 30)`
- ✅ **執行時間監控**：詳細日誌記錄，顯示各階段耗時統計
- ✅ **移除期權功能**：移除 Call% 欄位，簡化界面，專注於股票數據
- ✅ **多層快取架構**：排行榜快取 + 自選快取 + K線快取，支援市場特定快取
- ✅ **混合市場顯示**：美股顯示代號，港股顯示中文名稱，智能欄位寬度調整

### v2.2-Lbkrs 主要變更 (2025-10-30)
- ✅ **數據源切換**：從 Futunn 切換到 Lbkrs API，提升數據穩定性和準確性
- ✅ **移除 TradingView**：完全移除 TradingView 依賴，使用 Lbkrs 產業分類數據
- ✅ **性能優化**：實施智能欄位檢測，只為顯示的欄位獲取數據
- ✅ **智能產業分類**：ETF 顯示完整名稱，股票顯示實際行業或 "--"
- ✅ **系統簡化**：移除產業快取，提升載入速度
- ✅ **API 提升**：請求限制從 30 增加到 40，提供更豐富數據池
- ✅ **數據修復**：修復漲跌幅格式（小數轉百分比）、產業分類顯示等問題
- ✅ **完整測試**：提供全套測試文件和調試工具

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
11. [Feature 10: 自選股票系統](#feature-10-自選股票系統)
12. [Feature 11: 錯誤處理與除錯](#feature-11-錯誤處理與除錯)

---

## 1. 系統架構概覽

### 資料流向（v2.3）

```
啟動 → 配置載入 → 智能模式決策 → 快取檢查
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
                  產業/K線 → 色彩計算
                          ↓
                  Widget建構 → 快取寫入 → 顯示
```

### 核心類別架構（v2.3）

| 類別 | 職責 | 關鍵方法 |
|------|------|----------|
| `RequestQueue` | 並發請求管理 | `add()`, `process()`, `getConcurrency()` |
| `DataFetcher` | HTTP 請求與解析 | `fetchWithRetry()`, `fetchLbkrsApi()`, `fetchLbkrsDetailData()` |
| `CacheManager` | 檔案快取管理 | `get()`, `set()` |
| `ColorCalculator` | 色彩計算與快取 | `getChangeRatioColor()`, `getVolumnRatioColor()` |

### 智能雙模式架構（v2.3 新增）

| 模式 | 觸發條件 | 數據源 | 顯示邏輯 |
|------|----------|--------|----------|
| **自選模式** | `CUSTOM_WATCHLIST` 有配置 | Lbkrs Detail API | 按用戶配置順序顯示 |
| **排行榜模式** | 無自選股票配置 | Lbkrs 排行榜 API + Detail API | 按成交額排序顯示 |

---

## Feature 1: 配置管理系統

### Description
v2.3 新增自選股票配置和混合市場欄位設定。

### Outputs
```javascript
CONFIG = {
  // 基本設定
  MARKET: 'AUTO' | 'US' | 'HK',
  CUSTOM_WATCHLIST: ['NVDA', 'SPY', '0700', '9988', '2800'], // v2.3新增
  SHOW_STOCK: boolean,
  SHOW_ETF: boolean,
  MAX_ITEMS: number,
  FONT_SIZE: number,
  
  // 快取設定
  CACHE_DURATION: number,            // 分鐘
  KLINE_CACHE_DURATION: number,      // K線數據快取時間
  
  // 效能設定
  MAX_CONCURRENT_REQUESTS: number,   // 基準並發請求數
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
  
  // 美股欄位設定（v2.3移除Call%）
  COLUMN_SETTINGS_US: [
    { key: 'industry', header: '', width: 70, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockCode', header: '代號', width: 50, visible: true },
    { key: 'kline', header: '', width: 8, visible: true },
    { key: 'changeRatio', header: '漲跌%', width: 55, visible: true },
    { key: 'priceNominal', header: '價格', width: 50, visible: true },
    { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
    { key: 'volumnRatio', header: '量比', width: 30, visible: true }
  ],
  
  // 港股欄位設定（v2.3移除Call%）
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
  
  // 混合市場自選股票欄位設定（v2.3新增）
  COLUMN_SETTINGS_MIXED: [
    { key: 'industry', header: '', width: 70, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockDisplay', header: '名稱/代號', width: 85, visible: true },
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
  
  // 量比色彩與閾值
  VOLUMN_RATIO_COLORS: {...},
  VOLUMN_RATIO_THRESHOLDS: {...},
  
  // UI 常數
  UI: {
    HEADER_PADDING: Object,
    ROW_PADDING: Object,
    PROGRESS_BAR_HEIGHT: number
  }
}
```

### Key Changes in v2.3
- 新增 `CUSTOM_WATCHLIST` 配置區塊（自選股票清單）
- 新增 `COLUMN_SETTINGS_MIXED` 混合市場欄位設定
- 移除 `COLUMN_SETTINGS_US` 和 `COLUMN_SETTINGS_HK` 中的 `callRatio` 欄位
- 移除 `CALL_RATIO_COLORS` 和 `CALL_RATIO_THRESHOLDS` 配置
- 移除 `OPTIONS_CACHE_DURATION` 和 `INDUSTRY_CACHE_DURATION` 配置

---

## Feature 2: 請求佇列管理

### Description
管理並發 HTTP 請求，支援動態並發數調整。

### Class: RequestQueue

```javascript
class RequestQueue {
  constructor(getConcurrencyFn: Function)
  getConcurrency(): number
  async add(requestFn: Function): Promise<any>
  async process(): Promise<void>
}
```

### Logic Steps

#### 1. 初始化（v2.3 增強）
```javascript
constructor(getConcurrencyFn) {
  this.maxConcurrent = 10;
  this.getConcurrencyFn = getConcurrencyFn || (() => 10);
  this.running = 0;
  this.queue = [];
}
```

#### 2. 動態並發數計算（v2.3 新增）
```javascript
getConcurrency() {
  if (typeof this.getConcurrencyFn === 'function') {
    return Math.min(this.getConcurrencyFn(), 30);
  }
  return Math.min(this.maxConcurrent, 30);
}
```

#### 3. 新增請求
```javascript
async add(requestFn) {
  return new Promise((resolve, reject) => {
    this.queue.push({ requestFn, resolve, reject });
    this.process();
  });
}
```

#### 4. 處理佇列
```javascript
async process() {
  const currentMax = this.getConcurrency();
  if (this.running >= currentMax || this.queue.length === 0) return;
  
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
整合請求佇列、重試機制、超時控制的資料抓取系統，統一使用 Lbkrs API。

### Class: DataFetcher

```javascript
class DataFetcher {
  constructor(config: Object)
  buildHeaders(): Object
  async fetchWithRetry(url: string, maxRetries: number): Promise<string>
  delay(ms: number): Promise<void>
  async fetchLbkrsApi(url: string, context: string): Promise<Object>
  async fetchLbkrsDetailData(counterId: string, context: string): Promise<Object>
}
```

### Key Functions

#### fetchLbkrsApi（v2.3 統一數據源）
```javascript
async function fetchLbkrsApi(url, context) {
  try {
    const html = await this.fetchWithRetry(url);
    const data = JSON.parse(html);
    
    if (data.code !== 0) {
      throw new Error(`Lbkrs API 錯誤: ${data.message || '未知錯誤'}`);
    }
    
    return data;
  } catch (e) {
    saveDebugFile(`debug_${context}_error.txt`, `URL: ${url}\nError: ${e.message}`);
    throw new Error(`${context} Lbkrs API 請求失敗: ${e.message}`);
  }
}
```

#### fetchLbkrsDetailData（v2.3 新增）
```javascript
async function fetchLbkrsDetailData(counterId, context) {
  const url = `https://m-gl.lbkrs.com/api/forward/v3/quote/stock/detail?counter_id=${counterId}`;
  try {
    const html = await this.fetchWithRetry(url);
    const data = JSON.parse(html);
    
    if (data.code !== 0) {
      throw new Error(`Lbkrs Detail API 錯誤: ${data.message || '未知錯誤'}`);
    }
    
    return data;
  } catch (e) {
    saveDebugFile(`debug_${context}_detail_error.txt`, `URL: ${url}\nError: ${e.message}`);
    throw new Error(`${context} Lbkrs Detail API 請求失敗: ${e.message}`);
  }
}
```

#### fetchStockData（v2.3 簡化）
```javascript
async function fetchStockData(fetcher, market) {
  const url = CONFIG.MARKET_URLS[market];
  const data = await fetcher.fetchLbkrsApi(url, `turnover_${market}`);
  
  if (!data?.data?.list || !Array.isArray(data.data.list)) {
    saveDebugFile(`debug_${market}_lbkrs_data.txt`, JSON.stringify(data, null, 2));
    throw new Error(`${market} Lbkrs API 數據格式錯誤`);
  }
  
  // 使用 Lbkrs 數據映射函數轉換為現有格式
  return data.data.list.map(mapLbkrsToExisting);
}
```

#### fetchWatchlistData（v2.3 新增）
```javascript
async function fetchWatchlistData(fetcher, cache) {
  const watchlist = CONFIG.CUSTOM_WATCHLIST;
  console.log(`[自選] 開始獲取 ${watchlist.length} 支股票數據`);
  
  // 動態計算並發數
  const concurrency = Math.min(watchlist.length + 5, 30);
  console.log(`[自選] 設定並發數: ${concurrency}`);
  
  const results = [];
  const errors = [];
  
  // 分批處理以避免過度並發
  const batchSize = Math.min(concurrency, 10);
  for (let i = 0; i < watchlist.length; i += batchSize) {
    const batch = watchlist.slice(i, i + batchSize);
    const batchPromises = batch.map(async (stockCode) => {
      try {
        // 檢查快取
        const cached = cache.get('watchlist', stockCode);
        if (cached !== null) {
          console.log(`[自選] 快取命中: ${stockCode}`);
          return cached;
        }
        
        // 自動識別市場
        const market = identifyMarket(stockCode);
        
        // 使用多輪嘗試機制獲取數據
        const result = await fetchWithRetry(stockCode, market, fetcher, `watchlist_${stockCode}`);
        
        // 映射為系統格式
        const mappedData = mapLbkrsDetailToSystem(result.data, result.counterId);
        
        // 寫入快取
        cache.set('watchlist', stockCode, mappedData);
        
        console.log(`[自選] 成功獲取: ${stockCode}`);
        return mappedData;
        
      } catch (error) {
        console.error(`[自選] 獲取失敗: ${stockCode} - ${error.message}`);
        errors.push({ stockCode, error: error.message });
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(result => result !== null));
    
    // 批次間隔，避免請求過於頻繁
    if (i + batchSize < watchlist.length) {
      await fetcher.delay(100);
    }
  }
  
  console.log(`[自選] 完成，獲取 ${results.length} 支股票，${errors.length} 支失敗`);
  if (errors.length > 0) {
    console.log(`[自選] 失敗清單:`, errors.map(e => `${e.stockCode}(${e.error})`).join(', '));
  }
  
  return results;
}
```

#### fetchWithRetry（v2.3 新增多輪嘗試）
```javascript
async function fetchWithRetry(stockCode, market, fetcher, context) {
  let lastError = null;
  
  // 第一步：嘗試ST（股票）
  try {
    const counterIdST = buildCounterId(stockCode, 'ST', market);
    console.log(`[重試] 嘗試 1/2: ${counterIdST}`);
    const data = await fetcher.fetchLbkrsDetailData(counterIdST, context);
    
    if (data && data.data) {
      console.log(`[重試] 成功: ${counterIdST}`);
      return { data: data.data, counterId: counterIdST };
    }
  } catch (error) {
    console.log(`[重試] 失敗 1/2: ${error.message}`);
    lastError = error;
  }
  
  // 第二步：ST失敗後直接嘗試ETF
  try {
    const counterIdETF = buildCounterId(stockCode, 'ETF', market);
    console.log(`[重試] 嘗試 2/2: ${counterIdETF}`);
    const data = await fetcher.fetchLbkrsDetailData(counterIdETF, context);
    
    if (data && data.data) {
      console.log(`[重試] 成功: ${counterIdETF}`);
      return { data: data.data, counterId: counterIdETF };
    }
  } catch (error) {
    console.log(`[重試] 失敗 2/2: ${error.message}`);
    lastError = error;
  }
  
  // 第三步：嘗試美股的另一種格式（僅美股）
  if (market === 'US') {
    try {
      const counterIdST2 = `ST/US/${stockCode}`;
      console.log(`[重試] 嘗試 3/3: ${counterIdST2}`);
      const data = await fetcher.fetchLbkrsDetailData(counterIdST2, context);
      
      if (data && data.data) {
        console.log(`[重試] 成功: ${counterIdST2}`);
        return { data: data.data, counterId: counterIdST2 };
      }
    } catch (error) {
      console.log(`[重試] 失敗 3/3: ${error.message}`);
      lastError = error;
    }
  }
  
  throw new Error(`所有嘗試都失敗，最後錯誤: ${lastError?.message || '未知錯誤'}`);
}
```

---

## Feature 4: 快取管理系統

### Description
v2.3 新增自選股票快取類型，簡化快取架構。

### Class: CacheManager

```javascript
class CacheManager {
  constructor(config: Object)
  get(type: string, keyOrMarket: string): any
  set(type: string, keyOrDataOrMarket: string, value: any): void
}
```

### Logic Steps

#### 1. 初始化（v2.3 簡化）
```javascript
constructor(config) {
  this.config = config;
  this.fm = FileManager.local();
  
  this.paths = {
    main: {
      US: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_ranking_cache_us.json'),
      HK: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_ranking_cache_hk.json')
    },
    watchlist: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_watchlist_cache.json'), // v2.3新增
    kline: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_kline_cache.json')
  };
  
  this.durations = {
    main: config.CACHE_DURATION,
    watchlist: config.CACHE_DURATION, // v2.3新增
    kline: config.KLINE_CACHE_DURATION
  };
}
```

### Cache Structure

#### 自選股票快取（v2.3新增）
```javascript
// lbkrs_watchlist_cache.json
{
  "NVDA": {
    value: {
      stockCode: "NVDA",
      stockName: "英偉達",
      priceNominal: 445.20,
      changeRatio: "+2.84%",
      changeRatioNum: 2.84,
      tradeTrunover: "525000000",
      volumnRatio: 1.25,
      instrumentType: 3,
      industry: "半導體廠商",
      klineData: {
        open: 440.50,
        high: 450.80,
        low: 438.20,
        close: 445.20
      }
    },
    timestamp: "2025-11-04T10:30:00.000Z"
  },
  "00700": {
    value: {
      stockCode: "00700",
      stockName: "騰訊控股",
      priceNominal: 385.20,
      changeRatio: "+2.15%",
      changeRatioNum: 2.15,
      tradeTrunover: "1235000000",
      volumnRatio: 1.25,
      instrumentType: 3,
      industry: "金融服務",
      klineData: {
        open: 380.00,
        high: 387.20,
        low: 378.50,
        close: 385.20
      }
    },
    timestamp: "2025-11-04T10:30:00.000Z"
  }
}
```

---

## Feature 5: 市場決策引擎

### Description
自動判斷應顯示哪個市場（美股或港股），新增智能雙模式切換。

### Function: resolveMarketAuto

```javascript
function resolveMarketAuto(): 'US' | 'HK'
```

### 決策邏輯
1. 優先顯示開盤中的市場
2. 兩市都收盤時，根據時段判斷
3. 預設返回美股

### resolveDisplayMode（v2.3 新增）

```javascript
function resolveDisplayMode() {
  const watchlist = CONFIG.CUSTOM_WATCHLIST;
  
  // 檢查是否有有效的自選股票
  if (watchlist && watchlist.length > 0) {
    // 有自選股票：自選模式
    console.log(`[模式] 檢測到自選股票 (${watchlist.length} 支)，使用自選模式`);
    return { mode: 'watchlist', market: 'AUTO' };
  } else {
    // 無自選股票：排行榜模式
    console.log(`[模式] 無自選股票，使用排行榜模式`);
    const market = CONFIG.MARKET === 'AUTO' ? resolveMarketAuto() : CONFIG.MARKET;
    return { mode: 'ranking', market };
  }
}
```

### identifyMarket（v2.3 新增）

```javascript
function identifyMarket(stockCode) {
  // 純數字 → 港股，包含字母 → 美股
  if (/^\d+$/.test(stockCode)) {
    console.log(`[市場] ${stockCode} 識別為港股 (純數字)`);
    return 'HK';
  } else {
    console.log(`[市場] ${stockCode} 識別為美股 (包含字母)`);
    return 'US';
  }
}
```

---

## Feature 6: 資料處理與過濾

### Key Functions

#### filterData（v2.3 簡化）
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
      priceNominal: stock.priceNominal, // 已經是數字
      changeRatio: stock.changeRatio,
      changeRatioNum: stock.changeRatioNum, // 已經是數字
      tradeTrunover: stock.tradeTrunover,
      volumnRatio: stock.volumnRatio, // 已經是數字
      instrumentType: stock.instrumentType,
      industry: stock.industry, // 保留產業數據
      // 保留所有必要的數據字段，特別是K線數據
      klineData: stock.klineData || null, // 保留K線數據
      _rawData: stock._rawData || null, // 保留原始Detail API數據
      _source: stock._source || null // 保留數據來源標記
    }));
}
```

#### enrichStockData（v2.3 優化）
```javascript
async function enrichStockData(data, fetcher, cache, market, mode) {
  // 智能欄位檢測：只為顯示的欄位獲取數據
  const visibleColumns = getActiveColumnSettings(market, mode).filter(c => c.visible);
  const needsIndustry = visibleColumns.some(col => col.key === 'industry');
  const needsKline = visibleColumns.some(col => col.key === 'kline');
  
  console.log(`[優化] 市場: ${market}, 需要產業: ${needsIndustry}, 需要K線: ${needsKline}`);
  
  const enrichedData = await Promise.all(data.map(async (stock) => {
    // 產業分類：直接從 Lbkrs 獲取 (如果需要顯示)
    const industry = needsIndustry ? stock.industry || '--' : '--';
    
    // K 線數據：統一使用Detail API，根據數據來源決定獲取方式
    let klineData = stock.klineData || null;
    
    // 智能K線獲取：自選股票直接重建，排行榜模式才調用API
    if (needsKline) {
      if (stock._source === 'watchlist') {
        // 自選股票：確保K線數據完整性（從_rawData重建或修正）
        if (stock._rawData) {
          const rebuiltKlineData = {
            open: parseFloat(stock._rawData.open) || null,
            high: parseFloat(stock._rawData.high) || null,
            low: parseFloat(stock._rawData.low) || null,
            close: parseFloat(stock._rawData.last_done) || stock.priceNominal || null
          };
          
          // 驗證K線數據完整性
          const hasValidKline = rebuiltKlineData.open && rebuiltKlineData.high && rebuiltKlineData.low && rebuiltKlineData.close;
          if (hasValidKline) {
            klineData = rebuiltKlineData;
            console.log(`[K線重建] ${stock.stockCode}: O${klineData.open} H${klineData.high} L${klineData.low} C${klineData.close}`);
          } else {
            console.warn(`[K線警告] ${stock.stockCode} 原始數據不完整: O${rebuiltKlineData.open} H${rebuiltKlineData.high} L${rebuiltKlineData.low} C${rebuiltKlineData.close}`);
            klineData = null;
          }
        } else {
          console.warn(`[K線警告] ${stock.stockCode} 缺少原始Detail API數據`);
          klineData = null;
        }
      } else {
        // 排行榜模式：使用快取或獲取K線數據
        klineData = await fetchSingleKlineData(stock, fetcher, cache, market);
      }
    }
    
    return { ...stock, industry, klineData };
  }));
  return enrichedData;
}
```

---

## Feature 7: 色彩計算系統

### Class: ColorCalculator

```javascript
class ColorCalculator {
  constructor(config: Object)
  getChangeRatioColor(ratio: number): Color
  getVolumnRatioColor(ratio: number): Color
}
```

### 色彩系統
- **漲跌幅**: 階梯式 5 級漲色 + 5 級跌色
- **量比**: 冷→熱漸變色（藍灰→藍→綠→黃橙→紅）

### v2.3 變更
- 移除 `getCallRatioColor()` 方法
- 移除 Call% 相關色彩配置

---

## Feature 8: Widget 建構引擎

### Key Functions

#### createWidget（v2.3 增強）
```javascript
async function createWidget(stockData, updateTime, maxTurnover, colorCalc, market, mode) {
  const widget = new ListWidget();
  widget.backgroundColor = CONFIG.COLORS.background;
  widget.spacing = 0;
  widget.setPadding(0, 0, 0, 0);

  const visibleColumns = getActiveColumnSettings(market, mode).filter(c => c.visible);

  // 建立標題列
  createHeaderRow(widget, updateTime, visibleColumns, market);

  // 計算總欄位寬度
  const totalBarWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0);

  // 建立資料列
  for (const stock of stockData) {
    createDataRow(widget, stock, maxTurnover, totalBarWidth, visibleColumns, colorCalc, market, mode);
  }

  return widget;
}
```

#### getActiveColumnSettings（v2.3 新增）
```javascript
function getActiveColumnSettings(market, mode) {
  // 自選股票模式使用混合市場設定
  if (mode === 'watchlist') {
    return CONFIG.COLUMN_SETTINGS_MIXED;
  }
  
  // 排行榜模式根據市場選擇
  return market === 'HK' ? CONFIG.COLUMN_SETTINGS_HK : CONFIG.COLUMN_SETTINGS_US;
}
```

#### formatColumnValue（v2.3 新增混合市場邏輯）
```javascript
function formatColumnValue(key, stock, market, mode) {
  console.log(`[格式化] 欄位: ${key}, 模式: ${mode}, 代碼: ${stock.stockCode}, 名稱: ${stock.stockName}`);
  
  switch (key) {
    case 'stockCode':
      // 美股:去前導零(如有),港股:保持原樣或去前導零
      return /^\d+$/.test(stock.stockCode)
        ? String(parseInt(stock.stockCode, 10))
        : stock.stockCode;
    
    case 'stockName':
      // 港股名稱
      return stock.stockName || '--';
    
    case 'stockDisplay':
      // 混合市場顯示：美股顯示代號，港股顯示中文名稱
      console.log(`[stockDisplay] 開始處理: mode=${mode}, stockCode=${stock.stockCode}, stockName=${stock.stockName}`);
      
      if (mode === 'watchlist') {
        // 根據識別的市場類型決定顯示格式
        if (/^\d+$/.test(stock.stockCode)) {
          // 純數字 = 港股，顯示中文名稱
          const displayName = stock.stockName || stock.stockCode;
          console.log(`[stockDisplay] 港股 -> 顯示名稱: ${displayName}`);
          return displayName;
        } else {
          // 包含字母 = 美股，顯示代號
          console.log(`[stockDisplay] 美股 -> 顯示代號: ${stock.stockCode}`);
          return stock.stockCode;
        }
      }
      
      // 回退到舊的邏輯
      console.log(`[stockDisplay] 非watchlist模式 -> 回退邏輯: ${stock.stockCode}`);
      return stock.stockCode;
    
    case 'priceNominal':
      return stock.priceNominal.toFixed(2);
    
    case 'tradeTrunover':
      return formatTurnover(stock.tradeTrunover);
    
    case 'volumnRatio':
      return stock.volumnRatio.toFixed(2);
    
    default:
      return String(stock[key]);
  }
}
```

---

## Feature 9: K 線圖繪製系統

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

---

## Feature 10: 自選股票系統

### Description
v2.3 新增核心功能，支援自定義股票清單和智能雙模式切換。

### 核心函式

#### resolveDisplayMode
```javascript
function resolveDisplayMode() {
  const watchlist = CONFIG.CUSTOM_WATCHLIST;
  
  // 檢查是否有有效的自選股票
  if (watchlist && watchlist.length > 0) {
    // 有自選股票：自選模式
    console.log(`[模式] 檢測到自選股票 (${watchlist.length} 支)，使用自選模式`);
    return { mode: 'watchlist', market: 'AUTO' };
  } else {
    // 無自選股票：排行榜模式
    console.log(`[模式] 無自選股票，使用排行榜模式`);
    const market = CONFIG.MARKET === 'AUTO' ? resolveMarketAuto() : CONFIG.MARKET;
    return { mode: 'ranking', market };
  }
}
```

#### identifyMarket
```javascript
function identifyMarket(stockCode) {
  // 純數字 → 港股，包含字母 → 美股
  if (/^\d+$/.test(stockCode)) {
    console.log(`[市場] ${stockCode} 識別為港股 (純數字)`);
    return 'HK';
  } else {
    console.log(`[市場] ${stockCode} 識別為美股 (包含字母)`);
    return 'US';
  }
}
```

#### buildCounterId
```javascript
function buildCounterId(stockCode, instrumentType, market) {
  // 港股代碼需要去除前導零，美股保持原樣
  const formattedCode = market === 'HK' ? String(parseInt(stockCode, 10)) : stockCode;
  return `${instrumentType}/${market}/${formattedCode}`;
}
```

#### parseCounterId
```javascript
function parseCounterId(counterId) {
  const parts = counterId.split('/');
  if (parts.length !== 3) {
    throw new Error(`無效的 Counter ID 格式: ${counterId}`);
  }
  
  return {
    stockCode: parts[2], // 代碼
    instrumentType: parts[0], // 類型 ST/ETF
    market: parts[1] // 市場 US/HK
  };
}
```

#### inferInstrumentType
```javascript
function inferInstrumentType(counterId) {
  return counterId.startsWith('ETF/') ? 'ETF' : 'ST';
}
```

### 數據映射函式

#### mapLbkrsToExisting
```javascript
function mapLbkrsToExisting(lbkrsItem) {
  const indicators = lbkrsItem.indicators;
  
  if (!indicators || indicators.length < 18) {
    throw new Error(`Lbkrs 數據不完整: 缺少必要的指標數組 (需要 >= 18, 實際: ${indicators.length})`);
  }
  
  // 提取關鍵指標
  const price = parseFloat(indicators[0]) || 0;              // last_done (最新價)
  const changePct = parseFloat(indicators[1]) || 0;          // chg (漲跌幅，小數形式)
  const changeAmt = parseFloat(indicators[2]) || 0;          // change (漲跌額)
  const volume = indicators[3] || '0';                       // total_amount (成交量)
  const turnover = indicators[4] || '0';                     // total_balance (成交額)
  const volumnRatio = parseFloat(indicators[7]) || 0;        // volume_rate (量比)
  const industry = indicators[17];                           // industry (行業) - 修正索引 [17]
  
  // 修正漲跌幅：將小數轉換為百分比
  const formattedChangePct = changePct * 100; // 0.0284 -> 2.84
  
  // 格式化漲跌幅顯示
  const changeRatio = `${formattedChangePct >= 0 ? '+' : ''}${formattedChangePct.toFixed(2)}%`;
  
  // 處理產業分類
  let industryName;
  const instrumentType = inferInstrumentType(lbkrsItem.counter_id);
  
  if (instrumentType === 'ETF') {
    // ETF 顯示 ETF 的名稱
    industryName = lbkrsItem.name || 'ETF';
  } else if (industry && typeof industry === 'string' && industry.trim() !== '') {
    // 股票有產業數據
    industryName = industry.trim();
  } else {
    // 股票無產業數據
    industryName = '--';
  }
  
  console.log(`[映射] ${lbkrsItem.name} (${lbkrsItem.code}):`);
  console.log(`  原始漲跌幅: ${changePct} -> 格式化: ${formattedChangePct}%`);
  console.log(`  產業 (索引[17]): "${industry}" -> "${industryName}"`);
  console.log(`  半年漲幅 (索引[16]): "${indicators[16]}"`);
  
  return {
    stockCode: extractStockCode(lbkrsItem.counter_id),
    stockName: lbkrsItem.name || '--',
    priceNominal: price,
    changeRatio: changeRatio,
    changeRatioNum: formattedChangePct, // 使用格式化後的百分比數值
    tradeTrunover: turnover,
    volumnRatio: volumnRatio,
    instrumentType: instrumentType === 'ETF' ? 4 : 3,
    industry: industryName,
    // 保留原始數據供調試
    _rawData: lbkrsItem
  };
}
```

#### mapLbkrsDetailToSystem
```javascript
function mapLbkrsDetailToSystem(detailData, counterId) {
  if (!detailData) {
    throw new Error('Lbkrs Detail API 響應數據為空');
  }
  
  const parsed = parseCounterId(counterId);
  const instrumentType = parsed.instrumentType === 'ETF' ? 4 : 3;
  
  // 提取關鍵數據，加強健壯性
  const price = parseFloat(detailData.last_done) || 0;
  const changePct = parseFloat(detailData.chg) || 0;
  const changeAmt = parseFloat(detailData.change) || 0;
  const volume = detailData.total_amount || detailData.amount || '0';
  
  // 嘗試多個成交額字段名稱，確保兼容性
  const turnover = detailData.balance ||
                  detailData.total_balance ||
                  detailData.amount ||
                  detailData.total_amount ||
                  detailData.volume ||
                  '0';
  
  const volumnRatio = parseFloat(detailData.volume_rate) || 0;
  
  // 計算漲跌幅：根據 Detail API 文檔，需要額外計算 (last_done - prev_close) / prev_close × 100
  let formattedChangePct;
  if (detailData.prev_close && parseFloat(detailData.prev_close) > 0) {
    // 使用計算公式：((收盤價 - 前收盤價) / 前收盤價) × 100
    const prevClose = parseFloat(detailData.prev_close);
    formattedChangePct = ((price - prevClose) / prevClose) * 100;
  } else {
    // 回退到 API 原始值
    formattedChangePct = changePct * 100;
  }
  const changeRatio = `${formattedChangePct >= 0 ? '+' : ''}${formattedChangePct.toFixed(2)}%`;
  
  // 處理產業分類
  let industryName;
  if (instrumentType === 4) {
    industryName = detailData.stock_name || 'ETF';
  } else {
    industryName = detailData.industry_name || '--';
  }
  
  // 構建 K 線數據
  const klineData = {
    open: parseFloat(detailData.open) || null,
    high: parseFloat(detailData.high) || null,
    low: parseFloat(detailData.low) || null,
    close: price
  };
  
  console.log(`[Detail映射] ${detailData.stock_name || parsed.stockCode} (${parsed.stockCode}):`);
  console.log(`  價格: ${price}, 漲跌幅: ${formattedChangePct}%`);
  console.log(`  成交額: ${turnover} (來自 ${Object.keys(detailData).find(k => k.includes('balance') || k.includes('amount') || k.includes('volume')) || '未知字段'})`);
  console.log(`  產業: ${industryName}`);
  console.log(`  K線: O${klineData.open} H${klineData.high} L${klineData.low} C${klineData.close}`);
  
  return {
    stockCode: parsed.stockCode,
    stockName: detailData.stock_name || '--',
    priceNominal: price,
    changeRatio: changeRatio,
    changeRatioNum: formattedChangePct,
    tradeTrunover: turnover,
    volumnRatio: volumnRatio,
    instrumentType: instrumentType,
    industry: industryName,
    klineData: klineData,
    // 標記數據來源
    _source: 'watchlist',
    // 保留原始數據供調試
    _rawData: detailData
  };
}
```

---

## Feature 11: 錯誤處理與除錯

### Description
改進除錯檔案儲存與錯誤訊息處理，支援自選股票錯誤追蹤。

### 錯誤處理策略

**錯誤級別定義**:
- **Critical Error (拋出錯誤)**: 主列表抓取失敗、JSON 解析失敗、快取讀寫失敗等會導致 Widget 無法運作的錯誤
- **Warning (記錄並繼續)**: 個別股票的自選數據抓取失敗，不影響整體運作

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

#### 主函式錯誤處理（v2.3 增強）
```javascript
async function main() {
  const startTime = new Date();
  console.log(`程式開始: ${startTime.toLocaleString()}`);
  
  try {
    // 1. 智能模式決策
    const { mode, market } = resolveDisplayMode();
    
    const cache = new CacheManager(CONFIG);
    const fetcher = new DataFetcher(CONFIG);
    const colorCalc = new ColorCalculator(CONFIG);

    let stockData = [];
    let timestamp = new Date();
    let displayMarket = market;

    // 2. 根據模式獲取數據
    if (mode === 'watchlist') {
      // 自選股票模式
      const rawData = await fetchWatchlistData(fetcher, cache);
      if (!rawData || rawData.length === 0) {
        throw new Error('自選股票數據為空');
      }
      stockData = rawData;
    } else {
      // 排行榜模式
      const resolvedMarket = market === 'AUTO' ? resolveMarketAuto() : market;
      displayMarket = resolvedMarket;
      
      let cachedData = cache.get('main', resolvedMarket);
      if (!cachedData?.data?.length) {
        const rawData = await fetchStockData(fetcher, resolvedMarket);
        if (!rawData || rawData.length === 0) {
          throw new Error('抓取的成交額資料為空');
        }
        cachedData = { data: rawData, timestamp: new Date() };
        cache.set('main', resolvedMarket, cachedData);
      }
      stockData = cachedData.data;
      timestamp = new Date(cachedData.timestamp);
    }

    // 3. 過濾資料
    const filteredData = filterData(stockData);
    if (filteredData.length === 0) {
      throw new Error('過濾後無資料可顯示');
    }

    // 4. 並發抓取補充資料
    const enrichedData = await enrichStockData(filteredData, fetcher, cache, displayMarket, mode);

    // 5. 計算最大成交額(預先計算,避免重複)
    const maxTurnover = enrichedData.length > 0
      ? parseTurnoverToNumber(enrichedData[0].tradeTrunover)
      : 0;

    // 6. 建立 Widget
    const widget = await createWidget(
      enrichedData,
      timestamp,
      maxTurnover,
      colorCalc,
      displayMarket,
      mode  // 新增mode參數
    );

    // 7. 顯示
    if (typeof config !== 'undefined' && config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      widget.presentLarge();
    }
    
    // 8. 執行時間統計
    const endTime = new Date();
    const totalTime = endTime - startTime;
    console.log(`執行完成，總耗時: ${totalTime}ms`);
    console.log(`模式: ${mode}, 市場: ${displayMarket}, 股票數: ${enrichedData.length}`);
    
  } catch (error) {
    console.error(error.message);
    const errorWidget = createErrorWidget(error.message);
    if (typeof config !== 'undefined' && config.runsInWidget) {
      Script.setWidget(errorWidget);
    } else {
      errorWidget.presentLarge();
    }
  } finally {
    Script.complete();
  }
}
```

### Debug File Locations（v2.3 更新）
- `debug_turnover_US_html.txt` - 美股主列表 HTML
- `debug_turnover_HK_html.txt` - 港股主列表 HTML
- `debug_turnover_US_json_error.txt` - 美股 JSON 解析錯誤
- `debug_turnover_HK_json_error.txt` - 港股 JSON 解析錯誤
- `debug_watchlist_${stockCode}_detail_error.txt` - 自選股票 Detail API 錯誤（v2.3新增）
- `debug_kline_${stockCode}_html.txt` - K 線頁面 HTML（抓取失敗時）
- `debug_kline_${stockCode}_json_error.txt` - K 線 JSON 解析錯誤

---

## 實作順序建議（v2.3）

### 階段 1：核心架構重構（30%）- 已完成 ✅

#### 1.1 統一數據源 ✅
- [x] 移除 Futunn API 依賴
- [x] 實作 Lbkrs Detail API 整合
- [x] 實作 `fetchLbkrsDetailData()` 方法
- [x] 測試：Lbkrs API 數據正確解析

#### 1.2 多輪嘗試機制 ✅
- [x] 實作 `fetchWithRetry()` 函式
- [x] 實作 Counter ID 解析和生成
- [x] 實作股票類型自動識別
- [x] 測試：智能修正流程正確

#### 1.3 動態並發控制 ✅
- [x] 增強 `RequestQueue` 類別
- [x] 實作動態並發數計算
- [x] 實作批次處理機制
- [x] 測試：並發數自動調整

### 階段 2：自選功能實現（40%）- 已完成 ✅

#### 2.1 自選股票配置 ✅
- [x] 新增 `CUSTOM_WATCHLIST` 配置
- [x] 實作 `identifyMarket()` 函式
- [x] 實作 `resolveDisplayMode()` 函式
- [x] 測試：市場識別正確

#### 2.2 自選股票數據處理 ✅
- [x] 實作 `fetchWatchlistData()` 函式
- [x] 實作 `mapLbkrsDetailToSystem()` 函式
- [x] 實作自選股票快取機制
- [x] 測試：自選數據正確獲取

#### 2.3 智能模式切換 ✅
- [x] 實作雙模式決策邏輯
- [x] 實作混合市場欄位設定
- [x] 實作 `getActiveColumnSettings()` 函式
- [x] 測試：模式切換正確

### 階段 3：界面和體驗（20%）- 已完成 ✅

#### 3.1 移除期權功能 ✅
- [x] 移除 `callRatio` 欄位配置
- [x] 移除 Call% 相關色彩配置
- [x] 移除期權快取機制
- [x] 測試：界面簡化正確

#### 3.2 混合市場顯示 ✅
- [x] 實作 `stockDisplay` 欄位邏輯
- [x] 實作 `formatColumnValue()` 混合市場邏輯
- [x] 調整欄位寬度分配
- [x] 測試：顯示格式正確

#### 3.3 Widget 建構優化 ✅
- [x] 更新 `createWidget()` 支援 mode 參數
- [x] 更新 `createDataRow()` 支援 mode 參數
- [x] 更新 `addColumnCell()` 支援混合市場
- [x] 測試：Widget 渲染正確

### 階段 4：優化和測試（10%）- 已完成 ✅

#### 4.1 執行時間監控 ✅
- [x] 新增程式開始/結束時間記錄
- [x] 新增模式、市場、股票數統計
- [x] 新增詳細日誌記錄
- [x] 測試：時間統計正確

#### 4.2 快取系統優化 ✅
- [x] 新增自選股票快取類型
- [x] 簡化快取架構（移除產業快取）
- [x] 實作市場特定快取
- [x] 測試：快取機制正確

#### 4.3 錯誤處理改進 ✅
- [x] 改進自選股票錯誤處理
- [x] 新增除錯檔案分類
- [x] 實作錯誤恢復機制
- [x] 測試：錯誤處理穩定

### 階段 5：整合測試（100% 完成）✅

#### 5.1 完整流程測試 ✅
- [x] 測試自選模式完整流程
- [x] 測試排行榜模式完整流程
- [x] 測試智能模式切換
- [x] 測試快取機制（含自選快取）
- [x] 測試錯誤處理

#### 5.2 視覺驗收 ✅
- [x] 混合市場顯示正確（美股代號，港股名稱）
- [x] K 線圖位置正確
- [x] 顏色遵循「綠漲紅跌」規則
- [x] 移除期權功能後界面簡潔

#### 5.3 性能測試 ✅
- [x] 測試動態並發控制
- [x] 測試自選股票載入性能
- [x] 測試多輪嘗試機制
- [x] 測試記憶體使用

---

## 關鍵 API 參考

### Scriptable APIs（v2.3）

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

## 效能優化建議（v2.3）

### 1. 並發請求優化
- ✅ 使用 `RequestQueue` 控制並發數（動態調整 5-30）
- ✅ 可透過 `MAX_CONCURRENT_REQUESTS` 調整基準值
- ✅ 自動佇列管理，避免過載

### 2. 快取策略優化
- ✅ 主列表：1 分鐘（平衡即時性與效能）
- ✅ 自選股票：1 分鐘（v2.3新增）
- ✅ K 線：1 分鐘（即時更新）
- ✅ 獨立美股/港股快取，避免誤用
- ✅ 使用 `FileManager.local()` 提升讀寫速度

### 3. 色彩計算優化
- ✅ `ColorCalculator` 內建 `Map` 快取
- ✅ 避免重複計算相同數值
- ✅ 插值計算僅在需要時執行

### 4. K 線繪製優化
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
- ✅ 限制 MAX_ITEMS ≤ 21（Large Widget 高度限制）
- ✅ 使用固定寬度避免佈局計算
- ✅ 預先計算最大成交額用於進度條

### 7. 自選股票優化（v2.3新增）
- ✅ 智能模式決策，避免不必要的 API 調用
- ✅ 動態並發控制，根據股票數量自動調整
- ✅ 多輪嘗試機制，提高數據獲取成功率
- ✅ 混合市場顯示，優化用戶體驗

---

## 常見問題排查（v2.3）

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
- [ ] Lbkrs 網站是否可訪問？
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

### 問題 6：自選股票不顯示（v2.3新增）
**檢查項目**：
- [ ] 確認 `CUSTOM_WATCHLIST` 配置正確
- [ ] 檢查股票代碼格式（美股字母，港股數字）
- [ ] 查看 Console 的自選股票錯誤訊息
- [ ] 檢查除錯檔案 `debug_watchlist_${stockCode}_*.txt`
- [ ] 驗證 Lbkrs Detail API 響應

### 問題 7：模式切換錯誤（v2.3新增）
**檢查項目**：
- [ ] 確認 `CUSTOM_WATCHLIST` 是否為空陣列
- [ ] 檢查 `resolveDisplayMode()` 函式邏輯
- [ ] 驗證 `CONFIG.MARKET` 設定
- [ ] 查看 Console 的模式決策日誌

### 問題 8：混合市場顯示異常（v2.3新增）
**檢查項目**：
- [ ] 確認 `stockDisplay` 欄位邏輯正確
- [ ] 檢查 `formatColumnValue()` 函式
- [ ] 驗證股票代碼格式識別
- [ ] 測試美股代號和港股名稱顯示

### 問題 9：K 線圖不顯示
**檢查項目**：
- [ ] 檢查 `stock.klineData` 是否為 null
- [ ] 查看 Console 的 K 線抓取錯誤訊息
- [ ] 檢查除錯檔案 `debug_kline_${stockCode}_*.txt`
- [ ] 確認 Lbkrs Detail API 數據完整性
- [ ] 驗證 K 線數據結構

### 問題 10：多輪嘗試機制失效（v2.3新增）
**檢查項目**：
- [ ] 確認 `fetchWithRetry()` 函式邏輯
- [ ] 檢查 Counter ID 格式是否正確
- [ ] 驗證股票類型識別邏輯
- [ ] 查看所有嘗試的錯誤訊息

---

## 附錄：完整資料結構範例（v2.3）

### 自選股票資料（v2.3新增）
```javascript
{
  stockCode: "NVDA",
  stockName: "英偉達",
  priceNominal: 445.20,
  changeRatio: "+2.84%",
  changeRatioNum: 2.84,
  tradeTrunover: "525000000",
  volumnRatio: 1.25,
  instrumentType: 3,
  industry: "半導體廠商",
  klineData: {
    open: 440.50,
    high: 450.80,
    low: 438.20,
    close: 445.20
  },
  _source: "watchlist",
  _rawData: {
    counter_id: "ST/US/NVDA",
    last_done: "445.20",
    open: "440.50",
    high: "450.80",
    low: "438.20",
    stock_name: "英偉達",
    industry_name: "半導體廠商"
  }
}
```

### 排行榜股票資料
```javascript
{
  rank: 1,
  stockCode: "00700",
  stockName: "騰訊控股",
  priceNominal: 385.20,
  changeRatio: "+2.15%",
  changeRatioNum: 2.15,
  tradeTrunover: "1235000000",
  volumnRatio: 1.25,
  instrumentType: 3,
  industry: "金融服務",
  klineData: {
    open: 380.00,
    high: 387.20,
    low: 378.50,
    close: 385.20
  },
  _source: "ranking",
  _rawData: {
    counter_id: "ST/HK/700",
    name: "騰訊控股",
    code: "700",
    indicators: ["385.20", "0.0215", "8.20", "3200000", "1235000000", "0.0325", "0.0180", "1.25", "0.0012", "45.20", "1100000000000", "0.0215", "0.0356", "0.0456", "0.0567", "0.1567", "0.0834", "金融服務"]
  }
}
```

### 配置範例（v2.3）
```javascript
{
  MARKET: 'AUTO',
  CUSTOM_WATCHLIST: ['NVDA', 'SPY', '0700', '9988', '2800'], // v2.3新增
  SHOW_STOCK: true,
  SHOW_ETF: true,
  MAX_ITEMS: 21,
  FONT_SIZE: 12,
  CACHE_DURATION: 1,
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
  },
  COLUMN_SETTINGS_MIXED: [ // v2.3新增
    { key: 'industry', header: '', width: 70, visible: true },
    { key: 'rank', header: '', width: 25, visible: false },
    { key: 'stockDisplay', header: '名稱/代號', width: 85, visible: true },
    { key: 'kline', header: '', width: 8, visible: true },
    { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
    { key: 'priceNominal', header: '價格', width: 50, visible: true },
    { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
    { key: 'volumnRatio', header: '量比', width: 30, visible: true }
  ]
}
```

---

## 版本歷史

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

---

**文件版本**: 2.3  
**最後更新**: 2025-11-04  
**適用對象**: AI 程式碼生成工具、開發者  
**維護狀態**: ✅ 已驗證與 Widget.js v2.3-Watchlist 完全同步