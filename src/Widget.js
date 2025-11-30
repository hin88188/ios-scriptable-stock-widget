// Widget.js
// 盤中成交額排行 Widget - 支持美股/港股
// 版本: v3.0.0

// ==================== 1. 配置與常數 (Config) ====================
const CONFIG = {
    // 市場選擇
    MARKET: 'AUTO', // 'AUTO' 智慧切換 / 'US' 美股 / 'HK' 港股

    // 自選股票配置 (開啟下方註解即可使用)
    // CUSTOM_WATCHLIST: ['NVDA', 'SPY', '0700', '9988', '2800'],

    // 顯示設定
    SHOW_STOCK: true,           // 顯示股票
    SHOW_ETF: true,             // 顯示 ETF
    MAX_ITEMS: 21,              // 最多顯示筆數
    FONT_SIZE: 12,              // 字體大小

    // 快取設定
    CACHE_DURATION: 1,          // 主列表快取時間(分鐘)
    HISTORY_CACHE_DURATION: 1, // 歷史數據(K線/MA)快取時間(分鐘)

    // 效能設定
    MAX_CONCURRENT_REQUESTS: 20, // 最大並發請求數
    REQUEST_RETRY_COUNT: 3,      // 請求重試次數
    REQUEST_TIMEOUT: 10000,      // 請求超時(毫秒)

    // 調試模式
    DEBUG_MODE: false,

    // Cookie（選填）
    COOKIES: '',

    // API 設定
    API: {
        BASE: 'https://m-gl.lbkrs.com',
        ENDPOINTS: {
            RANKING: '/api/forward/newmarket/revision/rank/pc/list',
            DETAIL: '/api/forward/v3/quote/stock/detail',
            KLINE: '/api/forward/v3/quote/kline'
        }
    },

    // MA (均線) 配置
    MA_CONFIG: {
        DAYS: [20, 50, 200],
        TRIANGLE: {
            MIN_SIZE: 4,
            MAX_SIZE: 10,
            SCALING_FACTOR: 0.5
        },
        COLORS: {
            GAIN: '#00C46B',
            LOSS: '#FF3B3B',
            NEUTRAL: '#CCCCCC'
        }
    },

    // RSI (相對強弱指標) 配置
    RSI_CONFIG: {
        DAYS: 6,                    // 預設 6 日 RSI
        COLORS: {
            STRONG: '#ef4444',      // RSI 100 (強勢)
            NEUTRAL: '#CCCCCC',     // RSI 50 (中性)
            WEAK: '#22c55e'         // RSI 0 (弱勢)
        }
    },

    // K 線 (Candle) 配置
    KLINE_CONFIG: {
        WIDTH: 8,            // K線總寬度
        HEIGHT: 12,          // K線總高度
        BODY_WIDTH: 8,       // 實體寬度 (填滿)
        SHADOW_WIDTH: 1.5,   // 影線寬度
        COLORS: {
            GAIN: '#00C46B',
            LOSS: '#FF3B3B',
            NEUTRAL: '#CCCCCC'
        }
    },

    // 欄位設定 (US)
    COLUMNS_US: [
        { key: 'industry', header: '', width: 65, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockCode', header: '代號', width: 50, visible: true },
        { key: 'candle', header: '', width: 8, visible: true },
        { key: 'changeRatio', header: '漲跌%', width: 55, visible: true },
        { key: 'currentPrice', header: '價格', width: 50, visible: true },
        { key: 'tradeTurnover', header: '成交額', width: 45, visible: false },
        { key: 'volumeRatio', header: '量比', width: 28, visible: true },
        { key: 'rsi', header: 'RSI', width: 30, visible: true },
        { key: 'ma', header: 'MA', width: 36, visible: true },
    ],

    // 欄位設定 (HK)
    COLUMNS_HK: [
        { key: 'industry', header: '', width: 65, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockName', header: '名稱', width: 65, visible: true },
        { key: 'candle', header: '', width: 8, visible: true },
        { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
        { key: 'currentPrice', header: '價格', width: 50, visible: true },
        { key: 'tradeTurnover', header: '成交額', width: 45, visible: false },
        { key: 'volumeRatio', header: '量比', width: 28, visible: true },
        { key: 'rsi', header: 'RSI', width: 30, visible: true },
        { key: 'ma', header: 'MA', width: 36, visible: true },
    ],

    // 欄位設定 (Mixed/Watchlist)
    COLUMNS_MIXED: [
        { key: 'industry', header: '', width: 65, visible: true },
        { key: 'rank', header: '', width: 25, visible: false },
        { key: 'stockDisplay', header: '名稱/代號', width: 65, visible: true },
        { key: 'candle', header: '', width: 8, visible: true },
        { key: 'changeRatio', header: '漲跌%', width: 50, visible: true },
        { key: 'currentPrice', header: '價格', width: 50, visible: true },
        { key: 'tradeTurnover', header: '成交額', width: 45, visible: false },
        { key: 'volumeRatio', header: '量比', width: 28, visible: true },
        { key: 'rsi', header: 'RSI', width: 30, visible: true },
        { key: 'ma', header: 'MA', width: 36, visible: true },
    ],

    // UI 設定
    UI: {
        HEADER_PADDING: { top: 4, left: 12, bottom: 4, right: 12 },
        ROW_PADDING: { top: 0, left: 12, bottom: 0, right: 12 },
        PROGRESS_BAR_HEIGHT: 1,
        TURNOVER_BAR: {
            MIN_WIDTH: 1,          // 最小線條寬度
            BACKGROUND_OPACITY: 0.1, // 背景透明度
            BAR_OPACITY: 1.0,      // 線條不透明度
            MINIMAL_BAR_OPACITY: 0.3 // 最小線條透明度
        }
    }
};

// ==================== 2. 核心工具 (Core & Utils) ====================

class Logger {
    static log(msg) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
    }
    static error(msg) {
        console.error(`[${new Date().toLocaleTimeString()}] [ERROR] ${msg}`);
    }
    static debug(msg) {
        if (CONFIG.DEBUG_MODE) console.log(`[DEBUG] ${msg}`);
    }
}

class Utils {
    /**
     * 非阻塞延遲
     */
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 格式化成交額
     */
    static formatTurnover(numStr) {
        const value = this.parseTurnover(numStr);
        if (isNaN(value) || value === 0) return String(numStr);
        if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
        return value.toFixed(2);
    }

    static parseTurnover(numStr) {
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

    static identifyMarket(stockCode) {
        return /^\d+$/.test(stockCode) ? 'HK' : 'US';
    }

    static formatStockCode(stockCode, market) {
        return market === 'HK' ? String(parseInt(stockCode, 10)) : stockCode;
    }

    static buildCounterId(stockCode, market, type = 'ST') {
        return `${type}/${market}/${this.formatStockCode(stockCode, market)}`;
    }

    static parseCounterId(counterId) {
        const parts = counterId.split('/');
        return {
            type: parts[0],
            market: parts[1],
            code: parts[2]
        };
    }
}

class ColorTheme {
    static get GAIN_LEVELS() {
        return {
            level5: '#008C4C', level4: '#00A85C', level3: '#00C46B', level2: '#4BD68D', level1: '#9BE39E'
        };
    }
    static get LOSS_LEVELS() {
        return {
            level5: '#C60000', level4: '#E62121', level3: '#FF3B3B', level2: '#FF6E6E', level1: '#FF9B9B'
        };
    }
    static get NEUTRAL() { return '#CCCCCC'; }
    static get BACKGROUND() { return Color.dynamic(Color.white(), new Color('#1C1C1E')); }
    static get TEXT() { return Color.dynamic(Color.black(), Color.white()); }
    static get HEADER_BG() { return Color.dynamic(new Color('#F0F0F0'), new Color('#333333')); }

    static getChangeColor(ratio) {
        if (ratio > 5) return new Color(this.GAIN_LEVELS.level5);
        if (ratio > 3) return new Color(this.GAIN_LEVELS.level4);
        if (ratio > 1.5) return new Color(this.GAIN_LEVELS.level3);
        if (ratio > 0.5) return new Color(this.GAIN_LEVELS.level2);
        if (ratio > 0) return new Color(this.GAIN_LEVELS.level1);
        if (ratio < -5) return new Color(this.LOSS_LEVELS.level5);
        if (ratio < -3) return new Color(this.LOSS_LEVELS.level4);
        if (ratio < -1.5) return new Color(this.LOSS_LEVELS.level3);
        if (ratio < -0.5) return new Color(this.LOSS_LEVELS.level2);
        if (ratio < 0) return new Color(this.LOSS_LEVELS.level1);
        return new Color(this.NEUTRAL);
    }

    static getVolumeColor(ratio) {
        // 冷→熱: 藍灰 -> 藍 -> 綠 -> 黃 -> 紅
        const colors = ['#4B6B8A', '#3FA7D6', '#6DD57E', '#FFD54F', '#FF5252'];
        const thresholds = [0.5, 1.5, 2.5, 5.0, 8.0];
        const capped = Math.min(ratio, 8.0);

        if (capped < thresholds[0]) return new Color(colors[0]);
        for (let i = 0; i < thresholds.length - 1; i++) {
            if (capped < thresholds[i + 1]) {
                const t1 = thresholds[i], t2 = thresholds[i + 1];
                const c1 = colors[i], c2 = colors[i + 1];
                return this.interpolate(c1, c2, (capped - t1) / (t2 - t1));
            }
        }
        return new Color(colors[4]);
    }

    static interpolate(hex1, hex2, ratio) {
        const c1 = this.hexToRgb(hex1);
        const c2 = this.hexToRgb(hex2);
        const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
        const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
        const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
        return new Color(this.rgbToHex(r, g, b));
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }
}

// ==================== 3. 網絡層 (Network Layer) ====================

class HttpClient {
    constructor() {
        this.activeRequests = 0;
        this.queue = [];
        this.maxConcurrent = CONFIG.MAX_CONCURRENT_REQUESTS;
    }

    async get(url, context) {
        return this.enqueue(async () => {
            return this.fetchWithRetry(url, context);
        });
    }

    async enqueue(task) {
        if (this.activeRequests >= this.maxConcurrent) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        this.activeRequests++;
        try {
            return await task();
        } finally {
            this.activeRequests--;
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                next();
            }
        }
    }

    async fetchWithRetry(url, context, retries = CONFIG.REQUEST_RETRY_COUNT) {
        for (let i = 0; i < retries; i++) {
            try {
                const req = new Request(url);
                req.timeoutInterval = CONFIG.REQUEST_TIMEOUT / 1000;
                req.headers = {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
                    ...(CONFIG.COOKIES ? { 'Cookie': CONFIG.COOKIES } : {})
                };
                const json = await req.loadJSON();
                if (json.code !== 0) throw new Error(json.message || 'API Error');
                return json;
            } catch (e) {
                Logger.debug(`${context} retry ${i + 1}/${retries}: ${e.message}`);
                if (i === retries - 1) throw e;
                await Utils.sleep(1000 * Math.pow(2, i)); // 指數退避
            }
        }
    }
}

class LbkrsApi {
    constructor() {
        this.http = new HttpClient();
    }

    buildUrl(path, query) {
        const qs = Object.entries(query)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => {
                if (Array.isArray(v)) return v.map(i => `${k}[]=${encodeURIComponent(i)}`).join('&');
                return `${k}=${encodeURIComponent(v)}`;
            })
            .join('&');
        return `${CONFIG.API.BASE}${path}?${qs}`;
    }

    async getRanking(market) {
        const query = {
            market,
            key: 'all',
            indicators: ['last_done', 'chg', 'total_balance', 'volume_rate', 'industry'],
            sort_indicator: 'total_balance',
            order: 'desc',
            limit: 40
        };
        const url = this.buildUrl(CONFIG.API.ENDPOINTS.RANKING, query);
        const res = await this.http.get(url, `Ranking-${market}`);
        return res.data.list;
    }

    async getDetail(counterId) {
        const url = this.buildUrl(CONFIG.API.ENDPOINTS.DETAIL, { counter_id: counterId });
        const res = await this.http.get(url, `Detail-${counterId}`);
        return res.data;
    }

    async getHistory(counterId, days = 201) {
        // 注意：KLINE endpoint 在 CONFIG 中是完整路徑，但 buildUrl 會拼在 BASE 後
        // 這裡做個特殊處理或修正 CONFIG。假設 CONFIG 路徑是相對的。
        const url = this.buildUrl(CONFIG.API.ENDPOINTS.KLINE, {
            counter_id: counterId,
            line_num: days,
            line_type: 1000 // 日K
        });
        const res = await this.http.get(url, `History-${counterId}`);
        return res.data.klines;
    }
}

// ==================== 4. 領域層 (Domain Layer) ====================

class TechnicalIndicators {
    static calculateMA(prices, days) {
        if (prices.length < days) return null;
        const sum = prices.slice(-days).reduce((a, b) => a + b, 0);
        return sum / days;
    }

    static calculateRSI(prices, days = 6) {
        if (prices.length < days + 1) return null;
        let gains = 0, losses = 0;
        for (let i = 1; i <= days; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff > 0) gains += diff;
            else losses += Math.abs(diff);
        }
        const rs = gains / losses;
        return losses === 0 ? 100 : 100 - (100 / (1 + rs));
    }
}

class Stock {
    constructor(data) {
        this.code = data.code;
        this.name = data.name;
        this.market = data.market;
        this.type = data.type; // 'ST' or 'ETF'
        this.price = data.price;
        this.changePct = data.changePct;
        this.turnover = data.turnover;
        this.volumeRatio = data.volumeRatio;
        this.industry = data.industry;

        // 擴充數據
        this.candle = null; // {open, high, low, close}
        this.ma = {};       // { ma20: {value, dev}, ... }
        this.rsi = null;    // { value, trend }
    }

    get counterId() {
        return Utils.buildCounterId(this.code, this.market, this.type);
    }
}

// ==================== 5. 服務層 (Service Layer) ====================

class CacheService {
    constructor() {
        this.fm = FileManager.local();
        this.root = this.fm.documentsDirectory();
    }

    getPath(key) { return this.fm.joinPath(this.root, `lbkrs_v3_${key}.json`); }

    get(key, durationMinutes) {
        const path = this.getPath(key);
        if (!this.fm.fileExists(path)) return null;
        try {
            const data = JSON.parse(this.fm.readString(path));
            const age = (Date.now() - data.ts) / (60 * 1000);
            if (age > durationMinutes) return null;
            return data.payload;
        } catch (e) { return null; }
    }

    set(key, payload) {
        const path = this.getPath(key);
        this.fm.writeString(path, JSON.stringify({ ts: Date.now(), payload }));
    }
}

class StockService {
    constructor() {
        this.api = new LbkrsApi();
        this.cache = new CacheService();
    }

    async getStocks(mode, market) {
        if (mode === 'watchlist') {
            return this.getWatchlist();
        }
        return this.getRanking(market);
    }

    extractIndustry(rawIndustry, type, stockName) {
        if (type === 'ETF') {
            return stockName || 'ETF';
        }
        return (rawIndustry && rawIndustry.trim()) ? rawIndustry.trim() : '--';
    }

    calculateChangePercent(data, currentPrice) {
        const prevClose = parseFloat(data.prev_close);
        if (prevClose && prevClose > 0) {
            return ((currentPrice - prevClose) / prevClose) * 100;
        }
        return (parseFloat(data.chg) || 0) * 100;
    }

    async getRanking(market) {
        const cacheKey = `ranking_${market}`;
        const cached = this.cache.get(cacheKey, CONFIG.CACHE_DURATION);
        if (cached) return cached.map(d => new Stock(d));

        const list = await this.api.getRanking(market);
        const stocks = list.map(item => {
            const cid = Utils.parseCounterId(item.counter_id);
            return new Stock({
                code: cid.code,
                name: item.name,
                market: cid.market,
                type: cid.type,
                price: parseFloat(item.indicators[0]),
                changePct: parseFloat(item.indicators[1]) * 100,
                turnover: item.indicators[2], // total_balance
                volumeRatio: parseFloat(item.indicators[3]),
                industry: this.extractIndustry(item.indicators[4], cid.type, item.name)
            });
        });

        // 序列化儲存
        this.cache.set(cacheKey, stocks);
        return stocks;
    }

    async getWatchlist() {
        const codes = CONFIG.CUSTOM_WATCHLIST || [];
        if (codes.length === 0) return [];

        // 並行獲取，保持順序
        const results = await Promise.all(codes.map(async (code) => {
            try {
                const market = Utils.identifyMarket(code);
                // 嘗試 ST, ETF
                let data, type = 'ST';
                try {
                    data = await this.api.getDetail(Utils.buildCounterId(code, market, 'ST'));
                } catch {
                    type = 'ETF';
                    data = await this.api.getDetail(Utils.buildCounterId(code, market, 'ETF'));
                }

                return new Stock({
                    code: code,
                    name: data.stock_name,
                    market: market,
                    type: type,
                    price: parseFloat(data.last_done),
                    changePct: this.calculateChangePercent(data, parseFloat(data.last_done)),
                    turnover: data.total_balance || data.balance,
                    volumeRatio: parseFloat(data.volume_rate),
                    industry: this.extractIndustry(data.industry_name, type, data.stock_name)
                });
            } catch (e) {
                Logger.error(`Watchlist ${code} failed: ${e.message}`);
                return null;
            }
        }));

        return results.filter(s => s !== null);
    }

    /**
     * 統一數據補充邏輯 (Unified Fetching)
     * 根據需要的欄位決定抓取策略
     */
    async enrichStocks(stocks, columns) {
        const needsMA = columns.some(c => c.key === 'ma' && c.visible);
        const needsRSI = columns.some(c => c.key === 'rsi' && c.visible);
        const needsCandle = columns.some(c => c.key === 'candle' && c.visible);

        if (!needsMA && !needsRSI && !needsCandle) return stocks;

        Logger.log(`Enriching ${stocks.length} stocks (MA:${needsMA}, RSI:${needsRSI}, Candle:${needsCandle})`);

        const tasks = stocks.map(async (stock) => {
            // 策略 1: 如果需要 MA 或 RSI，必須抓 History (201天)
            // History 包含最新一天的 O/H/L/C，所以也滿足 Candle 需求
            if (needsMA || needsRSI) {
                try {
                    const klines = await this.fetchHistoryWithCache(stock);
                    if (klines && klines.length > 0) {
                        const prices = klines.map(k => parseFloat(k.close));

                        // 計算 MA
                        if (needsMA) {
                            CONFIG.MA_CONFIG.DAYS.forEach(day => {
                                const val = TechnicalIndicators.calculateMA(prices, day);
                                if (val) {
                                    stock.ma[`ma${day}`] = {
                                        value: val,
                                        deviation: ((stock.price - val) / val) * 100
                                    };
                                }
                            });
                        }

                        // 計算 RSI
                        if (needsRSI) {
                            const rsiNow = TechnicalIndicators.calculateRSI(prices, CONFIG.RSI_CONFIG.DAYS);
                            const rsiPrev = TechnicalIndicators.calculateRSI(prices.slice(0, -1), CONFIG.RSI_CONFIG.DAYS);
                            if (rsiNow !== null) {
                                stock.rsi = { value: rsiNow, trend: rsiNow >= rsiPrev ? 'up' : 'down' };
                            }
                        }

                        // 填充 Candle (使用最後一筆)
                        if (needsCandle) {
                            const last = klines[klines.length - 1];
                            stock.candle = {
                                open: parseFloat(last.open),
                                high: parseFloat(last.high),
                                low: parseFloat(last.low),
                                close: parseFloat(last.close)
                            };
                        }
                    }
                } catch (e) {
                    Logger.debug(`History failed for ${stock.code}: ${e.message}`);
                }
            }
            // 策略 2: 只需要 Candle，不需要歷史
            else if (needsCandle) {
                // 如果是 Watchlist 模式，Detail API 可能已經有數據了 (但我們在 getWatchlist 只取了基礎)
                // 為了簡單，這裡統一抓取 History(1天) 或者 Detail
                // 抓 History(1) 比較輕量且統一
                try {
                    const klines = await this.api.getHistory(stock.counterId, 1);
                    if (klines && klines.length > 0) {
                        const last = klines[0];
                        stock.candle = {
                            open: parseFloat(last.open),
                            high: parseFloat(last.high),
                            low: parseFloat(last.low),
                            close: parseFloat(last.close)
                        };
                    }
                } catch (e) {
                    Logger.debug(`Candle failed for ${stock.code}: ${e.message}`);
                }
            }
        });

        await Promise.all(tasks);
        return stocks;
    }

    async fetchHistoryWithCache(stock) {
        const key = `history_${stock.code}`;
        const cached = this.cache.get(key, CONFIG.HISTORY_CACHE_DURATION);
        if (cached) return cached;

        const data = await this.api.getHistory(stock.counterId, 201);
        if (data) this.cache.set(key, data);
        return data;
    }
}

// ==================== 6. UI 層 (UI Layer) ====================

class Painters {
    static drawCandle(stack, candle) {
        if (!candle) { stack.addSpacer(); return; }
        const { WIDTH, HEIGHT, SHADOW_WIDTH, COLORS } = CONFIG.KLINE_CONFIG;
        const { open, high, low, close } = candle;

        const color = new Color(close >= open ? COLORS.GAIN : COLORS.LOSS);
        const ctx = new DrawContext();
        ctx.size = new Size(WIDTH, HEIGHT);
        ctx.opaque = false;
        ctx.respectScreenScale = true;

        const range = Math.max(high - low, 0.01);
        const getY = p => HEIGHT - ((p - low) / range) * HEIGHT;

        // 影線
        const x = WIDTH / 2;
        const path = new Path();
        path.move(new Point(x, getY(high)));
        path.addLine(new Point(x, getY(low)));
        ctx.setStrokeColor(color);
        ctx.setLineWidth(SHADOW_WIDTH);
        ctx.addPath(path);
        ctx.strokePath();

        // 實體
        const bodyTop = Math.min(getY(open), getY(close));
        const bodyH = Math.max(Math.abs(getY(open) - getY(close)), 1);
        ctx.setFillColor(color);
        ctx.fillRect(new Rect(0, bodyTop, WIDTH, bodyH));

        const img = stack.addImage(ctx.getImage());
        img.imageSize = new Size(WIDTH, HEIGHT);
        img.centerAlignImage();
    }

    static drawMA(stack, maData) {
        const { DAYS, TRIANGLE, COLORS } = CONFIG.MA_CONFIG;
        const width = DAYS.length * 12;
        const height = 14;
        const itemWidth = 12;

        if (Object.keys(maData).length === 0) {
            const t = stack.addText('-');
            t.font = Font.systemFont(10);
            t.textColor = new Color('#666');
            return;
        }

        const ctx = new DrawContext();
        ctx.size = new Size(width, height);
        ctx.opaque = false;
        ctx.respectScreenScale = true;

        // 排名
        const valid = DAYS.map(d => ({ d, val: maData[`ma${d}`]?.value }))
            .filter(x => x.val)
            .sort((a, b) => b.val - a.val); // 降序

        const rankMap = new Map();
        valid.forEach((x, i) => rankMap.set(x.d, i));

        DAYS.forEach((day, i) => {
            const data = maData[`ma${day}`];
            const cx = i * itemWidth + itemWidth / 2;
            const cy = height / 2;

            // 排名線
            if (rankMap.has(day)) {
                const rank = rankMap.get(day);
                const lx = i * itemWidth;
                if (rank === 0) { // 最高: 綠頂線
                    const p = new Path();
                    p.move(new Point(lx, 1)); p.addLine(new Point(lx + itemWidth, 1));
                    ctx.setStrokeColor(new Color(COLORS.GAIN));
                    ctx.setLineWidth(1); ctx.addPath(p); ctx.strokePath();
                } else if (rank === valid.length - 1 && valid.length > 1) { // 最低: 紅底線
                    const p = new Path();
                    p.move(new Point(lx, height - 1)); p.addLine(new Point(lx + itemWidth, height - 1));
                    ctx.setStrokeColor(new Color(COLORS.LOSS));
                    ctx.setLineWidth(1); ctx.addPath(p); ctx.strokePath();
                }
            }

            if (!data) {
                // 無數據橫線
                const p = new Path();
                p.move(new Point(cx - 2, cy)); p.addLine(new Point(cx + 2, cy));
                ctx.setStrokeColor(new Color('#666'));
                ctx.setLineWidth(1); ctx.addPath(p); ctx.strokePath();
                return;
            }

            // 三角形
            const dev = data.deviation;
            const size = Math.min(Math.max(Math.abs(dev) * TRIANGLE.SCALING_FACTOR + TRIANGLE.MIN_SIZE, TRIANGLE.MIN_SIZE), TRIANGLE.MAX_SIZE);
            const isUp = dev > 0;
            const color = new Color(isUp ? COLORS.GAIN : COLORS.LOSS);
            const hs = size / 2;

            const p = new Path();
            if (isUp) {
                p.move(new Point(cx, cy - hs));
                p.addLine(new Point(cx - hs, cy + hs));
                p.addLine(new Point(cx + hs, cy + hs));
            } else {
                p.move(new Point(cx - hs, cy - hs));
                p.addLine(new Point(cx + hs, cy - hs));
                p.addLine(new Point(cx, cy + hs));
            }
            ctx.setFillColor(color);
            ctx.addPath(p);
            ctx.fillPath();
        });

        const img = stack.addImage(ctx.getImage());
        img.imageSize = new Size(width, height);
        img.centerAlignImage();
    }

    static drawRSI(stack, rsi) {
        if (!rsi) {
            const t = stack.addText('-');
            t.font = Font.systemFont(CONFIG.FONT_SIZE);
            t.textColor = new Color('#666');
            return;
        }

        const row = stack.addStack();
        row.layoutHorizontally();
        row.centerAlignContent();

        // 箭頭
        const arrow = rsi.trend === 'up' ? '▲' : '▼';
        const arrowColor = new Color(rsi.trend === 'up' ? CONFIG.RSI_CONFIG.COLORS.WEAK : CONFIG.RSI_CONFIG.COLORS.STRONG); // 注意: 這裡用 WEAK(綠) 代表 UP? 檢查 Config: WEAK=#22c55e(綠), STRONG=#ef4444(紅). 沒錯，綠漲紅跌。
        const a = row.addText(arrow);
        a.font = Font.mediumSystemFont(8);
        a.textColor = arrowColor;

        // 數值 (漸層色)
        const val = Math.max(0, Math.min(100, rsi.value));
        const color = val <= 50
            ? ColorTheme.interpolate(CONFIG.RSI_CONFIG.COLORS.WEAK, CONFIG.RSI_CONFIG.COLORS.NEUTRAL, val / 50)
            : ColorTheme.interpolate(CONFIG.RSI_CONFIG.COLORS.NEUTRAL, CONFIG.RSI_CONFIG.COLORS.STRONG, (val - 50) / 50);

        const t = row.addText(Math.round(val).toString());
        t.font = Font.mediumSystemFont(CONFIG.FONT_SIZE);
        t.textColor = color;
    }
}

class WidgetBuilder {
    constructor(stocks, market, mode) {
        this.stocks = stocks;
        this.market = market;
        this.mode = mode;
        this.columns = this.getColumns();
        this.maxTurnover = Math.max(...stocks.map(s => Utils.parseTurnover(s.turnover)), 0);
    }

    getColumns() {
        let cols;
        if (this.mode === 'watchlist') cols = CONFIG.COLUMNS_MIXED;
        else cols = this.market === 'HK' ? CONFIG.COLUMNS_HK : CONFIG.COLUMNS_US;

        // 動態調整 MA 寬度
        return cols.map(c => {
            if (c.key === 'ma') return { ...c, width: CONFIG.MA_CONFIG.DAYS.length * 12 };
            return c;
        }).filter(c => c.visible);
    }

    build() {
        const w = new ListWidget();
        w.backgroundColor = ColorTheme.BACKGROUND;
        w.setPadding(0, 0, 0, 0);

        this.buildHeader(w);
        this.stocks.forEach(s => this.buildRow(w, s));
        return w;
    }

    buildHeader(w) {
        const row = w.addStack();
        row.backgroundColor = ColorTheme.HEADER_BG;
        const p = CONFIG.UI.HEADER_PADDING;
        row.setPadding(p.top, p.left, p.bottom, p.right);

        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        this.columns.forEach(col => {
            const stack = row.addStack();
            stack.size = new Size(col.width, 0);
            const text = col.key === 'industry' ? timeStr : col.header;
            const t = stack.addText(text);
            t.font = Font.boldSystemFont(CONFIG.FONT_SIZE);
            t.textColor = ColorTheme.TEXT;
        });
    }

    buildRow(w, stock) {
        const container = w.addStack();
        container.layoutVertically();
        const p = CONFIG.UI.ROW_PADDING;
        container.setPadding(p.top, p.left, p.bottom, p.right);

        const row = container.addStack();
        row.layoutHorizontally();
        row.centerAlignContent();

        const rowColor = ColorTheme.getChangeColor(stock.changePct);

        this.columns.forEach(col => {
            const stack = row.addStack();
            stack.size = new Size(col.width, 0);
            stack.centerAlignContent();

            switch (col.key) {
                case 'candle': Painters.drawCandle(stack, stock.candle); break;
                case 'ma': Painters.drawMA(stack, stock.ma); break;
                case 'rsi': Painters.drawRSI(stack, stock.rsi); break;
                default: this.addTextCell(stack, col.key, stock, rowColor);
            }
        });

        this.addTurnoverBar(container, stock, rowColor);
    }

    addTextCell(stack, key, stock, rowColor) {
        let val = '--';
        let color = rowColor;

        switch (key) {
            case 'stockCode':
                val = Utils.formatStockCode(stock.code, stock.market);
                break;
            case 'stockName':
                val = stock.name;
                break;
            case 'stockDisplay':
                val = stock.market === 'HK' ? stock.name : stock.code;
                break;
            case 'changeRatio':
                val = `${stock.changePct >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%`;
                break;
            case 'currentPrice':
                val = stock.price.toFixed(2);
                break;
            case 'tradeTurnover':
                val = Utils.formatTurnover(stock.turnover);
                break;
            case 'volumeRatio':
                val = stock.volumeRatio.toFixed(2);
                color = ColorTheme.getVolumeColor(stock.volumeRatio);
                break;
            case 'industry':
                val = stock.industry;
                break;
        }

        const t = stack.addText(String(val));
        t.font = Font.mediumSystemFont(CONFIG.FONT_SIZE);
        t.textColor = color;
        t.lineLimit = 1;
    }

    addTurnoverBar(container, stock, color) {
        const totalW = this.columns.reduce((s, c) => s + c.width, 0);
        const cur = Utils.parseTurnover(stock.turnover);
        const ratio = this.maxTurnover > 0 ? Math.min(cur / this.maxTurnover, 1) : 0;

        const barBox = container.addStack();
        barBox.size = new Size(totalW, CONFIG.UI.PROGRESS_BAR_HEIGHT);
        barBox.backgroundColor = new Color("#888", CONFIG.UI.TURNOVER_BAR.BACKGROUND_OPACITY);

        if (ratio > 0) {
            const w = Math.max(totalW * ratio, CONFIG.UI.TURNOVER_BAR.MIN_WIDTH);
            const bar = barBox.addStack();
            bar.size = new Size(w, CONFIG.UI.PROGRESS_BAR_HEIGHT);
            bar.backgroundColor = color;
        }
        barBox.addSpacer();
    }
}

// ==================== 7. 主程式 (Main) ====================

class App {
    static async run() {
        const start = Date.now();
        Logger.log('App Started');

        try {
            // 1. 決定模式與市場
            let mode = 'ranking';
            let market = CONFIG.MARKET;

            if (CONFIG.CUSTOM_WATCHLIST && CONFIG.CUSTOM_WATCHLIST.length > 0) {
                mode = 'watchlist';
                market = 'AUTO'; // Watchlist 混合市場
            } else if (market === 'AUTO') {
                market = this.resolveAutoMarket();
            }

            // 2. 獲取數據
            const service = new StockService();
            let stocks = await service.getStocks(mode, market);

            // 3. 過濾與排序
            stocks = stocks.filter(s =>
                (CONFIG.SHOW_STOCK && s.type === 'ST') ||
                (CONFIG.SHOW_ETF && s.type === 'ETF')
            ).slice(0, CONFIG.MAX_ITEMS);

            // 4. 補充數據 (Unified Fetching)
            // 這裡傳入 Builder 會用到的 columns 來決定要抓什麼
            const builder = new WidgetBuilder(stocks, market, mode);
            stocks = await service.enrichStocks(stocks, builder.columns);

            // 5. 建立 Widget
            const widget = builder.build();

            if (config.runsInWidget) Script.setWidget(widget);
            else widget.presentLarge();

            Logger.log(`Finished in ${Date.now() - start}ms. Items: ${stocks.length}`);

        } catch (e) {
            Logger.error(e.message);
            const w = new ListWidget();
            w.addText(`Error: ${e.message}`);
            if (config.runsInWidget) Script.setWidget(w);
            else w.presentLarge();
        } finally {
            Script.complete();
        }
    }

    static resolveAutoMarket() {
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
}

await App.run();