/**
 * Macau GGR charts: load data/ggr.json, render hero stats + Chart.js lines.
 */
(function () {
  "use strict";

  var DATA_URL = "data/ggr.json";

  // Presentation colors (not source data).
  // Recent years (2019-2026) use high-contrast hues so adjacent years never share yellow/amber.
  var YEAR_PALETTE = {
    2009: "#5c6b7a",
    2010: "#4f6f8f",
    2011: "#3d7ea6",
    2012: "#2f8f9a",
    2013: "#3a9a72",
    2014: "#6b9a3a",
    2015: "#9a8a2e",
    2016: "#b07a2a",
    2017: "#c46a2e",
    2018: "#c95a3a",
    2019: "#c45c4a", // terracotta
    2020: "#8b6bb0", // muted violet
    2021: "#4a8f9e", // teal
    2022: "#5a7fd4", // steel blue
    2023: "#3a9a72", // green
    2024: "#c9a24a", // amber (brand accent)
    2025: "#d94f6d", // rose
    2026: "#3d9fd9"  // sky blue
  };

  function hexToRgba(hex, alpha) {
    var h = hex.replace("#", "");
    var n = parseInt(h, 16);
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function sumValid(arr) {
    return arr.reduce(function (acc, v) {
      return v == null ? acc : acc + v;
    }, 0);
  }

  function countValid(arr) {
    return arr.reduce(function (acc, v) {
      return v == null ? acc : acc + 1;
    }, 0);
  }

  function formatMop(n) {
    return n.toLocaleString("zh-Hant");
  }

  function formatYi(n) {
    // DICJ unit is 百萬 MOP. 1 億 = 100 百萬.
    var yi = n / 100;
    return yi.toLocaleString("zh-Hant", { maximumFractionDigits: 1 }) + " 億";
  }

  function readCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function chartTheme() {
    return {
      text: readCssVar("--text-secondary") || "#a8a29e",
      muted: readCssVar("--text-muted") || "#78716c",
      grid: readCssVar("--chart-grid") || "rgba(255,255,255,0.06)",
      tick: readCssVar("--chart-tick") || "#78716c",
      tooltipBg: readCssVar("--bg-elevated") || "#14161b",
      tooltipBorder: readCssVar("--border-strong") || "rgba(255,255,255,0.14)",
      tooltipTitle: readCssVar("--text") || "#f2f1ee"
    };
  }

  function toDataset(entry, emphasis) {
    var color = YEAR_PALETTE[entry.year] || "#888";
    var isFocus = entry.year >= 2024;
    return {
      label: String(entry.year),
      data: entry.data,
      borderColor: color,
      backgroundColor: hexToRgba(color, 0.08),
      borderWidth: isFocus || emphasis ? 2.5 : 1.5,
      pointRadius: isFocus ? 2.5 : 0,
      pointHoverRadius: 5,
      pointHitRadius: 8,
      tension: 0.22,
      spanGaps: true
    };
  }

  function renderStats(rawYears) {
    var y2025 = rawYears.find(function (y) {
      return y.year === 2025;
    });
    var y2026 = rawYears.find(function (y) {
      return y.year === 2026;
    });
    var y2019 = rawYears.find(function (y) {
      return y.year === 2019;
    });

    if (!y2025 || !y2026 || !y2019) return;

    var total2025 = sumValid(y2025.data);
    var ytd2026 = sumValid(y2026.data);
    var months2026 = countValid(y2026.data);
    var total2019 = sumValid(y2019.data);

    var peak = { year: 0, month: 0, value: -1 };
    rawYears.forEach(function (y) {
      y.data.forEach(function (v, i) {
        if (v != null && v > peak.value) {
          peak = { year: y.year, month: i + 1, value: v };
        }
      });
    });

    var recovery =
      total2019 > 0
        ? ((total2025 / total2019) * 100).toLocaleString("zh-Hant", {
            maximumFractionDigits: 0
          })
        : "-";

    var stats = [
      {
        accent: true,
        label: "2025 全年毛收入",
        value: formatYi(total2025),
        hint: formatMop(total2025) + " 百萬 MOP"
      },
      {
        accent: false,
        label: "2026 年初至今累計",
        value: formatYi(ytd2026),
        hint: "前 " + months2026 + " 個月合計"
      },
      {
        accent: false,
        label: "相對 2019 全年",
        value: recovery + "%",
        hint: "2025 全年 ÷ 2019 全年"
      },
      {
        accent: false,
        label: "歷史單月高峰",
        value: formatMop(peak.value),
        hint: peak.year + " 年 " + peak.month + " 月 · 百萬 MOP"
      }
    ];

    var root = document.getElementById("hero-stats");
    if (!root) return;

    root.innerHTML = stats
      .map(function (s) {
        return (
          '<div class="stat' +
          (s.accent ? " stat--accent" : "") +
          '">' +
          '<div class="stat__label">' +
          s.label +
          "</div>" +
          '<div class="stat__value">' +
          s.value +
          "</div>" +
          '<div class="stat__hint">' +
          s.hint +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function makeOptions(titleText) {
    var t = chartTheme();
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 650,
        easing: "easeOutQuart"
      },
      plugins: {
        title: { display: false, text: titleText },
        legend: {
          labels: {
            color: t.text,
            font: { size: 11, weight: "500" }
          }
        },
        tooltip: {
          backgroundColor: t.tooltipBg,
          titleColor: t.tooltipTitle,
          bodyColor: t.text,
          borderColor: t.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            title: function (items) {
              return items[0] ? items[0].label : "";
            },
            label: function (context) {
              var label = context.dataset.label || "";
              var value = context.parsed.y;
              if (value == null) return " " + label + ": 無資料";
              return (
                " " + label + ": " + value.toLocaleString("zh-Hant") + " 百萬"
              );
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          title: {
            display: true,
            text: "百萬澳門元",
            color: t.muted,
            font: { size: 11, weight: "500" }
          },
          ticks: {
            color: t.tick,
            font: { size: 11, family: "ui-monospace, monospace" },
            callback: function (v) {
              return Number(v).toLocaleString("zh-Hant");
            }
          },
          grid: {
            color: t.grid,
            drawBorder: false
          },
          border: { display: false }
        },
        x: {
          title: { display: false },
          ticks: {
            color: t.tick,
            font: { size: 11 }
          },
          grid: { display: false },
          border: { display: false }
        }
      }
    };
  }

  function createLineChart(canvasId, months, datasets, title) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === "undefined") return null;
    return new Chart(el.getContext("2d"), {
      type: "line",
      data: {
        labels: months,
        datasets: datasets
      },
      options: makeOptions(title)
    });
  }

  function configureChartDefaults() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = chartTheme().text;
    Chart.defaults.interaction.mode = "index";
    Chart.defaults.interaction.intersect = false;
    Chart.defaults.plugins.legend.position = "bottom";
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.boxHeight = 10;
    Chart.defaults.plugins.legend.labels.padding = 14;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = "line";
    Chart.defaults.elements.line.borderJoinStyle = "round";
    Chart.defaults.elements.line.borderCapStyle = "round";
    Chart.defaults.elements.point.hoverBorderWidth = 2;
  }

  function showLoadError(message) {
    var root = document.getElementById("hero-stats");
    if (root) {
      root.innerHTML =
        '<div class="stat" style="grid-column:1/-1"><div class="stat__label">資料載入</div>' +
        '<div class="stat__value" style="font-size:0.95rem;font-family:var(--font)">' +
        message +
        "</div></div>";
    }
    ["recentYears", "allYears", "pastAndFuture"].forEach(function (id) {
      var canvas = document.getElementById(id);
      if (!canvas || !canvas.parentElement) return;
      var body = canvas.parentElement;
      body.innerHTML =
        '<div class="chart-card__error">' + message + "</div>";
    });
  }

  function init(payload) {
    var months = payload.months;
    var rawYears = payload.years;

    configureChartDefaults();
    renderStats(rawYears);

    var allDatasets = rawYears.map(function (y) {
      return toDataset(y, false);
    });

    var recentDatasets = rawYears
      .filter(function (y) {
        return y.year >= 2019;
      })
      .map(function (y) {
        return toDataset(y, true);
      });

    var compareDatasets = rawYears
      .filter(function (y) {
        return (y.year >= 2010 && y.year <= 2019) || y.year === 2026;
      })
      .map(function (y) {
        return toDataset(y, y.year === 2026);
      });

    createLineChart(
      "recentYears",
      months,
      recentDatasets,
      "2019-2026 每月毛收入"
    );
    createLineChart("allYears", months, allDatasets, "2009-2026 每月毛收入");
    createLineChart(
      "pastAndFuture",
      months,
      compareDatasets,
      "2010-2019 與 2026 每月毛收入"
    );
  }

  function loadData() {
    return fetch(DATA_URL, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status + " loading " + DATA_URL);
      }
      return res.json();
    });
  }

  loadData()
    .then(init)
    .catch(function (err) {
      console.error(err);
      showLoadError(
        "無法載入 data/ggr.json。請以本機伺服器開啟頁面（例如 python -m http.server），或檢查檔案路徑。"
      );
    });
})();
