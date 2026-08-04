Github Page: https://shaojohn.github.io/MacauGrossGamingRevenue/

## 專案結構 / Project structure

```
index.html      # markup only
css/styles.css  # layout, theme tokens, components
js/app.js       # hero stats + Chart.js charts
data/ggr.json   # monthly GGR series (source of truth)
```

To preview locally (JSON is loaded via `fetch`, so use a local server):

```bash
python3 -m http.server 8080
# open http://127.0.0.1:8080
```

## 資料來源 / Data Source

澳門博彩監察協調局（DICJ）每月統計資料：
https://www.dicj.gov.mo/web/cn/information/DadosEstat_mensal/index.html

Gaming Inspection and Coordination Bureau (DICJ) of Macau – Monthly Statistics
