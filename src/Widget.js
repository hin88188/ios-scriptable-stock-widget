// Futunn 港股/美股成交額 Widget
// 版本: 2.1
// 日期: 2025-10-20

// ==================== 設定區 ====================
const CONFIG = {
    // 市場選擇
    MARKET: 'AUTO', // 'AUTO' 智慧切換 / 'US' 美股 / 'HK' 港股

    // 顯示設定
    SHOW_STOCK: true,           // 顯示股票
    SHOW_ETF: true,             // 顯示 ETF
    MAX_ITEMS: 20,              // 最多顯示筆數
    FONT_SIZE: 12,              // 字體大小

    // 快取設定
    CACHE_DURATION: 1,          // 主列表快取時間(分鐘)
    OPTIONS_CACHE_DURATION: 1,  // Call/Put 比例快取時間(分鐘)
    INDUSTRY_CACHE_DURATION: 1440, // 產業資訊快取時間(分鐘,24小時)
    KLINE_CACHE_DURATION: 1,    // K線數據快取時間(分鐘)

    // 效能設定
    MAX_CONCURRENT_REQUESTS: 10, // 最大並發請求數
    REQUEST_RETRY_COUNT: 3,      // 請求重試次數
    REQUEST_TIMEOUT: 10000,      // 請求超時(毫秒)

    // Cookie(可選)
    COOKIES: '',

    // 市場 URL 配置
    MARKET_URLS: {
        US: 'https://www.futunn.com/hk/quote/us/stock-list/all-us-stocks/top-turnover',
        HK: 'https://www.futunn.com/hk/quote/hk/stock-list/all-hk-stocks/top-turnover'
    },

    // K 線配置
    KLINE: {
        WIDTH: 8,            // K線總寬度
        HEIGHT: 12,          // K線總高度
        BODY_WIDTH: 8,       // 實體寬度 (填滿)
        SHADOW_WIDTH: 1.5,   // 影線寬度
        GAIN_COLOR: '#00C46B',      // 漲 (收盤 > 開盤)
        LOSS_COLOR: '#FF3B3B',      // 跌 (收盤 < 開盤)
        NEUTRAL_COLOR: '#CCCCCC'    // 平盤
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
        { key: 'callRatio', header: 'Call%', width: 40, visible: true },
    ],

    // 港股欄位設定
    COLUMN_SETTINGS_HK: [
        { key: 'industry', header: '', width: 70, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockName', header: '名稱', width: 85, visible: true },
        { key: 'kline', header: '', width: 8, visible: true },
        { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
        { key: 'priceNominal', header: '價格', width: 50, visible: true },
        { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
        { key: 'volumnRatio', header: '量比', width: 30, visible: true },
    ],

    // 顏色系統
    COLORS: {
        // 漲跌幅階梯式色票
        GAIN_LEVELS: {
            level5: '#008C4C', // > +5%
            level4: '#00A85C', // +3% ~ +5%
            level3: '#00C46B', // +1.5% ~ +3%
            level2: '#4BD68D', // +0.5% ~ +1.5%
            level1: '#9BE39E'  // +0% ~ +0.5%
        },
        LOSS_LEVELS: {
            level5: '#C60000', // < -5%
            level4: '#E62121', // -3% ~ -5%
            level3: '#FF3B3B', // -1.5% ~ -3%
            level2: '#FF6E6E', // -0.5% ~ -1.5%
            level1: '#FF9B9B'  // -0% ~ -0.5%
        },
        NEUTRAL: '#CCCCCC',

        // UI 基礎顏色
        background: Color.dynamic(Color.white(), new Color('#1C1C1E')),
        text: Color.dynamic(Color.black(), Color.white()),
        headerBackground: Color.dynamic(new Color('#F0F0F0'), new Color('#333333')),
    },

    // Call% 色塊專屬配色
    CALL_RATIO_COLORS: {
        extremeBearish: '#D32F2F',  // < 35%:過度悲觀(鮮紅)
        bearish: '#F44336',         // 35-45%:偏空(淺紅)
        neutral: '#757575',         // 45-55%:中性(灰色)
        bullish: '#4CAF50',         // 55-65%:偏多(綠色)
        extremeBullish: '#00ACC1'   // > 65%:過度樂觀(青藍)
    },
    
    // Call% 顏色計算閾值
    CALL_RATIO_THRESHOLDS: {
        EXTREME_BEARISH: 35,
        BEARISH: 45,
        NEUTRAL_LOW: 45,
        NEUTRAL_HIGH: 55,
        BULLISH: 65
    },

    // 量比顏色系統(冷→熱漸變)
    VOLUMN_RATIO_COLORS: {
        coldest: '#4B6B8A',    // < 0.5:深藍灰
        cold: '#3FA7D6',       // 0.5-1.5:中藍色
        warm: '#6DD57E',       // 1.5-2.5:淡綠色
        hot: '#FFD54F',        // 2.5-5.0:黃橙色
        hottest: '#FF5252',    // > 5.0:鮮紅色
    },

    // 量比顏色計算閾值
    VOLUMN_RATIO_THRESHOLDS: {
        COLDEST: 0.5,
        COLD: 1.5,
        WARM: 2.5,
        HOT: 5.0,
        MAX_CAP: 8.0,
    },

    // UI 常數
    UI: {
        HEADER_PADDING: { top: 4, left: 12, bottom: 4, right: 12 },
        ROW_PADDING: { top: 0, left: 12, bottom: 0, right: 12 },
        PROGRESS_BAR_HEIGHT: 1,
        CALL_LABEL_PADDING: { top: 0.5, left: 5, bottom: 0.5, right: 5 },
        CALL_LABEL_CORNER_RADIUS: 4,
        CALL_LABEL_TEXT_COLOR: '#FFFFFF',
    }
};

// ==================== 核心類別:請求佇列管理 ====================
class RequestQueue {
    constructor(maxConcurrent = 10) {
        this.maxConcurrent = maxConcurrent;
        this.running = 0;
        this.queue = [];
    }

    /**
     * 新增請求到佇列
     * @param {Function} requestFn - 請求函式
     * @returns {Promise} 請求結果
     */
    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.process();
        });
    }

    /**
     * 處理佇列
     */
    async process() {
        if (this.running >= this.maxConcurrent || this.queue.length === 0) return;

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
}

// ==================== 核心類別:資料抓取器 ====================
class DataFetcher {
    constructor(config) {
        this.config = config;
        this.queue = new RequestQueue(config.MAX_CONCURRENT_REQUESTS);
    }

    /**
     * 建立 HTTP 請求標頭
     * @returns {Object} 標頭物件
     */
    buildHeaders() {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Referer': 'https://www.google.com/'
        };
        if (this.config.COOKIES) {
            headers['Cookie'] = this.config.COOKIES;
        }
        return headers;
    }

    /**
     * 帶重試機制的網路請求
     * @param {string} url - 目標網址
     * @param {number} maxRetries - 最大重試次數
     * @returns {Promise<string>} HTML 內容
     */
    async fetchWithRetry(url, maxRetries = CONFIG.REQUEST_RETRY_COUNT) {
        return this.queue.add(async () => {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const req = new Request(url);
                    req.headers = this.buildHeaders();
                    req.timeoutInterval = CONFIG.REQUEST_TIMEOUT / 1000;
                    return await req.loadString();
                } catch (error) {
                    if (attempt === maxRetries - 1) throw error;
                    // 指數退避
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        });
    }

    /**
     * 延遲函式
     * @param {number} ms - 延遲毫秒數
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 解析 Futunn 網頁的 __INITIAL_STATE__
     * @param {string} url - 目標網址
     * @param {string} context - 上下文描述
     * @returns {Promise<Object>} 解析後的 JSON
     */
    async fetchAndParseInitialState(url, context) {
        const html = await this.fetchWithRetry(url);
        const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
        
        if (!match || !match[1]) {
            saveDebugFile(`debug_${context}_html.txt`, html);
            throw new Error(`在 ${context} 頁面找不到資料區塊`);
        }
        
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            saveDebugFile(`debug_${context}_json_error.txt`, match[1]);
            throw new Error(`${context} JSON 解析失敗: ${e.message}`);
        }
    }
}

// ==================== 核心類別:快取管理器 ====================
class CacheManager {
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

    /**
     * 讀取快取資料
     * @param {'main'|'options'|'industry'|'kline'} type - 快取類型
     * @param {string} [keyOrMarket=null] - 項目索引鍵或市場代碼
     * @returns {any|null} 快取資料或 null
     */
    get(type, keyOrMarket = null) {
        let path;
        
        if (type === 'main' && keyOrMarket) {
            // 主列表需要市場代碼
            path = this.paths[type][keyOrMarket];
        } else if (type === 'main') {
            // 主列表但無市場代碼,返回 null
            return null;
        } else {
            // options/industry/kline
            path = this.paths[type];
        }
        
        if (!this.fm.fileExists(path)) return null;

        try {
            const cache = JSON.parse(this.fm.readString(path));
            
            if (type === 'main') {
                // 主列表:直接檢查時效
                const age = (new Date() - new Date(cache.timestamp)) / 60000;
                if (age > this.durations[type]) return null;
                return cache;
            } else {
                // options/industry/kline:檢查特定 key
                const data = cache[keyOrMarket];
                if (!data) return null;
                const age = (new Date() - new Date(data.timestamp)) / 60000;
                if (age > this.durations[type]) return null;
                return data.value;
            }
        } catch (e) {
            console.error(`讀取 ${type} 快取失敗: ${e.message}`);
            return null;
        }
    }

    /**
     * 寫入快取資料
     * @param {'main'|'options'|'industry'|'kline'} type - 快取類型
     * @param {string|Object} keyOrDataOrMarket - 市場代碼/索引鍵/主快取資料
     * @param {any} [value=null] - 要快取的值
     */
    set(type, keyOrDataOrMarket, value = null) {
        let path;
        
        try {
            if (type === 'main') {
                // 主列表:keyOrDataOrMarket 是市場代碼,value 是資料
                const market = keyOrDataOrMarket;
                path = this.paths[type][market];
                this.fm.writeString(path, JSON.stringify(value));
            } else {
                // options/industry/kline:keyOrDataOrMarket 是索引鍵,value 是資料
                path = this.paths[type];
                let items = this.fm.fileExists(path) ? JSON.parse(this.fm.readString(path)) : {};
                items[keyOrDataOrMarket] = { value: value, timestamp: new Date() };
                this.fm.writeString(path, JSON.stringify(items, null, 2));
            }
        } catch (e) {
            console.error(`${type} 快取寫入失敗: ${e.message}`);
        }
    }
}

// ==================== 核心類別:顏色計算器 ====================
class ColorCalculator {
    constructor(config) {
        this.config = config;
        this.cache = new Map();
    }

    /**
     * 取得漲跌幅顏色(帶快取)
     * @param {number} ratio - 漲跌幅
     * @returns {Color} 顏色物件
     */
    getChangeRatioColor(ratio) {
        const key = `change_${ratio.toFixed(2)}`;
        if (this.cache.has(key)) return this.cache.get(key);
        
        const color = this.calculateChangeRatioColor(ratio);
        this.cache.set(key, color);
        return color;
    }

    /**
     * 計算漲跌幅階梯式顏色
     * @param {number} ratio - 漲跌幅
     * @returns {Color} 顏色物件
     */
    calculateChangeRatioColor(ratio) {
        const { GAIN_LEVELS, LOSS_LEVELS, NEUTRAL } = this.config.COLORS;

        if (ratio > 5) return new Color(GAIN_LEVELS.level5);
        if (ratio > 3) return new Color(GAIN_LEVELS.level4);
        if (ratio > 1.5) return new Color(GAIN_LEVELS.level3);
        if (ratio > 0.5) return new Color(GAIN_LEVELS.level2);
        if (ratio > 0) return new Color(GAIN_LEVELS.level1);

        if (ratio < -5) return new Color(LOSS_LEVELS.level5);
        if (ratio < -3) return new Color(LOSS_LEVELS.level4);
        if (ratio < -1.5) return new Color(LOSS_LEVELS.level3);
        if (ratio < -0.5) return new Color(LOSS_LEVELS.level2);
        if (ratio < 0) return new Color(LOSS_LEVELS.level1);

        return new Color(NEUTRAL);
    }

    /**
     * 取得 Call% 顏色(帶快取)
     * @param {number} ratio - Call 百分比
     * @returns {Color} 顏色物件
     */
    getCallRatioColor(ratio) {
        const key = `call_${ratio}`;
        if (this.cache.has(key)) return this.cache.get(key);
        
        const color = this.calculateCallRatioColor(ratio);
        this.cache.set(key, color);
        return color;
    }

    /**
     * 計算 Call% 色塊顏色
     * @param {number} ratio - Call 百分比
     * @returns {Color} 顏色物件
     */
    calculateCallRatioColor(ratio) {
        const t = this.config.CALL_RATIO_THRESHOLDS;
        const c = this.config.CALL_RATIO_COLORS;
        
        if (ratio < t.EXTREME_BEARISH) return new Color(c.extremeBearish);
        if (ratio < t.BEARISH) return new Color(c.bearish);
        if (ratio >= t.NEUTRAL_LOW && ratio <= t.NEUTRAL_HIGH) return new Color(c.neutral);
        if (ratio <= t.BULLISH) return new Color(c.bullish);
        return new Color(c.extremeBullish);
    }

    /**
     * 取得量比顏色(帶快取)
     * @param {number} ratio - 量比
     * @returns {Color} 顏色物件
     */
    getVolumnRatioColor(ratio) {
        const key = `volumn_${ratio.toFixed(2)}`;
        if (this.cache.has(key)) return this.cache.get(key);
        
        const color = this.calculateVolumnRatioColor(ratio);
        this.cache.set(key, color);
        return color;
    }

    /**
     * 計算量比漸變顏色
     * @param {number} ratio - 量比
     * @returns {Color} 顏色物件
     */
    calculateVolumnRatioColor(ratio) {
        const t = this.config.VOLUMN_RATIO_THRESHOLDS;
        const c = this.config.VOLUMN_RATIO_COLORS;
        const capped = Math.min(ratio, t.MAX_CAP);
        
        if (capped < t.COLDEST) return new Color(c.coldest);
        if (capped < t.COLD) return this.interpolate(c.coldest, c.cold, (capped - 0) / (t.COLD - 0));
        if (capped < t.WARM) return this.interpolate(c.cold, c.warm, (capped - t.COLD) / (t.WARM - t.COLD));
        if (capped < t.HOT) return this.interpolate(c.warm, c.hot, (capped - t.WARM) / (t.HOT - t.WARM));
        return this.interpolate(c.hot, c.hottest, (capped - t.HOT) / (t.MAX_CAP - t.HOT));
    }

    /**
     * 線性插值計算顏色
     * @param {string} hex1 - 起始顏色
     * @param {string} hex2 - 結束顏色
     * @param {number} ratio - 插值比例
     * @returns {Color} 插值後的顏色
     */
    interpolate(hex1, hex2, ratio) {
        const c1 = this.hexToRgb(hex1);
        const c2 = this.hexToRgb(hex2);
        const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
        const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
        const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
        return new Color(this.rgbToHex(r, g, b));
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }
}

/**
 * 自動判斷應顯示哪個市場(支援夏令時)
 * @returns {'US'|'HK'}
 */
function resolveMarketAuto() {
    const now = new Date();

    // 紐約當地時間
    const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const nyDay = ny.getDay(); // 0=Sun, 6=Sat
    const nyHour = ny.getHours();
    const nyMin = ny.getMinutes();
    const nyTime = nyHour * 60 + nyMin; // 轉換為分鐘

    // 香港當地時間
    const hk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
    const hkDay = hk.getDay();
    const hkHour = hk.getHours();
    const hkMin = hk.getMinutes();
    const hkTime = hkHour * 60 + hkMin;

    // 判斷開盤狀態
    // 港股開盤:週一至五 09:30~16:00(香港時間)
    const hkOpen = hkDay >= 1 && hkDay <= 5 && hkTime >= 9 * 60 + 30 && hkTime <= 16 * 60;

    // 美股開盤:週一至五 09:30~16:00(美東時間)
    const usOpen = nyDay >= 1 && nyDay <= 5 && nyTime >= 9 * 60 + 30 && nyTime <= 16 * 60;

    // === 決策邏輯 ===
    
    // 1. 優先顯示開盤中的市場
    if (usOpen) return 'US';
    if (hkOpen) return 'HK';

    // 2. 兩市都收盤時,根據時段判斷
    
    // 週末(香港時間週六、日)
    if (hkDay === 0 || hkDay === 6) {
        return 'US'; // 顯示週五美股
    }

    // 工作日(週一~週五)
    if (hkDay >= 1 && hkDay <= 5) {
        // 港股收盤後、美股開盤前(16:01-21:29)
        if (hkTime > 16 * 60 && hkTime < 21 * 60 + 30) {
            return 'HK'; // 顯示今日港股
        }
        
        // 美股收盤後、港股開盤前(04:01-09:29)
        if (hkTime > 4 * 60 && hkTime < 9 * 60 + 30) {
            return 'US'; // 顯示昨夜美股
        }
    }

    // 3. 預設:美股
    return 'US';
}


// ==================== 主程式 ====================
/**
 * 主函式
 */
async function main() {
    try {
        const market = CONFIG.MARKET === 'AUTO' ? resolveMarketAuto() : CONFIG.MARKET;
        const cache = new CacheManager(CONFIG);
        const fetcher = new DataFetcher(CONFIG);
        const colorCalc = new ColorCalculator(CONFIG);

        // 1. 取得主列表資料(使用市場特定快取)
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

        // 4. 計算最大成交額(預先計算,避免重複)
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

// ==================== 資料抓取函式 ====================

/**
 * 抓取成交額排行資料
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {string} market - 市場代碼 ('US' 或 'HK')
 * @returns {Promise<Array>} 股票列表
 */
async function fetchStockData(fetcher, market) {
    const url = CONFIG.MARKET_URLS[market];
    const data = await fetcher.fetchAndParseInitialState(url, `turnover_${market}`);
    
    if (!data?.stock_list?.list) {
        saveDebugFile(`debug_turnover_${market}_json.txt`, JSON.stringify(data, null, 2));
        throw new Error(`${market} 成交額資料格式錯誤`);
    }
    
    // 解析時同時取得股票名稱
    return data.stock_list.list.map(stock => ({
        ...stock,
        stockName: stock.name || '--'
    }));
}

/**
 * 抓取單一股票的 Call/Put 比例(僅美股)
 * @param {Object} stock - 股票資料物件
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {CacheManager} cache - 快取管理器
 * @returns {Promise<number|string>} Call 百分比或 '--'
 */
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

/**
 * 根據股票代號和市場生成 TradingView URL
 * @param {string} stockCode - 股票代號
 * @param {string} market - 市場代碼 ('US' 或 'HK')
 * @returns {string} TradingView URL
 */
function generateTradingViewUrl(stockCode, market) {
    if (market === 'HK') {
        // 港股:去前導零 + HKEX 前綴
        const numericCode = parseInt(stockCode, 10);
        return `https://tw.tradingview.com/symbols/HKEX-${numericCode}/`;
    } else {
        // 美股:直接使用代號
        if (/^\d+$/.test(stockCode)) {
            // 如果是純數字(少見),也加 HKEX 前綴
            const numericCode = parseInt(stockCode, 10);
            return `https://tw.tradingview.com/symbols/HKEX-${numericCode}/`;
        }
        return `https://tw.tradingview.com/symbols/${stockCode}/`;
    }
}

/**
 * 抓取單一股票的產業資訊
 * @param {Object} stock - 股票資料物件
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {CacheManager} cache - 快取管理器
 * @param {string} market - 市場代碼
 * @returns {Promise<string>} 產業名稱或 '--'
 */
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

/**
 * 抓取單一股票的 K 線數據
 * @param {Object} stock - 股票資料物件
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {CacheManager} cache - 快取管理器
 * @param {string} market - 市場代碼
 * @returns {Promise<Object|null>} OHLC 數據或 null
 */
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
            close: parseFloat(stock.priceNominal) || null  // 使用主列表的現價
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

/**
 * 並發為所有股票補充產業與期權資料
 * @param {Array} data - 股票資料陣列
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {CacheManager} cache - 快取管理器
 * @param {string} market - 市場代碼
 * @returns {Promise<Array>} 補充後的股票資料陣列
 */
async function enrichStockData(data, fetcher, cache, market) {
    const enrichedData = await Promise.all(data.map(async (stock) => {
        const industry = await fetchSingleIndustry(stock, fetcher, cache, market);
        
        // 僅美股抓取 Call%
        let callRatio = '--';
        if (market === 'US') {
            callRatio = await fetchSingleCallRatio(stock, fetcher, cache);
        }
        
        // 新增: K 線數據補充
        const klineData = await fetchSingleKlineData(stock, fetcher, cache, market);
        
        return { ...stock, industry, callRatio, klineData };
    }));
    return enrichedData;
}

// ==================== 資料處理函式 ====================

/**
 * 過濾並格式化股票資料
 * @param {Array} stockList - 原始股票列表
 * @returns {Array} 過濾並格式化後的資料
 */
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

// ==================== Widget 建立函式 ====================

/**
 * 取得當前市場的欄位設定
 * @param {string} market - 市場代碼
 * @returns {Array} 欄位設定陣列
 */
function getActiveColumnSettings(market) {
    return market === 'HK' ? CONFIG.COLUMN_SETTINGS_HK : CONFIG.COLUMN_SETTINGS_US;
}

/**
 * 建立完整的 Widget
 * @param {Array} stockData - 股票資料陣列
 * @param {Date} updateTime - 更新時間
 * @param {number} maxTurnover - 最大成交額
 * @param {ColorCalculator} colorCalc - 顏色計算器
 * @param {string} market - 市場代碼
 * @returns {ListWidget} Widget 物件
 */
async function createWidget(stockData, updateTime, maxTurnover, colorCalc, market) {
    const widget = new ListWidget();
    widget.backgroundColor = CONFIG.COLORS.background;
    widget.spacing = 0;
    widget.setPadding(0, 0, 0, 0);

    const visibleColumns = getActiveColumnSettings(market).filter(c => c.visible);

    // 建立標題列
    createHeaderRow(widget, updateTime, visibleColumns, market);

    // 計算總欄位寬度
    const totalBarWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0);

    // 建立資料列
    for (const stock of stockData) {
        createDataRow(widget, stock, maxTurnover, totalBarWidth, visibleColumns, colorCalc, market);
    }

    return widget;
}

/**
 * 建立標題列
 * @param {ListWidget} widget - Widget 物件
 * @param {Date} updateTime - 更新時間
 * @param {Array} columns - 欄位設定陣列
 * @param {string} market - 市場代碼
 */
function createHeaderRow(widget, updateTime, columns, market) {
    const timeFormatter = new DateFormatter();
    timeFormatter.dateFormat = 'HH:mm';
    const timeString = timeFormatter.string(updateTime);

    const headerRow = widget.addStack();
    headerRow.layoutHorizontally();
    const p = CONFIG.UI.HEADER_PADDING;
    headerRow.setPadding(p.top, p.left, p.bottom, p.right);
    headerRow.backgroundColor = CONFIG.COLORS.headerBackground;

    columns.forEach(col => {
        const colStack = headerRow.addStack();
        colStack.size = new Size(col.width, 0);
        
        const headerText = col.key === 'industry' ? timeString : col.header;
        
        const colHeader = colStack.addText(headerText);
        colHeader.font = Font.boldSystemFont(CONFIG.FONT_SIZE);
        colHeader.textColor = CONFIG.COLORS.text;
    });
}

/**
 * 建立資料列
 * @param {ListWidget} widget - Widget 物件
 * @param {Object} stock - 單筆股票資料
 * @param {number} maxTurnover - 最大成交額
 * @param {number} totalBarWidth - 總欄位寬度
 * @param {Array} columns - 欄位設定陣列
 * @param {ColorCalculator} colorCalc - 顏色計算器
 * @param {string} market - 市場代碼
 */
function createDataRow(widget, stock, maxTurnover, totalBarWidth, columns, colorCalc, market) {
    const rowContainer = widget.addStack();
    rowContainer.layoutVertically();
    const p = CONFIG.UI.ROW_PADDING;
    rowContainer.setPadding(p.top, p.left, p.bottom, p.right);

    const rowStack = rowContainer.addStack();
    rowStack.layoutHorizontally();
    rowStack.centerAlignContent();

    // 計算該列的顏色
    const rowColor = colorCalc.getChangeRatioColor(stock.changeRatioNum);

    // 建立各欄位
    columns.forEach(col => {
        addColumnCell(rowStack, col, stock, rowColor, colorCalc, market);
    });

    // 成交額比例線
    addProgressBar(rowContainer, stock, maxTurnover, totalBarWidth, rowColor);
}

/**
 * 新增欄位儲存格
 * @param {WidgetStack} rowStack - 列容器
 * @param {Object} col - 欄位設定
 * @param {Object} stock - 股票資料
 * @param {Color} rowColor - 列顏色
 * @param {ColorCalculator} colorCalc - 顏色計算器
 * @param {string} market - 市場代碼
 */
function addColumnCell(rowStack, col, stock, rowColor, colorCalc, market) {
    const colStack = rowStack.addStack();
    colStack.size = new Size(col.width, 0);
    colStack.centerAlignContent();

    // 新增: K 線欄位處理
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

/**
 * 繪製 K 線圖
 * @param {WidgetStack} colStack - 欄位容器
 * @param {Object} klineData - OHLC 數據
 * @param {Object} config - K 線配置
 * @returns {void}
 */
function drawKline(colStack, klineData, config) {
    if (!klineData) {
        // 無數據時顯示空白
        colStack.addSpacer();
        return;
    }
    
    const { open, high, low, close } = klineData;
    const { WIDTH, HEIGHT, BODY_WIDTH, SHADOW_WIDTH, GAIN_COLOR, LOSS_COLOR, NEUTRAL_COLOR } = config;
    
    // 判斷漲跌
    let color;
    if (close > open) {
        color = new Color(GAIN_COLOR);  // 綠漲
    } else if (close < open) {
        color = new Color(LOSS_COLOR);  // 紅跌
    } else {
        color = new Color(NEUTRAL_COLOR);  // 平盤
    }
    
    // 計算比例
    const range = high - low;
    if (range === 0) {
        // 一字板:繪製水平線
        const lineStack = colStack.addStack();
        lineStack.size = new Size(WIDTH, SHADOW_WIDTH);
        lineStack.backgroundColor = color;
        return;
    }
    
    // 計算各部分高度(從上到下)
    const upperShadowHeight = ((high - Math.max(open, close)) / range) * HEIGHT;
    const bodyHeight = (Math.abs(close - open) / range) * HEIGHT;
    const lowerShadowHeight = ((Math.min(open, close) - low) / range) * HEIGHT;
    
    // K 線容器(垂直排列)
    const klineContainer = colStack.addStack();
    klineContainer.layoutVertically();
    klineContainer.size = new Size(WIDTH, HEIGHT);
    klineContainer.centerAlignContent();
    
    // 上影線 - 使用水平 stack 來置中
    if (upperShadowHeight > 0) {
        const upperShadowRow = klineContainer.addStack();
        upperShadowRow.layoutHorizontally();
        upperShadowRow.size = new Size(WIDTH, upperShadowHeight);
        upperShadowRow.centerAlignContent();
        
        const upperShadow = upperShadowRow.addStack();
        upperShadow.size = new Size(SHADOW_WIDTH, upperShadowHeight);
        upperShadow.backgroundColor = color;
    }
    
    // 實體
    if (bodyHeight > 0) {
        const body = klineContainer.addStack();
        body.size = new Size(BODY_WIDTH, Math.max(bodyHeight, 1)); // 最小 1px
        body.backgroundColor = color;
        body.cornerRadius = 0;
    }
    
    // 下影線 - 使用水平 stack 來置中
    if (lowerShadowHeight > 0) {
        const lowerShadowRow = klineContainer.addStack();
        lowerShadowRow.layoutHorizontally();
        lowerShadowRow.size = new Size(WIDTH, lowerShadowHeight);
        lowerShadowRow.centerAlignContent();
        
        const lowerShadow = lowerShadowRow.addStack();
        lowerShadow.size = new Size(SHADOW_WIDTH, lowerShadowHeight);
        lowerShadow.backgroundColor = color;
    }
}

/**
 * 格式化欄位值
 * @param {string} key - 欄位鍵
 * @param {Object} stock - 股票資料
 * @param {string} market - 市場代碼
 * @returns {string} 格式化後的值
 */
function formatColumnValue(key, stock, market) {
    switch (key) {
        case 'stockCode':
            // 美股:去前導零(如有),港股:保持原樣或去前導零
            return /^\d+$/.test(stock.stockCode) 
                ? String(parseInt(stock.stockCode, 10)) 
                : stock.stockCode;
        
        case 'stockName':
            // 港股名稱
            return stock.stockName || '--';
        
        case 'priceNominal':
            return stock.priceNominal.toFixed(2);
        
        case 'tradeTrunover':
            return formatTurnover(stock.tradeTrunover);
        
        case 'volumnRatio':
            return stock.volumnRatio.toFixed(2);
        
        case 'callRatio':
            return stock.callRatio !== '--' ? `${stock.callRatio}%` : '--';
        
        default:
            return String(stock[key]);
    }
}

/**
 * 新增 Call% 色塊標籤
 * @param {WidgetStack} colStack - 欄位容器
 * @param {string} value - 顯示值
 * @param {number} callRatio - Call 百分比
 * @param {ColorCalculator} colorCalc - 顏色計算器
 */
function addCallRatioLabel(colStack, value, callRatio, colorCalc) {
    const labelContainer = colStack.addStack();
    labelContainer.backgroundColor = colorCalc.getCallRatioColor(parseFloat(callRatio));
    labelContainer.cornerRadius = CONFIG.UI.CALL_LABEL_CORNER_RADIUS;
    const lp = CONFIG.UI.CALL_LABEL_PADDING;
    labelContainer.setPadding(lp.top, lp.left, lp.bottom, lp.right);
    
    const colText = labelContainer.addText(String(value));
    colText.font = Font.mediumSystemFont(CONFIG.FONT_SIZE);
    colText.textColor = new Color(CONFIG.UI.CALL_LABEL_TEXT_COLOR);
    colText.lineLimit = 1;
}

/**
 * 新增一般文字儲存格
 * @param {WidgetStack} colStack - 欄位容器
 * @param {string} value - 顯示值
 * @param {string} key - 欄位鍵
 * @param {Object} stock - 股票資料
 * @param {Color} rowColor - 列顏色
 * @param {ColorCalculator} colorCalc - 顏色計算器
 */
function addTextCell(colStack, value, key, stock, rowColor, colorCalc) {
    const colText = colStack.addText(String(value));
    colText.font = Font.mediumSystemFont(CONFIG.FONT_SIZE);
    colText.textColor = key === 'volumnRatio'
        ? colorCalc.getVolumnRatioColor(stock.volumnRatio)
        : rowColor;
    colText.lineLimit = 1;
}

/**
 * 新增成交額比例線
 * @param {WidgetStack} rowContainer - 列容器
 * @param {Object} stock - 股票資料
 * @param {number} maxTurnover - 最大成交額
 * @param {number} totalBarWidth - 總寬度
 * @param {Color} rowColor - 列顏色
 */
function addProgressBar(rowContainer, stock, maxTurnover, totalBarWidth, rowColor) {
    const currentTurnover = parseTurnoverToNumber(stock.tradeTrunover);
    const ratio = maxTurnover > 0 ? Math.min(currentTurnover / maxTurnover, 1) : 0;
    const barWidth = totalBarWidth * ratio;

    const barContainer = rowContainer.addStack();
    barContainer.size = new Size(totalBarWidth, CONFIG.UI.PROGRESS_BAR_HEIGHT);
    barContainer.backgroundColor = new Color("#888888", 0.2);

    if (barWidth > 0) {
        const progressBar = barContainer.addStack();
        progressBar.size = new Size(barWidth, CONFIG.UI.PROGRESS_BAR_HEIGHT);
        progressBar.backgroundColor = rowColor;
        barContainer.addSpacer();
    }
}

/**
 * 建立錯誤顯示 Widget
 * @param {string} errorMessage - 錯誤訊息
 * @returns {ListWidget} 錯誤 Widget
 */
function createErrorWidget(errorMessage) {
    const widget = new ListWidget();
    widget.backgroundColor = new Color('#5A0000');
    widget.setPadding(12, 12, 12, 12);
    
    const title = widget.addText('❌ Widget 錯誤');
    title.font = Font.boldSystemFont(14);
    title.textColor = Color.white();
    
    widget.addSpacer(8);
    
    const text = widget.addText(errorMessage);
    text.font = Font.systemFont(11);
    text.textColor = new Color('#FFDDDD');
    
    return widget;
}

// ==================== 工具函式 ====================

/**
 * 格式化成交額顯示
 * @param {string|number} numStr - 原始成交額
 * @returns {string} 格式化後的字串
 */
function formatTurnover(numStr) {
    const value = parseTurnoverToNumber(numStr);
    if (isNaN(value) || value === 0) return String(numStr);
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toFixed(2);
}

/**
 * 解析成交額字串為數字
 * @param {string|number} numStr - 原始成交額
 * @returns {number} 數字值
 */
function parseTurnoverToNumber(numStr) {
    if (typeof numStr !== 'string') return parseFloat(numStr) || 0;
    const num = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(num)) return 0;
    const upper = numStr.toUpperCase();
    if (upper.includes('億')) return num * 1e8;
    if (upper.includes('萬')) return num * 1e4;
    if (upper.includes('B')) return num * 1e9;
    if (upper.includes('M')) return num * 1e6;
    if (upper.includes('K')) return num * 1e3;
    return num;
}

/**
 * 儲存除錯檔案
 * @param {string} filename - 檔案名稱
 * @param {string} content - 檔案內容
 */
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

// ==================== 執行 ====================
await main();