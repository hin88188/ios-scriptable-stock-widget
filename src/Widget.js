// Lbkrs 港股/美股成交額 Widget
// 版本: 2.3-Watchlist
// 日期: 2025-11-04

// ==================== 設定區 ====================
const CONFIG = {
    // 市場選擇
    MARKET: 'AUTO', // 'AUTO' 智慧切換 / 'US' 美股 / 'HK' 港股

    // 自選股票配置，將下方註解打開即可使用
    // CUSTOM_WATCHLIST: ['NVDA', 'SPY', '0700', '9988', '2800'],

    // 顯示設定
    SHOW_STOCK: true,           // 顯示股票
    SHOW_ETF: true,             // 顯示 ETF
    MAX_ITEMS: 21,              // 最多顯示筆數
    FONT_SIZE: 12,              // 字體大小

    // 快取設定
    CACHE_DURATION: 1,          // 主列表快取時間(分鐘)
    KLINE_CACHE_DURATION: 1,    // K線數據快取時間(分鐘)

    // 效能設定
    MAX_CONCURRENT_REQUESTS: 10, // 最大並發請求數
    REQUEST_RETRY_COUNT: 3,      // 請求重試次數
    REQUEST_TIMEOUT: 10000,      // 請求超時(毫秒)

    // Cookie(可選)
    COOKIES: '',

    // 市場 URL 配置
    MARKET_URLS: {
        US: 'https://m-gl.lbkrs.com/api/forward/newmarket/revision/rank/pc/list?key=all&market=US&indicators[]=last_done&indicators[]=chg&indicators[]=change&indicators[]=total_amount&indicators[]=total_balance&indicators[]=turnover_rate&indicators[]=amplitude&indicators[]=volume_rate&indicators[]=depth_rate&indicators[]=pb_ttm&indicators[]=market_cap&indicators[]=five_min_chg&indicators[]=five_day_chg&indicators[]=ten_day_chg&indicators[]=twenty_day_chg&indicators[]=this_year_chg&indicators[]=half_year_chg&indicators[]=industry&sort_indicator=total_balance&order=desc&offset=0&limit=40',
        HK: 'https://m-gl.lbkrs.com/api/forward/newmarket/revision/rank/pc/list?key=all&market=HK&indicators[]=last_done&indicators[]=chg&indicators[]=change&indicators[]=total_amount&indicators[]=total_balance&indicators[]=turnover_rate&indicators[]=amplitude&indicators[]=volume_rate&indicators[]=depth_rate&indicators[]=pb_ttm&indicators[]=market_cap&indicators[]=five_min_chg&indicators[]=five_day_chg&indicators[]=ten_day_chg&indicators[]=twenty_day_chg&indicators[]=this_year_chg&indicators[]=half_year_chg&indicators[]=industry&sort_indicator=total_balance&order=desc&offset=0&limit=40'
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
        { key: 'industry', header: '', width: 70, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockCode', header: '代號', width: 50, visible: true },
        { key: 'kline', header: '', width: 8, visible: true },
        { key: 'changeRatio', header: '漲跌%', width: 55, visible: true },
        { key: 'priceNominal', header: '價格', width: 50, visible: true },
        { key: 'tradeTrunover', header: '成交額', width: 45, visible: true },
        { key: 'volumnRatio', header: '量比', width: 30, visible: true },
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

    // 混合市場自選股票欄位設定（v2.3新增）
    COLUMN_SETTINGS_MIXED: [
        { key: 'industry', header: '', width: 70, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockDisplay', header: '名稱/代號', width: 85, visible: true },
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
    }
};

// ==================== 核心類別:請求佇列管理 ====================
class RequestQueue {
    constructor(getConcurrencyFn) {
        this.maxConcurrent = 10;
        this.getConcurrencyFn = getConcurrencyFn || (() => 10);
        this.running = 0;
        this.queue = [];
    }

    /**
     * 計算動態並發數
     * @returns {number} 並發數
     */
    getConcurrency() {
        if (typeof this.getConcurrencyFn === 'function') {
            return Math.min(this.getConcurrencyFn(), 30);
        }
        return Math.min(this.maxConcurrent, 30);
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
}

// ==================== 核心類別:資料抓取器 ====================
class DataFetcher {
    constructor(config) {
        this.config = config;
        this.queue = new RequestQueue((stockCount) => {
            // 動態計算並發數：Math.min(股票數 + 5, 30)
            return Math.min((stockCount || 0) + 5, 30);
        });
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
     * 延遲函式 - Scriptable完全兼容版本
     * @param {number} ms - 延遲毫秒數
     * @returns {Promise}
     */
    async delay(ms) {
        if (ms <= 0) return;
        // 完全避免setTimeout，使用簡單的同步等待
        const start = Date.now();
        while (Date.now() - start < ms) {
            // 空循環等待，避免任何可能的setTimeout調用
            // 在Scriptable中這是最可靠的方式
        }
    }

    /**
     * 獲取 Lbkrs JSON API 數據
     * @param {string} url - Lbkrs API 網址
     * @param {string} context - 上下文描述
     * @returns {Promise<Object>} API 響應數據
     */
    async fetchLbkrsApi(url, context) {
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

    /**
     * 獲取 Lbkrs Detail API 數據
     * @param {string} counterId - Lbkrs Counter ID (格式: {TYPE}/{MARKET}/{SYMBOL})
     * @param {string} context - 上下文描述
     * @returns {Promise<Object>} 詳細數據
     */
    async fetchLbkrsDetailData(counterId, context) {
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
}

// ==================== 核心類別:快取管理器 ====================
class CacheManager {
    constructor(config) {
        this.config = config;
        this.fm = FileManager.local();
        this.paths = {
            main: {
                US: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_ranking_cache_us.json'),
                HK: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_ranking_cache_hk.json')
            },
            watchlist: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_watchlist_cache.json'),
            kline: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_kline_cache.json')
        };
        this.durations = {
            main: config.CACHE_DURATION,
            watchlist: config.CACHE_DURATION,
            kline: config.KLINE_CACHE_DURATION
        };
    }

    /**
     * 讀取快取資料
     * @param {'main'|'watchlist'|'kline'} type - 快取類型
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
            // watchlist/kline
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
                // watchlist/kline:檢查特定 key
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
     * @param {'main'|'watchlist'|'kline'} type - 快取類型
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
                // watchlist/kline:keyOrDataOrMarket 是索引鍵,value 是資料
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


// ==================== 核心決策邏輯 ====================

/**
 * 智能雙模式自動切換
 * 根據自選股票配置決定顯示模式：自選模式優先，無自選時回退排行榜模式
 * @returns {Object} { mode: 'watchlist'|'ranking', market: 'US'|'HK'|'AUTO' }
 */
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

/**
 * 自動市場識別系統
 * 根據股票代碼格式自動識別所屬市場
 * @param {string} stockCode - 股票代碼
 * @returns {'US'|'HK'} 市場代碼
 */
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

/**
 * 生成 Lbkrs Counter ID
 * @param {string} stockCode - 股票代碼
 * @param {string} instrumentType - 儀器類型 ('ST' 或 'ETF')
 * @param {string} market - 市場 ('US' 或 'HK')
 * @returns {string} Counter ID (格式: {TYPE}/{MARKET}/{SYMBOL})
 */
function buildCounterId(stockCode, instrumentType, market) {
    // 港股代碼需要去除前導零，美股保持原樣
    const formattedCode = market === 'HK' ? String(parseInt(stockCode, 10)) : stockCode;
    return `${instrumentType}/${market}/${formattedCode}`;
}

/**
 * 解析 Lbkrs Counter ID
 * @param {string} counterId - Lbkrs Counter ID
 * @returns {Object} 解析結果 { stockCode, instrumentType, market }
 */
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

/**
 * 根據 counter_id 推斷股票類型
 * @param {string} counterId - Lbkrs 股票 ID
 * @returns {string} 股票類型 ('ST' 或 'ETF')
 */
function inferInstrumentType(counterId) {
    return counterId.startsWith('ETF/') ? 'ETF' : 'ST';
}

/**
 * 智能重試機制：先試ST，失敗後直接試ETF
 * @param {string} stockCode - 股票代碼
 * @param {string} market - 市場
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {string} context - 上下文描述
 * @returns {Promise<Object>} 成功獲取的數據
 */
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

// ==================== 數據映射工具函數 ====================

/**
 * 從 Lbkrs counter_id 提取股票代碼
 * @param {string} counterId - Lbkrs 股票 ID (例如: "ST/US/NVDA")
 * @returns {string} 股票代碼
 */
function extractStockCode(counterId) {
    return parseCounterId(counterId).stockCode;
}

/**
 * 將 Lbkrs API 數據映射到現有系統格式
 * @param {Object} lbkrsItem - Lbkrs API 響應項目
 * @returns {Object} 映射後的股票數據
 */
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

/**
 * 將 Lbkrs Detail API 數據映射到現有系統格式
 * @param {Object} detailData - Lbkrs Detail API 響應數據
 * @param {string} counterId - Lbkrs Counter ID
 * @returns {Object} 映射後的股票數據
 */
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

// ==================== 主程式 ====================
/**
 * 主函式
 */
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

// ==================== 資料抓取函式 ====================

/**
 * 抓取自選股票資料
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {CacheManager} cache - 快取管理器
 * @returns {Promise<Array>} 自選股票列表
 */
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

/**
 * 抓取成交額排行資料 (Lbkrs API)
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {string} market - 市場代碼 ('US' 或 'HK')
 * @returns {Promise<Array>} 股票列表
 */
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


/**
 * 產業分類現在直接從 Lbkrs API 獲取，不再需要網路請求
 * 保留此函數作為兼容性接口，但現在只是返回 stock.industry
 * @param {Object} stock - 股票資料物件
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {CacheManager} cache - 快取管理器
 * @param {string} market - 市場代碼
 * @returns {Promise<string>} 產業名稱或 '--'
 */
async function fetchSingleIndustry(stock, fetcher, cache, market) {
    // ETF 直接返回 'ETF'
    if (stock.instrumentType === 4) return 'ETF';
    
    // 直接從 Lbkrs 數據獲取產業分類
    return stock.industry || '--';
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
        // 2. 自動識別市場（如果未提供）
        const actualMarket = market || identifyMarket(stock.stockCode);
        
        // 3. 生成 Counter ID
        const instrumentType = stock.instrumentType === 4 ? 'ETF' : 'ST';
        const counterId = buildCounterId(stock.stockCode, instrumentType, actualMarket);
        
        // 4. 使用 Lbkrs Detail API 獲取數據
        const data = await fetcher.fetchLbkrsDetailData(counterId, `kline_${stock.stockCode}`);
        
        if (!data?.data) {
            console.error(`${stock.stockCode}: Lbkrs Detail API 返回無效數據`);
            return null;
        }
        
        // 5. 提取 OHLC 數據
        const detailData = data.data;
        const klineData = {
            open: parseFloat(detailData.open) || null,
            high: parseFloat(detailData.high) || null,
            low: parseFloat(detailData.low) || null,
            close: parseFloat(detailData.last_done) || stock.priceNominal || null
        };
        
        // 6. 驗證數據完整性
        if (!klineData.open || !klineData.high || !klineData.low || !klineData.close) {
            console.error(`${stock.stockCode}: K線數據不完整`, klineData);
            return null;
        }
        
        // 7. 寫入快取
        cache.set('kline', stock.stockCode, klineData);
        return klineData;
        
    } catch (error) {
        console.error(`處理 ${stock.stockCode} K線數據失敗: ${error.message}`);
        return null;
    }
}

/**
 * 並發為所有股票補充資料 (性能優化版)
 * @param {Array} data - 股票資料陣列
 * @param {DataFetcher} fetcher - 資料抓取器
 * @param {CacheManager} cache - 快取管理器
 * @param {string} market - 市場代碼
 * @returns {Promise<Array>} 補充後的股票資料陣列
 */
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

// ==================== Widget 建立函式 ====================

/**
 * 取得當前市場的欄位設定
 * @param {string} market - 市場代碼
 * @param {string} mode - 顯示模式 ('ranking' 或 'watchlist')
 * @returns {Array} 欄位設定陣列
 */
function getActiveColumnSettings(market, mode) {
    // 自選股票模式使用混合市場設定
    if (mode === 'watchlist') {
        return CONFIG.COLUMN_SETTINGS_MIXED;
    }
    
    // 排行榜模式根據市場選擇
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
function createDataRow(widget, stock, maxTurnover, totalBarWidth, columns, colorCalc, market, mode) {
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
        addColumnCell(rowStack, col, stock, rowColor, colorCalc, market, mode);
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
function addColumnCell(rowStack, col, stock, rowColor, colorCalc, market, mode) {
    const colStack = rowStack.addStack();
    colStack.size = new Size(col.width, 0);
    colStack.centerAlignContent();

    // 新增: K 線欄位處理
    if (col.key === 'kline') {
        drawKline(colStack, stock.klineData, CONFIG.KLINE);
        return;
    }

    const value = formatColumnValue(col.key, stock, market, mode);
    addTextCell(colStack, value, col.key, stock, rowColor, colorCalc);
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
        
        case 'callRatio':
            return stock.callRatio !== '--' ? `${stock.callRatio}%` : '--';
        
        default:
            return String(stock[key]);
    }
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