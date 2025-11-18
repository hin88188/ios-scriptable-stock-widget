// Widget.js
// 盤中成交額排行 Widget - 支持美股/港股
// 版本: v2.8.0

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

    // 調試模式
    DEBUG_MODE: false, // 設為 true 保留 _rawData 和 _source

    // Cookie（選填）
    COOKIES: '',

    // 市場 URL / Endpoint 配置（僅作為基底，實際組裝由 LbkrsClient 處理）
    MARKET_URLS: {
        BASE: 'https://m-gl.lbkrs.com',
        RANKING_PATH: '/api/forward/newmarket/revision/rank/pc/list',
        DETAIL_PATH: '/api/forward/v3/quote/stock/detail'
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
        { key: 'currentPrice', header: '價格', width: 50, visible: true },
        { key: 'tradeTurnover', header: '成交額', width: 45, visible: true },
        { key: 'volumeRatio', header: '量比', width: 30, visible: true },
    ],

    // 港股欄位設定
    COLUMN_SETTINGS_HK: [
        { key: 'industry', header: '', width: 70, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockName', header: '名稱', width: 85, visible: true },
        { key: 'kline', header: '', width: 8, visible: true },
        { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
        { key: 'currentPrice', header: '價格', width: 50, visible: true },
        { key: 'tradeTurnover', header: '成交額', width: 45, visible: true },
        { key: 'volumeRatio', header: '量比', width: 30, visible: true },
    ],

    // 混合市場自選股票欄位設定
    COLUMN_SETTINGS_MIXED: [
        { key: 'industry', header: '', width: 70, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockDisplay', header: '名稱/代號', width: 85, visible: true },
        { key: 'kline', header: '', width: 8, visible: true },
        { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
        { key: 'currentPrice', header: '價格', width: 50, visible: true },
        { key: 'tradeTurnover', header: '成交額', width: 45, visible: true },
        { key: 'volumeRatio', header: '量比', width: 30, visible: true },
    ],

    // 色彩系統
    COLORS: {
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
        background: Color.dynamic(Color.white(), new Color('#1C1C1E')),
        text: Color.dynamic(Color.black(), Color.white()),
        headerBackground: Color.dynamic(new Color('#F0F0F0'), new Color('#333333')),
    },

    // 量比色彩系統(冷→熱漸變)
    VOLUME_RATIO_COLORS: {
        coldest: '#4B6B8A',    // < 0.5:深藍灰
        cold: '#3FA7D6',       // 0.5-1.5:中藍色
        warm: '#6DD57E',       // 1.5-2.5:淡綠色
        hot: '#FFD54F',        // 2.5-5.0:黃橙色
        hottest: '#FF5252',    // > 5.0:鮮紅色
    },

    // 量比色彩計算閾值
    VOLUME_RATIO_THRESHOLDS: {
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
        
        // 新增：成交額線條配置
        TURNOVER_BAR: {
            MIN_WIDTH: 1,          // 最小線條寬度
            BACKGROUND_OPACITY: 0.1, // 背景透明度
            BAR_OPACITY: 1.0,      // 線條不透明度
            MINIMAL_BAR_OPACITY: 0.3 // 最小線條透明度
        }
    }
};

// ==================== 工具類：Counter ID 管理 ====================
/**
 * Counter ID 統一管理工具類
 * 負責 Counter ID 的生成、解析、市場識別、類型推斷
 */
class CounterIdHelper {
    /**
     * 識別股票代碼所屬市場
     * @param {string} stockCode - 股票代碼
     * @returns {'US'|'HK'} 市場代碼
     */
    static identifyMarket(stockCode) {
        if (/^\d+$/.test(stockCode)) {
            return 'HK'; // 純數字 = 港股
        }
        return 'US'; // 包含字母 = 美股
    }

    /**
     * 格式化股票代碼
     * @param {string} stockCode - 原始代碼
     * @param {string} market - 市場代碼
     * @returns {string} 格式化後的代碼
     */
    static formatStockCode(stockCode, market) {
        if (market === 'HK') {
            // 港股：去除前導零
            return String(parseInt(stockCode, 10));
        }
        // 美股：保持原樣
        return stockCode;
    }

    /**
     * 建立 Counter ID
     * @param {string} stockCode - 股票代碼
     * @param {string} market - 市場代碼
     * @param {string} type - 儀器類型 ('auto', 'ST', 'ETF')
     * @returns {string} Counter ID
     */
    static build(stockCode, market, type = 'ST') {
        const formattedCode = this.formatStockCode(stockCode, market);
        return `${type}/${market}/${formattedCode}`;
    }

    /**
     * 解析 Counter ID
     * @param {string} counterId - Counter ID
     * @returns {Object} { stockCode, instrumentType, market }
     */
    static parse(counterId) {
        const parts = counterId.split('/');
        if (parts.length !== 3) {
            throw new Error(`無效的 Counter ID 格式: ${counterId}`);
        }
        return {
            instrumentType: parts[0], // 'ST' or 'ETF'
            market: parts[1],          // 'US' or 'HK'
            stockCode: parts[2]        // 代碼
        };
    }

    /**
     * 推斷儀器類型
     * @param {string} counterId - Counter ID
     * @returns {'ST'|'ETF'} 儀器類型
     */
    static identifyType(counterId) {
        return counterId.startsWith('ETF/') ? 'ETF' : 'ST';
    }
}

// ==================== 工具類：數據映射器 ====================
/**
 * 統一數據映射工具類
 * 負責將 Lbkrs API 數據轉換為標準格式
 */
class StockDataMapper {
    /**
     * 從排行榜 API 映射數據
     * @param {Object} lbkrsItem - Lbkrs 排行榜項目
     * @returns {Object} 標準化股票數據
     */
    static fromRankingAPI(lbkrsItem) {
        const indicators = lbkrsItem.indicators;
        
        if (!indicators || indicators.length < 18) {
            throw new Error(`Lbkrs 數據不完整: 缺少必要的指標數組`);
        }

        // 提取基礎數據
        const currentPrice = parseFloat(indicators[0]) || 0;
        const changePct = parseFloat(indicators[1]) || 0;
        const tradeTurnover = indicators[4] || '0';
        const volumeRatio = parseFloat(indicators[7]) || 0;
        const rawIndustry = indicators[17];

        // 計算漲跌幅百分比
        const changePercent = changePct * 100;
        const changeRatio = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;

        // 處理產業分類
        const instrumentType = CounterIdHelper.identifyType(lbkrsItem.counter_id);
        const industry = this.#extractIndustry(rawIndustry, instrumentType, lbkrsItem.name);

        return {
            stockCode: CounterIdHelper.parse(lbkrsItem.counter_id).stockCode,
            stockName: lbkrsItem.name || '--',
            currentPrice,
            changeRatio,
            changePercent,
            tradeTurnover,
            volumeRatio,
            instrumentType: instrumentType === 'ETF' ? 4 : 3,
            industry,
            klineData: null, // 排行榜不含 K線數據
            ...(CONFIG.DEBUG_MODE && { _rawData: lbkrsItem, _source: 'ranking' })
        };
    }

    /**
     * 從詳細 API 映射數據
     * @param {Object} detailData - Lbkrs Detail API 數據
     * @param {string} counterId - Counter ID
     * @returns {Object} 標準化股票數據
     */
    static fromDetailAPI(detailData, counterId) {
        if (!detailData) {
            throw new Error('Lbkrs Detail API 響應數據為空');
        }

        const parsed = CounterIdHelper.parse(counterId);
        const currentPrice = parseFloat(detailData.last_done) || 0;
        
        // 計算漲跌幅
        const changePercent = this.#calculateChangePercent(detailData, currentPrice);
        const changeRatio = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;

        // 提取成交額（嘗試多個字段）
        const tradeTurnover = detailData.balance || 
                             detailData.total_balance || 
                             detailData.amount || 
                             '0';

        const volumeRatio = parseFloat(detailData.volume_rate) || 0;

        // 處理產業分類
        const instrumentType = parsed.instrumentType;
        const industry = this.#extractIndustry(
            detailData.industry_name, 
            instrumentType, 
            detailData.stock_name
        );

        // 建立 K線數據
        const klineData = this.#buildKlineData(detailData, currentPrice);

        return {
            stockCode: parsed.stockCode,
            stockName: detailData.stock_name || '--',
            currentPrice,
            changeRatio,
            changePercent,
            tradeTurnover,
            volumeRatio,
            instrumentType: instrumentType === 'ETF' ? 4 : 3,
            industry,
            klineData,
            ...(CONFIG.DEBUG_MODE && { _rawData: detailData, _source: 'watchlist' })
        };
    }

    /**
     * 計算漲跌幅百分比（私有方法）
     */
    static #calculateChangePercent(detailData, currentPrice) {
        const prevClose = parseFloat(detailData.prev_close);
        if (prevClose && prevClose > 0) {
            return ((currentPrice - prevClose) / prevClose) * 100;
        }
        return (parseFloat(detailData.chg) || 0) * 100;
    }

    /**
     * 提取產業分類（私有方法）
     */
    static #extractIndustry(rawIndustry, instrumentType, stockName) {
        if (instrumentType === 'ETF') {
            return stockName || 'ETF';
        }
        return (rawIndustry && rawIndustry.trim()) ? rawIndustry.trim() : '--';
    }

    /**
     * 建立 K線數據（私有方法）
     */
    static #buildKlineData(detailData, currentPrice) {
        const open = parseFloat(detailData.open) || null;
        const high = parseFloat(detailData.high) || null;
        const low = parseFloat(detailData.low) || null;
        
        // 驗證數據完整性
        if (!open || !high || !low || !currentPrice) {
            return null;
        }

        return {
            open,
            high,
            low,
            close: currentPrice
        };
    }
}

// ==================== 工具類：K線數據處理器 ====================
/**
 * K線數據處理工具類
 * 負責 K線數據的提取、驗證、重建、獲取
 */
class KlineDataProcessor {
    /**
     * 驗證 K線數據完整性
     * @param {Object} klineData - K線數據
     * @returns {boolean} 是否有效
     */
    static validate(klineData) {
        if (!klineData) return false;
        const { open, high, low, close } = klineData;
        return !!(open && high && low && close);
    }

    /**
     * 從詳細數據重建 K線
     * @param {Object} rawData - 原始 Detail API 數據
     * @param {number} fallbackPrice - 備用價格
     * @returns {Object|null} K線數據或 null
     */
    static rebuild(rawData, fallbackPrice) {
        if (!rawData) return null;

        const klineData = {
            open: parseFloat(rawData.open) || null,
            high: parseFloat(rawData.high) || null,
            low: parseFloat(rawData.low) || null,
            close: parseFloat(rawData.last_done) || fallbackPrice || null
        };

        return this.validate(klineData) ? klineData : null;
    }

    /**
     * 獲取股票的 K線數據
     * @param {Object} stock - 股票數據
     * @param {LbkrsClient} fetcher - 數據抓取器（相容舊介面，需提供 fetchLbkrsDetailData）
     * @param {Object} caches - 快取管理器集合
     * @returns {Promise<Object|null>} K線數據或 null
     */
    static async fetch(stock, fetcher, caches) {
        // 1. 如果已有有效 K線，直接返回
        if (this.validate(stock.klineData)) {
            return stock.klineData;
        }

        // 2. 自選股票：從原始數據重建
        if (CONFIG.DEBUG_MODE && stock._source === 'watchlist' && stock._rawData) {
            const rebuilt = this.rebuild(stock._rawData, stock.currentPrice);
            if (rebuilt) {
                console.log(`[K線重建] ${stock.stockCode}: 成功`);
                return rebuilt;
            }
        }

        // 3. 檢查 K線快取
        const cached = caches.kline.get(stock.stockCode);
        if (cached) return cached;

        // 4. 從 API 獲取
        try {
            const market = CounterIdHelper.identifyMarket(stock.stockCode);
            const instrumentType = stock.instrumentType === 4 ? 'ETF' : 'ST';
            const counterId = CounterIdHelper.build(stock.stockCode, market, instrumentType);
            
            const data = await fetcher.fetchLbkrsDetailData(counterId, `kline_${stock.stockCode}`);
            
            if (data?.data) {
                const klineData = this.rebuild(data.data, stock.currentPrice);
                if (klineData) {
                    caches.kline.set(stock.stockCode, klineData);
                    return klineData;
                }
            }
        } catch (error) {
            console.error(`[K線] ${stock.stockCode} 獲取失敗: ${error.message}`);
        }

        return null;
    }
}

// ==================== 快取類：排行榜快取 ====================
class RankingCache {
    constructor(config) {
        this.config = config;
        this.fm = FileManager.local();
        this.paths = {
            US: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_ranking_US.json'),
            HK: this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_ranking_HK.json')
        };
        this.duration = config.CACHE_DURATION;
    }

    get(market) {
        const path = this.paths[market];
        if (!this.fm.fileExists(path)) return null;

        try {
            const cache = JSON.parse(this.fm.readString(path));
            const age = (new Date() - new Date(cache.timestamp)) / 60000;
            
            if (age > this.duration) return null;
            return cache;
        } catch (e) {
            console.error(`排行榜快取讀取失敗: ${e.message}`);
            return null;
        }
    }

    set(market, data) {
        try {
            const path = this.paths[market];
            this.fm.writeString(path, JSON.stringify(data));
        } catch (e) {
            console.error(`排行榜快取寫入失敗: ${e.message}`);
        }
    }
}

// ==================== 快取類：自選股票快取 ====================
class WatchlistCache {
    constructor(config) {
        this.config = config;
        this.fm = FileManager.local();
        this.path = this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_watchlist.json');
        this.duration = config.CACHE_DURATION;
    }

    get(stockCode) {
        if (!this.fm.fileExists(this.path)) return null;

        try {
            const cache = JSON.parse(this.fm.readString(this.path));
            const item = cache[stockCode];
            
            if (!item) return null;
            
            const age = (new Date() - new Date(item.timestamp)) / 60000;
            if (age > this.duration) return null;
            
            return item.value;
        } catch (e) {
            console.error(`自選快取讀取失敗: ${e.message}`);
            return null;
        }
    }

    set(stockCode, data) {
        try {
            let cache = {};
            if (this.fm.fileExists(this.path)) {
                cache = JSON.parse(this.fm.readString(this.path));
            }
            
            cache[stockCode] = {
                value: data,
                timestamp: new Date()
            };
            
            this.fm.writeString(this.path, JSON.stringify(cache, null, 2));
        } catch (e) {
            console.error(`自選快取寫入失敗: ${e.message}`);
        }
    }

    clear() {
        try {
            if (this.fm.fileExists(this.path)) {
                this.fm.remove(this.path);
            }
        } catch (e) {
            console.error(`清除自選快取失敗: ${e.message}`);
        }
    }
}

// ==================== 快取類：K線快取 ====================
class KlineCache {
    constructor(config) {
        this.config = config;
        this.fm = FileManager.local();
        this.path = this.fm.joinPath(this.fm.documentsDirectory(), 'lbkrs_kline.json');
        this.duration = config.KLINE_CACHE_DURATION;
    }

    get(stockCode) {
        if (!this.fm.fileExists(this.path)) return null;

        try {
            const cache = JSON.parse(this.fm.readString(this.path));
            const item = cache[stockCode];
            
            if (!item) return null;
            
            const age = (new Date() - new Date(item.timestamp)) / 60000;
            if (age > this.duration) return null;
            
            return item.value;
        } catch (e) {
            console.error(`K線快取讀取失敗: ${e.message}`);
            return null;
        }
    }

    set(stockCode, klineData) {
        try {
            let cache = {};
            if (this.fm.fileExists(this.path)) {
                cache = JSON.parse(this.fm.readString(this.path));
            }
            
            cache[stockCode] = {
                value: klineData,
                timestamp: new Date()
            };
            
            this.fm.writeString(this.path, JSON.stringify(cache, null, 2));
        } catch (e) {
            console.error(`K線快取寫入失敗: ${e.message}`);
        }
    }

    clear() {
        try {
            if (this.fm.fileExists(this.path)) {
                this.fm.remove(this.path);
            }
        } catch (e) {
            console.error(`清除K線快取失敗: ${e.message}`);
        }
    }
}

// ==================== 核心類別：請求佇列管理 ====================
class RequestQueue {
    constructor(getConcurrencyFn) {
        this.maxConcurrent = 10;
        this.getConcurrencyFn = getConcurrencyFn || (() => 10);
        this.running = 0;
        this.queue = [];
    }

    getConcurrency() {
        if (typeof this.getConcurrencyFn === 'function') {
            return Math.min(this.getConcurrencyFn(), 30);
        }
        return Math.min(this.maxConcurrent, 30);
    }

    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.process();
        });
    }

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

// ==================== 核心類別：資料抓取器 ====================
class DataFetcher {
    constructor(config) {
        this.config = config;
        this.queue = new RequestQueue((stockCount) => {
            return Math.min((stockCount || 0) + 5, 30);
        });
    }

    buildHeaders() {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            'Referer': 'https://www.google.com/'
        };
        if (this.config.COOKIES) {
            headers['Cookie'] = this.config.COOKIES;
        }
        return headers;
    }

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
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        });
    }

    async delay(ms) {
        if (ms <= 0) return;
        const start = Date.now();
        while (Date.now() - start < ms) {
            // 空循環等待
        }
    }

    async fetchJson(url, context) {
        try {
            const html = await this.fetchWithRetry(url);
            const data = JSON.parse(html);
            if (data.code !== 0) {
                throw new Error(`Lbkrs API 錯誤: ${data.message || '未知錯誤'}`);
            }
            return data;
        } catch (e) {
            saveDebugFile(`debug_${context}_error.txt`, `URL: ${url}\nError: ${e.message}`);
            throw new Error(`${context} API 請求失敗: ${e.message}`);
        }
    }
}

/**
 * Lbkrs Endpoint Registry + Client
 * 負責集中管理 URL/Query 組裝與原始 JSON 取得
 */
class LbkrsClient {
    constructor(config) {
        this.config = config;
        this.fetcher = new DataFetcher(config);
        this.base = config.MARKET_URLS.BASE;
        this.paths = {
            ranking: config.MARKET_URLS.RANKING_PATH,
            detail: config.MARKET_URLS.DETAIL_PATH
        };
        this.defaultRankingQuery = {
            key: 'all',
            indicators: [
                'last_done',
                'chg',
                'change',
                'total_amount',
                'total_balance',
                'turnover_rate',
                'amplitude',
                'volume_rate',
                'depth_rate',
                'pb_ttm',
                'market_cap',
                'five_min_chg',
                'five_day_chg',
                'ten_day_chg',
                'twenty_day_chg',
                'this_year_chg',
                'half_year_chg',
                'industry'
            ],
            sort_indicator: 'total_balance',
            order: 'desc',
            offset: 0,
            limit: 40
        };
    }

    buildUrl(path, query, extraIndicators = []) {
        const parts = [];

        if (query) {
            Object.keys(query).forEach(key => {
                const value = query[key];
                if (value === undefined || value === null) return;

                if (key === 'indicators' && Array.isArray(value)) {
                    value.concat(extraIndicators).forEach(ind => {
                        parts.push(`indicators[]=${encodeURIComponent(ind)}`);
                    });
                } else {
                    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
                }
            });
        }

        const qs = parts.length ? `?${parts.join('&')}` : '';
        return `${this.base}${path}${qs}`;
    }

    /**
     * 取得成交額排行榜原始 list
     * @param {'US'|'HK'} market
     * @returns {Promise<Array>}
     */
    async getRankingList(market) {
        const query = {
            ...this.defaultRankingQuery,
            market
        };

        const url = this.buildUrl(this.paths.ranking, query);
        const data = await this.fetcher.fetchJson(url, `ranking_${market}`);

        if (!data?.data?.list || !Array.isArray(data.data.list)) {
            throw new Error(`${market} 排行榜數據格式錯誤`);
        }

        return data.data.list;
    }

    /**
     * 依 counterId 取得 Detail 原始資料
     * @param {string} counterId
     * @param {string} context
     */
    async getDetailByCounterId(counterId, context) {
        const query = { counter_id: counterId };
        const url = this.buildUrl(this.paths.detail, query);
        const data = await this.fetcher.fetchJson(url, context || `detail_${counterId}`);

        if (!data?.data) {
            throw new Error(`Detail API 數據格式錯誤 (${counterId})`);
        }

        return data.data;
    }

    /**
     * 供舊邏輯使用的兼容方法：模擬舊 fetchLbkrsDetailData 簽名
     */
    async fetchLbkrsDetailData(counterId, context) {
        const detailData = await this.getDetailByCounterId(counterId, context);
        return { code: 0, data: detailData };
    }
}

// ==================== 核心類別：色彩計算器 ====================
class ColorCalculator {
    constructor(config) {
        this.config = config;
        this.cache = new Map();
    }

    getChangeRatioColor(ratio) {
        const key = `change_${ratio.toFixed(2)}`;
        if (this.cache.has(key)) return this.cache.get(key);
        
        const color = this.calculateChangeRatioColor(ratio);
        this.cache.set(key, color);
        return color;
    }

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

    getVolumeRatioColor(ratio) {
        const key = `volume_${ratio.toFixed(2)}`;
        if (this.cache.has(key)) return this.cache.get(key);
        
        const color = this.calculateVolumeRatioColor(ratio);
        this.cache.set(key, color);
        return color;
    }

    calculateVolumeRatioColor(ratio) {
        const t = this.config.VOLUME_RATIO_THRESHOLDS;
        const c = this.config.VOLUME_RATIO_COLORS;
        const capped = Math.min(ratio, t.MAX_CAP);
        
        if (capped < t.COLDEST) return new Color(c.coldest);
        if (capped < t.COLD) return this.interpolate(c.coldest, c.cold, (capped - 0) / (t.COLD - 0));
        if (capped < t.WARM) return this.interpolate(c.cold, c.warm, (capped - t.COLD) / (t.WARM - t.COLD));
        if (capped < t.HOT) return this.interpolate(c.warm, c.hot, (capped - t.WARM) / (t.HOT - t.WARM));
        return this.interpolate(c.hot, c.hottest, (capped - t.HOT) / (t.MAX_CAP - t.HOT));
    }

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

// ==================== 市場決策引擎 ====================
/**
 * 自動判斷應顯示哪個市場
 */
function resolveMarketAuto() {
    const now = new Date();

    const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const nyDay = ny.getDay();
    const nyHour = ny.getHours();
    const nyMin = ny.getMinutes();
    const nyTime = nyHour * 60 + nyMin;

    const hk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
    const hkDay = hk.getDay();
    const hkHour = hk.getHours();
    const hkMin = hk.getMinutes();
    const hkTime = hkHour * 60 + hkMin;

    const hkOpen = hkDay >= 1 && hkDay <= 5 && hkTime >= 9 * 60 + 30 && hkTime <= 16 * 60;
    const usOpen = nyDay >= 1 && nyDay <= 5 && nyTime >= 9 * 60 + 30 && nyTime <= 16 * 60;

    if (usOpen) return 'US';
    if (hkOpen) return 'HK';

    if (hkDay === 0 || hkDay === 6) return 'US';

    // 維持收市後~另一股開市前 1 小時為同一市場
    if (hkDay >= 1 && hkDay <= 5) {
        if (hkTime > 16 * 60 && nyTime < 8 * 60 + 30) return 'HK';  // 港股收市後
        if (nyTime > 4 * 60 && hkTime < 8 * 60 + 30) return 'US';   // 美股開市前
    }

    return 'US';
}

/**
 * 智能雙模式決策
 */
function resolveDisplayMode() {
    const watchlist = CONFIG.CUSTOM_WATCHLIST;
    
    if (watchlist && watchlist.length > 0) {
        console.log(`[模式] 自選模式 (${watchlist.length} 支股票)`);
        return { mode: 'watchlist', market: 'AUTO' };
    }
    
    console.log(`[模式] 排行榜模式`);
    const market = CONFIG.MARKET === 'AUTO' ? resolveMarketAuto() : CONFIG.MARKET;
    return { mode: 'ranking', market };
}

// ==================== 資料抓取函式 ====================
/**
 * 抓取排行榜數據（改用 LbkrsClient）
 */
async function fetchRanking(client, market) {
    const rawList = await client.getRankingList(market);
    return rawList.map(item => StockDataMapper.fromRankingAPI(item));
}

/**
 * 抓取自選股票數據（優化版）
 */
async function fetchWatchlist(client, caches) {
    const watchlist = CONFIG.CUSTOM_WATCHLIST;
    console.log(`[自選] 開始獲取 ${watchlist.length} 支股票`);
    
    const concurrency = Math.min(watchlist.length + 5, 30);
    const results = [];
    const errors = [];
    
    const batchSize = Math.min(concurrency, 10);
    for (let i = 0; i < watchlist.length; i += batchSize) {
        const batch = watchlist.slice(i, i + batchSize);
        const batchPromises = batch.map(async (stockCode) => {
            try {
                // 檢查快取
                const cached = caches.watchlist.get(stockCode);
                if (cached) {
                    console.log(`[自選] 快取命中: ${stockCode}`);
                    return cached;
                }
                
                // 識別市場
                const market = CounterIdHelper.identifyMarket(stockCode);
                
                // 多輪嘗試獲取數據
                const result = await tryFetchStock(stockCode, market, client);
                
                // 映射為標準格式
                const mappedData = StockDataMapper.fromDetailAPI(result.data, result.counterId);
                
                // 寫入快取
                caches.watchlist.set(stockCode, mappedData);
                
                console.log(`[自選] 成功: ${stockCode}`);
                return mappedData;
                
            } catch (error) {
                console.error(`[自選] 失敗: ${stockCode} - ${error.message}`);
                errors.push({ stockCode, error: error.message });
                return null;
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(r => r !== null));
        
        if (i + batchSize < watchlist.length) {
            await fetcher.delay(100);
        }
    }
    
    console.log(`[自選] 完成: ${results.length} 成功, ${errors.length} 失敗`);
    return results;
}

/**
 * 多輪嘗試獲取股票數據
 */
async function tryFetchStock(stockCode, market, client) {
    const attempts = [
        { type: 'ST', label: '股票' },
        { type: 'ETF', label: 'ETF' }
    ];
    
    if (market === 'US') {
        attempts.push({ type: 'ST', label: '股票(備用)', format: true });
    }
    
    let lastError = null;
    
    for (let i = 0; i < attempts.length; i++) {
        const { type, label } = attempts[i];
        try {
            const counterId = CounterIdHelper.build(stockCode, market, type);
            console.log(`[重試] ${i + 1}/${attempts.length} (${label}): ${counterId}`);
            
            const detail = await client.getDetailByCounterId(counterId, `stock_${stockCode}`);
            
            if (detail) {
                console.log(`[重試] 成功: ${counterId}`);
                return { data: detail, counterId };
            }
        } catch (error) {
            console.log(`[重試] 失敗 ${i + 1}/${attempts.length}: ${error.message}`);
            lastError = error;
        }
    }
    
    throw new Error(`所有嘗試失敗: ${lastError?.message || '未知錯誤'}`);
}

/**
 * 過濾數據
 */
function filterData(stockList) {
    return stockList
        .filter(stock =>
            (CONFIG.SHOW_STOCK && stock.instrumentType === 3) ||
            (CONFIG.SHOW_ETF && stock.instrumentType === 4)
        )
        .slice(0, CONFIG.MAX_ITEMS)
        .map((stock, index) => ({
            ...stock,
            rank: index + 1
        }));
}

/**
 * 補充 K線數據
 */
async function enrichData(data, client, caches, market, mode) {
    const visibleColumns = getColumns(market, mode).filter(c => c.visible);
    const needsKline = visibleColumns.some(col => col.key === 'kline');
    
    if (!needsKline) {
        console.log(`[優化] 不需要 K線數據`);
        return data;
    }
    
    console.log(`[K線] 開始獲取 ${data.length} 支股票的 K線數據`);
    
    return Promise.all(data.map(async (stock) => ({
        ...stock,
        klineData: await KlineDataProcessor.fetch(stock, client, caches)
    })));
}

// ==================== Widget 建構引擎 ====================
/**
 * 獲取當前欄位設定
 */
function getColumns(market, mode) {
    if (mode === 'watchlist') {
        return CONFIG.COLUMN_SETTINGS_MIXED;
    }
    return market === 'HK' ? CONFIG.COLUMN_SETTINGS_HK : CONFIG.COLUMN_SETTINGS_US;
}

/**
 * 建立完整 Widget
 */
async function createWidget(stockData, updateTime, maxTurnover, colorCalc, market, mode) {
    const widget = new ListWidget();
    widget.backgroundColor = CONFIG.COLORS.background;
    widget.spacing = 0;
    widget.setPadding(0, 0, 0, 0);

    const visibleColumns = getColumns(market, mode).filter(c => c.visible);

    createHeaderRow(widget, updateTime, visibleColumns);

    const totalBarWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0);

    for (const stock of stockData) {
        createDataRow(widget, stock, maxTurnover, totalBarWidth, visibleColumns, colorCalc, mode);
    }

    return widget;
}

/**
 * 建立標題列
 */
function createHeaderRow(widget, updateTime, columns) {
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
 * 建立數據列
 */
function createDataRow(widget, stock, maxTurnover, totalBarWidth, columns, colorCalc, mode) {
    const rowContainer = widget.addStack();
    rowContainer.layoutVertically();
    const p = CONFIG.UI.ROW_PADDING;
    rowContainer.setPadding(p.top, p.left, p.bottom, p.right);

    const rowStack = rowContainer.addStack();
    rowStack.layoutHorizontally();
    rowStack.centerAlignContent();

    const rowColor = colorCalc.getChangeRatioColor(stock.changePercent);

    columns.forEach(col => {
        addColumnCell(rowStack, col, stock, rowColor, colorCalc, mode);
    });

    addProgressBar(rowContainer, stock, maxTurnover, totalBarWidth, rowColor);
}

/**
 * 新增欄位儲存格
 */
function addColumnCell(rowStack, col, stock, rowColor, colorCalc, mode) {
    const colStack = rowStack.addStack();
    colStack.size = new Size(col.width, 0);
    colStack.centerAlignContent();

    if (col.key === 'kline') {
        drawKline(colStack, stock.klineData, CONFIG.KLINE);
        return;
    }

    const value = formatValue(col.key, stock, mode);
    addTextCell(colStack, value, col.key, stock, rowColor, colorCalc);
}

/**
 * 格式化欄位值
 */
function formatValue(key, stock, mode) {
    switch (key) {
        case 'stockCode':
            return CounterIdHelper.formatStockCode(stock.stockCode, 
                CounterIdHelper.identifyMarket(stock.stockCode));
        
        case 'stockName':
            return stock.stockName || '--';
        
        case 'stockDisplay':
            if (mode === 'watchlist') {
                const isHK = /^\d+$/.test(stock.stockCode);
                return isHK ? (stock.stockName || stock.stockCode) : stock.stockCode;
            }
            return stock.stockCode;
        
        case 'currentPrice':
            return stock.currentPrice.toFixed(2);
        
        case 'tradeTurnover':
            return formatTurnover(stock.tradeTurnover);
        
        case 'volumeRatio':
            return stock.volumeRatio.toFixed(2);
        
        default:
            return String(stock[key] || '--');
    }
}

/**
 * 新增文字儲存格
 */
function addTextCell(colStack, value, key, stock, rowColor, colorCalc) {
    const colText = colStack.addText(String(value));
    colText.font = Font.mediumSystemFont(CONFIG.FONT_SIZE);
    colText.textColor = key === 'volumeRatio'
        ? colorCalc.getVolumeRatioColor(stock.volumeRatio)
        : rowColor;
    colText.lineLimit = 1;
}

/**
 * 新增成交額比例線 (改進版)
 * @param {WidgetStack} rowContainer - 行容器
 * @param {Object} stock - 股票數據
 * @param {number} maxTurnover - 最高成交額
 * @param {number} totalBarWidth - 總欄位寬度
 * @param {Color} rowColor - 行顏色
 */
function addProgressBar(rowContainer, stock, maxTurnover, totalBarWidth, rowColor) {
    // 計算成交額比例
    const currentTurnover = parseTurnoverToNumber(stock.tradeTurnover);
    
    // 處理無效數據
    if (maxTurnover <= 0 || currentTurnover <= 0) {
        addMinimalBar(rowContainer, totalBarWidth);
        return;
    }
    
    // 計算比例 (0-1之間)
    const ratio = Math.min(currentTurnover / maxTurnover, 1);
    
    // 計算線條寬度 (使用新配置)
    const barWidth = Math.max(totalBarWidth * ratio, CONFIG.UI.TURNOVER_BAR.MIN_WIDTH);
    
    // 建立線條容器
    const barContainer = rowContainer.addStack();
    barContainer.size = new Size(totalBarWidth, CONFIG.UI.PROGRESS_BAR_HEIGHT);
    barContainer.backgroundColor = new Color("#888888", CONFIG.UI.TURNOVER_BAR.BACKGROUND_OPACITY);

    if (barWidth >= CONFIG.UI.TURNOVER_BAR.MIN_WIDTH) {
        // 繪製成交額線條
        const progressBar = barContainer.addStack();
        progressBar.size = new Size(barWidth, CONFIG.UI.PROGRESS_BAR_HEIGHT);
        progressBar.backgroundColor = rowColor;
        progressBar.cornerRadius = 0;
        
        // 添加右側間距
        barContainer.addSpacer();
    }
}

/**
 * 繪製最小線條 (用於無成交額數據)
 * @param {WidgetStack} rowContainer - 行容器
 * @param {number} totalBarWidth - 總欄位寬度
 */
function addMinimalBar(rowContainer, totalBarWidth) {
    const barContainer = rowContainer.addStack();
    barContainer.size = new Size(totalBarWidth, CONFIG.UI.PROGRESS_BAR_HEIGHT);
    barContainer.backgroundColor = new Color("#888888", CONFIG.UI.TURNOVER_BAR.BACKGROUND_OPACITY);
    
    const minimalBar = barContainer.addStack();
    minimalBar.size = new Size(2, CONFIG.UI.PROGRESS_BAR_HEIGHT);
    minimalBar.backgroundColor = new Color("#CCCCCC", CONFIG.UI.TURNOVER_BAR.MINIMAL_BAR_OPACITY);
    barContainer.addSpacer();
}

/**
 * 繪製 K 線圖
 */
function drawKline(colStack, klineData, config) {
    if (!klineData) {
        colStack.addSpacer();
        return;
    }
    
    const { open, high, low, close } = klineData;
    const { WIDTH, HEIGHT, SHADOW_WIDTH, GAIN_COLOR, LOSS_COLOR, NEUTRAL_COLOR } = config;
    
    // 決定顏色
    let colorHex;
    if (close > open) {
        colorHex = GAIN_COLOR;
    } else if (close < open) {
        colorHex = LOSS_COLOR;
    } else {
        colorHex = NEUTRAL_COLOR;
    }
    const color = new Color(colorHex);

    // 使用 DrawContext 繪製
    const ctx = new DrawContext();
    ctx.size = new Size(WIDTH, HEIGHT);
    ctx.opaque = false;
    ctx.respectScreenScale = true;

    // 座標計算 (Y軸向下，0為頂部)
    // 防止除以零
    const range = Math.max(high - low, 0.01);
    // 將價格映射到高度 (high -> 0, low -> HEIGHT)
    const getY = (price) => HEIGHT - ((price - low) / range) * HEIGHT;

    const yHigh = getY(high);
    const yLow = getY(low);
    const yOpen = getY(open);
    const yClose = getY(close);

    // 1. 繪製影線 (Line)
    const xCenter = WIDTH / 2;
    const path = new Path();
    path.move(new Point(xCenter, yHigh));
    path.addLine(new Point(xCenter, yLow));
    ctx.addPath(path);
    ctx.setStrokeColor(color);
    ctx.setLineWidth(SHADOW_WIDTH);
    ctx.strokePath();

    // 2. 繪製實體 (Rect)
    const bodyTop = Math.min(yOpen, yClose);
    // 確保實體至少有 1px 高度以便可見
    const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1);
    const bodyRect = new Rect(0, bodyTop, WIDTH, bodyHeight);
    
    ctx.setFillColor(color);
    ctx.fillRect(bodyRect);

    // 輸出圖片
    const img = ctx.getImage();
    const imgWidget = colStack.addImage(img);
    imgWidget.imageSize = new Size(WIDTH, HEIGHT);
    imgWidget.centerAlignImage();
}

/**
 * 建立錯誤 Widget
 */
function createErrorWidget(errorMessage) {
    const widget = new ListWidget();
    widget.backgroundColor = new Color('#5A0000');
    widget.setPadding(12, 12, 12, 12);
    
    const title = widget.addText('⚠ Widget 錯誤');
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

// ==================== 主程式 ====================
async function main() {
    const startTime = new Date();
    console.log(`=== 程式開始: ${startTime.toLocaleString()} ===`);
    
    try {
        // 1. 模式決策
        const { mode, market } = resolveDisplayMode();
        
        // 2. 初始化組件
        const client = new LbkrsClient(CONFIG);
        const colorCalc = new ColorCalculator(CONFIG);
        const caches = {
            ranking: new RankingCache(CONFIG),
            watchlist: new WatchlistCache(CONFIG),
            kline: new KlineCache(CONFIG)
        };

        let stockData = [];
        let timestamp = new Date();
        let displayMarket = market;

        // 3. 獲取數據
        if (mode === 'watchlist') {
            stockData = await fetchWatchlist(client, caches);
            if (!stockData || stockData.length === 0) {
                throw new Error('自選股票數據為空');
            }
        } else {
            const resolvedMarket = market === 'AUTO' ? resolveMarketAuto() : market;
            displayMarket = resolvedMarket;
            
            let cachedData = caches.ranking.get(resolvedMarket);
            if (!cachedData?.data?.length) {
                const rawData = await fetchRanking(client, resolvedMarket);
                if (!rawData || rawData.length === 0) {
                    throw new Error('排行榜數據為空');
                }
                cachedData = { data: rawData, timestamp: new Date() };
                caches.ranking.set(resolvedMarket, cachedData);
            }
            stockData = cachedData.data;
            timestamp = new Date(cachedData.timestamp);
        }

        // 4. 過濾數據
        const filteredData = filterData(stockData);
        if (filteredData.length === 0) {
            throw new Error('過濾後無數據可顯示');
        }

        // 5. 補充 K線數據
        const enrichedData = await enrichData(filteredData, client, caches, displayMarket, mode);

        // 6. 計算表格中所有股票的最高成交額
        const maxTurnover = enrichedData.length > 0
            ? Math.max(...enrichedData.map(stock => parseTurnoverToNumber(stock.tradeTurnover)))
            : 0;

        // 7. 建立 Widget
        const widget = await createWidget(
            enrichedData,
            timestamp,
            maxTurnover,
            colorCalc,
            displayMarket,
            mode
        );

        // 8. 顯示
        if (typeof config !== 'undefined' && config.runsInWidget) {
            Script.setWidget(widget);
        } else {
            widget.presentLarge();
        }
        
        // 9. 統計信息
        const endTime = new Date();
        const totalTime = endTime - startTime;
        console.log(`=== 執行完成 ===`);
        console.log(`模式: ${mode}, 市場: ${displayMarket}`);
        console.log(`股票數: ${enrichedData.length}, 總耗時: ${totalTime}ms`);
        
    } catch (error) {
        console.error(`[錯誤] ${error.message}`);
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

// 執行主程式
await main();