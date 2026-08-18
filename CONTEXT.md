# Stock Widget Domain Model

Domain language and visual semantics for the iOS Scriptable Stock Widget.

## Technical Indicators

**MA (Moving Average / 均線)**:
過去特定交易日數之收盤價算術平均值，系統基準週期為 MA20（月線/短期）、MA50（季線/中期）、MA200（年線/長期）。
_Avoid_: 均價, 成本線

**Price-MA Position (均線站位)**:
現價與單一均線的相對高低關係。現價高於或等於均線為 Above（站上/亮綠），低於為 Below（跌破/亮紅）。
_Avoid_: 均線穿越, 均線差距

**MA Alignment (均線多空排列)**:
短、中、長期均線數值間的排序結構。$MA_{20} > MA_{50} > MA_{200}$ 為 Bullish Alignment（多頭排列），$MA_{20} < MA_{50} < MA_{200}$ 為 Bearish Alignment（空頭排列）。
_Avoid_: 均線趨勢, 均線形態

**Three-Segment Pill Indicator (三段微型膠囊燈號)**:
水平依序排列 3 個固定 8×8px 微型圓角矩形（圓角 2px），由左至右對應 MA20、MA50、MA200 之即時站位。
_Avoid_: 三角形指示器, 均線底線

**Pod Frame (多空排列外框膠囊)**:
當個股達成強勢多頭或極端空頭共振時，外層包覆之 1px 細外框與 15% 半透明微光底色容器。
_Avoid_: 頂底線, 排名線
