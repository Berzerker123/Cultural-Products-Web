(function () {
  "use strict";

  var data = window.APP_DATA;
  var DEFAULT_FILTERS = {
    search: "",
    platform: "all",
    risk: "all",
    status: "all",
    sort: "newest",
    startDate: "2025-05-01",
    endDate: "2025-06-02",
  };
  var state = {
    menuOpen: false,
    sidebarCollapsed: false,
    filters: Object.assign({}, DEFAULT_FILTERS),
    page: 1,
    pageSize: 6,
    draft: {},
    detailRules: {},
    lastAlertsHash: "#/alerts",
    lastUpdated: new Date(),
    refreshVersion: 0,
  };

  var platformMeta = {
    douyin: {
      label: "抖音",
      className: "platform-douyin",
      mark: "音",
      image: "assets/platform-douyin.png",
    },
    wechat: {
      label: "微信",
      className: "platform-wechat",
      mark: "微",
      image: "assets/platform-wechat.png",
    },
    rednote: {
      label: "小红书",
      className: "platform-rednote",
      mark: "书",
      image: "assets/platform-rednote.png",
    },
    kuaishou: {
      label: "快手",
      className: "platform-kuaishou",
      mark: "快",
      image: "assets/platform-kuaishou.png",
    },
    weibo: {
      label: "微博",
      className: "platform-weibo",
      mark: "博",
      image: "assets/platform-weibo.png",
    },
    zhihu: { label: "知乎", className: "platform-zhihu", mark: "知" },
    bilibili: { label: "B站", className: "platform-bilibili", mark: "B" },
  };

  function isIsoDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    var parts = value.split("-").map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return (
      date.getUTCFullYear() === parts[0] &&
      date.getUTCMonth() === parts[1] - 1 &&
      date.getUTCDate() === parts[2]
    );
  }

  function normalizeDateFilter(value, fallback) {
    if (value === "") return "";
    return isIsoDate(value) ? value : fallback;
  }

  function normalizeChoice(value, choices, fallback) {
    return choices.indexOf(value) > -1 ? value : fallback;
  }

  function normalizeFilters(values) {
    var input = values || {};
    var categories = (data && data.categories) || [];
    var statusCounts = (data && data.statusCounts) || {};
    return {
      search: String(input.search == null ? "" : input.search).trim().slice(0, 120),
      platform: normalizeChoice(
        input.platform,
        ["all"].concat(Object.keys(platformMeta)),
        DEFAULT_FILTERS.platform,
      ),
      risk: normalizeChoice(
        input.risk,
        ["all"].concat(
          categories.map(function (item) {
            return item.key;
          }),
        ),
        DEFAULT_FILTERS.risk,
      ),
      status: normalizeChoice(
        input.status,
        ["all"].concat(Object.keys(statusCounts)),
        DEFAULT_FILTERS.status,
      ),
      sort: normalizeChoice(
        input.sort,
        ["newest", "oldest", "confidence"],
        DEFAULT_FILTERS.sort,
      ),
      startDate: normalizeDateFilter(input.startDate, DEFAULT_FILTERS.startDate),
      endDate: normalizeDateFilter(input.endDate, DEFAULT_FILTERS.endDate),
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function assetUrl(path) {
    var value = String(path == null ? "" : path);
    return /^assets\/case-\d+\.png$/.test(value)
      ? value + "?v=20260729"
      : value;
  }

  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function platformBadge(key, label) {
    var meta = platformMeta[key] || {
      label: label || "平台",
      className: "platform-default",
      mark: "平",
    };
    var graphic = meta.image
      ? '<img src="' + escapeHtml(meta.image) + '" alt="">'
      : "<b>" + escapeHtml(meta.mark) + "</b>";
    return (
      '<span class="platform-badge ' +
      meta.className +
      '">' +
      graphic +
      "<span>" +
      escapeHtml(label || meta.label) +
      "</span></span>"
    );
  }

  function platformIcon(key, label) {
    var meta = platformMeta[key] || {
      label: label || "平台",
      className: "platform-default",
      mark: "平",
    };
    var graphic = meta.image
      ? '<img src="' + escapeHtml(meta.image) + '" alt="" aria-hidden="true">'
      : '<b aria-hidden="true">' + escapeHtml(meta.mark) + "</b>";
    return (
      '<span class="latest-platform ' +
      meta.className +
      '">' +
      graphic +
      '<span class="sr-only">平台：' +
      escapeHtml(label || meta.label) +
      "</span></span>"
    );
  }

  function riskDot(key, label) {
    return (
      '<span class="risk-label risk-' +
      escapeHtml(key) +
      '"><i></i>' +
      escapeHtml(label) +
      "</span>"
    );
  }

  function trend(value, tone) {
    return (
      '<span class="trend ' +
      (tone || "up") +
      '"><span aria-hidden="true">▲</span> ' +
      escapeHtml(value) +
      "</span>"
    );
  }

  function parseRoute() {
    var hash = typeof location.hash === "string" ? location.hash : "";
    var raw = hash.replace(/^#\/?/, "") || "overview";
    var queryIndex = raw.indexOf("?");
    var path = queryIndex === -1 ? raw : raw.slice(0, queryIndex);
    var query = new URLSearchParams(
      queryIndex === -1 ? "" : raw.slice(queryIndex + 1),
    );
    if (path === "detail" || path === "detail/")
      return { name: "not-found", reason: "missing-detail-id", query: query };
    if (path.indexOf("detail/") === 0) {
      var encodedId = path.slice(7);
      if (!encodedId || encodedId.indexOf("/") > -1)
        return { name: "not-found", reason: "invalid-detail-id", query: query };
      try {
        var id = decodeURIComponent(encodedId);
        if (!id || id.indexOf("/") > -1)
          return {
            name: "not-found",
            reason: "invalid-detail-id",
            query: query,
          };
        return {
          name: "detail",
          id: id,
          query: query,
        };
      } catch (error) {
        return { name: "not-found", reason: "invalid-detail-id", query: query };
      }
    }
    if (path === "alerts") return { name: "alerts", query: query };
    if (path === "overview") return { name: "overview", query: query };
    return {
      name: "not-found",
      reason: "unknown-route",
      path: path,
      query: query,
    };
  }

  function setAlertsHash(changes) {
    var values = normalizeFilters(Object.assign({}, state.filters, changes || {}));
    var params = new URLSearchParams();
    Object.keys(DEFAULT_FILTERS).forEach(function (key) {
      if (key === "startDate" || key === "endDate") params.set(key, values[key]);
      else if (values[key] && values[key] !== "all" && values[key] !== "newest")
        params.set(key, values[key]);
    });
    var requestedPage =
      changes && Object.prototype.hasOwnProperty.call(changes, "page")
        ? Number(changes.page)
        : 1;
    var safePage =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.floor(requestedPage)
        : 1;
    params.set("page", String(safePage));
    state.filters = values;
    state.page = safePage;
    state.lastAlertsHash = "#/alerts?" + params.toString();
    if (location.hash === state.lastAlertsHash) render();
    else location.hash = state.lastAlertsHash;
  }

  function syncStateFromRoute(route) {
    if (route.name !== "alerts") return;
    var q = route.query;
    state.filters = normalizeFilters({
      search: q.has("search") ? q.get("search") : DEFAULT_FILTERS.search,
      platform: q.has("platform")
        ? q.get("platform")
        : DEFAULT_FILTERS.platform,
      risk: q.has("risk") ? q.get("risk") : DEFAULT_FILTERS.risk,
      status: q.has("status") ? q.get("status") : DEFAULT_FILTERS.status,
      sort: q.has("sort") ? q.get("sort") : DEFAULT_FILTERS.sort,
      startDate: q.has("startDate")
        ? q.get("startDate")
        : DEFAULT_FILTERS.startDate,
      endDate: q.has("endDate") ? q.get("endDate") : DEFAULT_FILTERS.endDate,
    });
    var requestedPage = Number(q.get("page") || 1);
    state.page =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.floor(requestedPage)
        : 1;
    state.lastAlertsHash = location.hash || "#/alerts";
  }

  function updateClock() {
    var now = new Date();
    var time = now.toLocaleTimeString("zh-CN", { hour12: false });
    var date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    var dayNames = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    var timeEl = document.getElementById("current-time");
    var dateEl = document.getElementById("current-date");
    var weekEl = document.getElementById("current-week");
    if (timeEl) timeEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
    if (weekEl) weekEl.textContent = dayNames[now.getDay()];
  }

  function formatRefreshTime() {
    return state.lastUpdated.toLocaleTimeString("zh-CN", { hour12: false });
  }

  function showToast(message, tone) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "toast show " + (tone || "");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toast.className = "toast";
    }, 2800);
  }

  function metricCard(iconName, label, value, options) {
    var opts = options || {};
    var displayValue = typeof value === "number" ? formatNumber(value) : value;
    return (
      '<article class="metric-card ' +
      (opts.tone || "") +
      '">' +
      '<div class="metric-icon">' +
      icon(iconName, 26) +
      "</div>" +
      '<div class="metric-copy"><span>' +
      escapeHtml(label) +
      "</span><strong>" +
      escapeHtml(displayValue) +
      "</strong>" +
      (opts.note ? "<small>" + escapeHtml(opts.note) + "</small>" : "") +
      (opts.trend ? trend(opts.trend, opts.trendTone) : "") +
      "</div></article>"
    );
  }

  function renderOverview() {
    var totals = data.totals || {};
    var summary = data.alertSummary || {};
    var pendingSummary = summary.pending || {};
    var discoveredSummary = summary.newlyDiscovered || {};
    var reviewSummary = summary.manualReview || {};
    var handledValue =
      data.statusCounts && data.statusCounts["已处置"] != null
        ? data.statusCounts["已处置"]
        : totals.handled;
    var categoryStops = [];
    var cursor = 0;
    data.categories.forEach(function (item) {
      categoryStops.push(
        item.color + " " + cursor + "% " + (cursor + item.percent) + "%",
      );
      cursor += item.percent;
    });
    var latest = data.alerts
      .filter(function (item) {
        return item.level === "高危";
      })
      .sort(function (a, b) {
        return b.time.localeCompare(a.time);
      })
      .slice(0, 5);
    var accountRows = data.accounts
      .map(function (item) {
        return (
          '<div class="account-row"><img class="avatar" src="' +
          escapeHtml(item[4]) +
          '" alt="' +
          escapeHtml(item[0]) +
          '头像" loading="lazy"><strong>' +
          escapeHtml(item[0]) +
          '</strong><span class="account-stat"><small>粉丝数</small>' +
          escapeHtml(item[1]) +
          '</span><span class="account-stat"><small>作品数</small>' +
          escapeHtml(item[2]) +
          "</span></div>"
        );
      })
      .join("");
    var latestRows = latest
      .map(function (item) {
        var displayTime =
          item.time.length > 5 ? item.time.slice(11, 16) : item.time;
        return (
          '<button class="latest-row" type="button" data-action="open-detail" data-id="' +
          escapeHtml(item.id) +
          '">' +
          '<img class="latest-thumbnail" src="' +
          escapeHtml(assetUrl(item.image)) +
          '" alt="" loading="lazy"><span class="latest-copy"><strong>' +
          escapeHtml(item.title) +
          "</strong></span>" +
          platformIcon(item.platformKey, item.platform) +
          '<time class="latest-time">' +
          escapeHtml(displayTime) +
          "</time></button>"
        );
      })
      .join("");
    var topRisks = data.topRisks
      .map(function (item) {
        return (
          '<div class="top-risk-card"><strong style="color:' +
          item.color +
          '">' +
          escapeHtml(item.label) +
          '</strong><b style="color:' +
          item.color +
          '">' +
          escapeHtml(formatNumber(item.value)) +
          "</b>" +
          trend(item.trend, "danger") +
          "</div>"
        );
      })
      .join("");
    var warningTypes = data.warningTypes
      .map(function (item) {
        return (
          '<article class="warning-type-card"><span class="warning-type-icon">' +
          icon(item.icon, 30) +
          "</span><strong>" +
          escapeHtml(item.label) +
          "</strong><b>" +
          escapeHtml(formatNumber(item.value)) +
          "</b>" +
          trend(item.trend) +
          "<small>较昨日</small></article>"
        );
      })
      .join("");
    var mapSources = [
      ["wechat", "微信", "platform-wechat"],
      ["weibo", "微博", "platform-weibo"],
      ["douyin", "抖音", "platform-douyin"],
      ["kuaishou", "快手", "platform-kuaishou"],
      ["rednote", "小红书", "platform-rednote"],
      ["all", "更多平台", "platform-more"],
    ]
      .map(function (source) {
        var sourceMeta = platformMeta[source[0]];
        var imagePath =
          source[0] === "all"
            ? "assets/platform-more.png"
            : sourceMeta && sourceMeta.image;
        var graphic = imagePath
          ? '<img src="' + escapeHtml(imagePath) + '" alt="">'
          : "<b>" + escapeHtml(sourceMeta ? sourceMeta.mark : "平") + "</b>";
        return (
          '<button type="button" class="map-source ' +
          source[2] +
          '" data-action="platform-filter" data-platform="' +
          source[0] +
          '">' +
          graphic +
          "<span>" +
          source[1] +
          "</span></button>"
        );
      })
      .join("");
    var legend = data.categories
      .map(function (item) {
        return (
          '<span><i style="background:' +
          item.color +
          '"></i>' +
          escapeHtml(item.label) +
          "</span>"
        );
      })
      .join("");

    return [
      '<div class="page page-overview"><section class="overview-grid"><div class="overview-left">',
      '<section class="panel monitor-panel"><div class="panel-heading"><div><span class="eyebrow">TODAY · MONITORING</span><h1>今日监测概况</h1></div><button class="text-button" type="button" data-action="show-refresh">数据实时更新 ',
      icon("refresh-cw", 15),
      '</button></div><div class="metric-grid">',
      metricCard("user-round", "累计监测作者数量", totals.authors),
      metricCard("file-text", "累计监测作品数量", totals.works),
      metricCard("user-pen", "今日累计监测作者数量", totals.todayAuthors, {
        note: "较昨日",
        trend: "12.7%",
      }),
      metricCard("scan-search", "今日累计监测作品数量", totals.todayWorks, {
        note: "较昨日",
        trend: "18.6%",
      }),
      metricCard(
        "triangle-alert",
        pendingSummary.label || "待处置预警",
        pendingSummary.value != null ? pendingSummary.value : totals.pending,
        {
        note: "较昨日",
        trend: pendingSummary.trend || "2.3%",
        tone: "metric-danger",
        trendTone: "danger",
        },
      ),
      metricCard(
        "bell",
        discoveredSummary.label || "24小时内新发现",
        discoveredSummary.value != null
          ? discoveredSummary.value
          : totals.newAlerts,
        {
          note: "较昨日",
          trend: discoveredSummary.trend || "5.9%",
          tone: "metric-warning",
        },
      ),
      metricCard("shield-check", "已处置预警", handledValue, {
        note: "较昨日",
        trend: "3.7%",
        tone: "metric-success",
      }),
      metricCard(
        "user-pen",
        reviewSummary.label || "待人工审核",
        reviewSummary.value != null ? reviewSummary.value : totals.manualReview,
        {
        note: "较昨日",
        trend: reviewSummary.trend || "2.1%",
        tone: "metric-orange",
        },
      ),
      "</div></section>",
      '<section class="panel distribution-panel"><div class="panel-heading"><div><span class="eyebrow">RISK DOMAIN</span><h2>失范领域分布图</h2></div><button class="icon-button" type="button" data-action="show-refresh" aria-label="刷新分布图">',
      icon("refresh-cw", 18),
      "</button></div>",
      '<div class="distribution-content"><div class="donut" style="background:conic-gradient(',
      categoryStops.join(","),
      ')"><div><strong>总数</strong><b>',
      formatNumber(data.totalAlerts),
      '</b><small>监测窗口预警</small></div></div><div class="distribution-legend">',
      data.categories
        .map(function (item) {
          return (
            '<button type="button" data-action="risk-filter" data-risk="' +
            item.key +
            '"><i style="background:' +
            item.color +
            '"></i><span>' +
            escapeHtml(item.label) +
            "</span><b>" +
            formatNumber(item.value) +
            "</b><small>(" +
            item.percent +
            "%)</small></button>"
          );
        })
        .join(""),
      "</div></div></section></div>",
      '<div class="overview-center"><section class="panel map-panel"><div class="map-heading"><div><span class="eyebrow">NATIONAL RISK SENSE</span><h2>全国风险态势感知</h2></div><span class="live-dot"><i></i>实时</span></div>',
      '<div class="map-stage"><div class="map-source-rail">',
      mapSources,
      '</div><div class="map-image-wrap"><img src="assets/china-map-clean.png" alt="全国风险态势示意图"><button class="map-marker marker-beijing" type="button" data-action="map-marker" data-label="北京：高危预警 248 条" aria-label="北京风险点"></button><button class="map-marker marker-shanghai" type="button" data-action="map-marker" data-label="上海：高危预警 176 条" aria-label="上海风险点"></button><button class="map-marker marker-sichuan" type="button" data-action="map-marker" data-label="四川：高危预警 132 条" aria-label="四川风险点"></button></div></div>',
      '<div class="map-legend"><strong>失范领域：</strong>',
      legend,
      "</div></section>",
      '<section class="panel warning-panel"><div class="panel-heading"><div><span class="eyebrow">ALERT TYPES</span><h2>价值失范预警</h2></div><button class="text-button" type="button" data-action="go-alerts">查看全部 ',
      icon("chevron-right", 15),
      '</button></div><div class="warning-type-grid">',
      warningTypes,
      "</div></section></div>",
      '<div class="overview-right"><section class="panel top-risks-panel"><div class="panel-heading"><div><span class="eyebrow">TOP RISK TYPES</span><h2>高发失范类别</h2></div><button class="text-button" type="button" data-action="go-alerts">更多 ',
      icon("chevron-right", 15),
      '</button></div><h3>TOP3 失范类别</h3><div class="top-risk-grid">',
      topRisks,
      "</div></section>",
      '<section class="panel latest-panel"><div class="panel-heading"><div><span class="eyebrow">LATEST HIGH RISK</span><h2>最新高危预警</h2></div><button class="text-button" type="button" data-action="go-alerts">更多 ',
      icon("chevron-right", 15),
      '</button></div><div class="latest-list">',
      latestRows,
      "</div></section>",
      '<section class="panel accounts-panel"><div class="panel-heading"><div><span class="eyebrow">WATCH LIST</span><h2>重点账号关注</h2></div><button class="text-button" type="button" data-action="nav-placeholder" data-label="重点账号">更多 ',
      icon("chevron-right", 15),
      '</button></div><div class="account-list">',
      accountRows,
      "</div></section></div>",
      "</section></div>",
    ].join("");
  }

  function filterAlerts() {
    var f = normalizeFilters(state.filters);
    state.filters = f;
    var list = data.alerts.filter(function (item) {
      var needle = f.search.trim().toLowerCase();
      var itemDate = item.time.slice(0, 10);
      var matchesSearch =
        !needle ||
        [item.title, item.summary, item.account, item.id]
          .join(" ")
          .toLowerCase()
          .indexOf(needle) > -1;
      var matchesPlatform =
        f.platform === "all" || item.platformKey === f.platform;
      var matchesRisk = f.risk === "all" || item.riskKey === f.risk;
      var matchesStatus = f.status === "all" || item.status === f.status;
      var matchesDate =
        (!f.startDate || itemDate >= f.startDate) &&
        (!f.endDate || itemDate <= f.endDate);
      return (
        matchesSearch &&
        matchesPlatform &&
        matchesRisk &&
        matchesStatus &&
        matchesDate
      );
    });
    if (f.sort === "confidence")
      list.sort(function (a, b) {
        return b.confidence - a.confidence;
      });
    else if (f.sort === "oldest")
      list.sort(function (a, b) {
        return a.time.localeCompare(b.time);
      });
    else
      list.sort(function (a, b) {
        return b.time.localeCompare(a.time);
      });
    return list;
  }

  function alertSummaryCard(iconName, label, value, trendValue, tone) {
    return (
      '<article class="alert-summary-card ' +
      (tone || "") +
      '"><span class="summary-icon">' +
      icon(iconName, 28) +
      "</span><div><span>" +
      escapeHtml(label) +
      "</span><strong>" +
      escapeHtml(formatNumber(value)) +
      "</strong><small>较昨日 " +
      trend(trendValue, tone === "danger" ? "danger" : "up") +
      "</small></div></article>"
    );
  }

  function renderKeywordCloud() {
    return data.keywords
      .map(function (item, index) {
        var size = 13 + Math.round(item[1] / 9);
        var color =
          index % 5 === 0
            ? "keyword-hot"
            : index % 3 === 0
              ? "keyword-mid"
              : "";
        return (
          '<button type="button" class="keyword ' +
          color +
          '" style="font-size:' +
          size +
          'px" data-action="keyword-search" data-keyword="' +
          escapeHtml(item[0]) +
          '">' +
          escapeHtml(item[0]) +
          "</button>"
        );
      })
      .join("");
  }

  function renderAlertsTable(list) {
    if (!list.length)
      return (
        '<div class="empty-state"><span>' +
        icon("search", 30) +
        '</span><strong>没有匹配的预警记录</strong><p>调整筛选条件后再试，或恢复全部记录。</p><button class="button secondary" type="button" data-action="reset-filters">恢复全部</button></div>'
      );
    return (
      '<div class="table-scroll"><table class="alerts-table"><thead><tr><th>序号</th><th>等级 / 领域 / 类别</th><th>作品信息</th><th>平台账号</th><th>内容摘要</th><th>发布时间</th><th>传播数据</th><th>处置建议</th><th>处置状态</th><th>操作</th></tr></thead><tbody>' +
      list
        .map(function (item, index) {
          var spread = item.spread
            .map(function (entry) {
              return (
                "<span>" +
                escapeHtml(entry[0]) +
                " <b>" +
                escapeHtml(entry[1]) +
                "</b></span>"
              );
            })
            .join("");
          return (
            '<tr><td><span class="row-index">' +
            (index + 1 + (state.page - 1) * state.pageSize) +
            '</span></td><td><div class="risk-cell"><b class="risk-level risk-level-' +
            escapeHtml(item.level === "高危" ? "high" : "medium") +
            '">' +
            escapeHtml(item.level) +
            "</b>" +
            riskDot(item.riskKey, item.risk) +
            "<small>" +
            escapeHtml(item.categoryLabel) +
            '</small></div></td><td><div class="work-cell"><img src="' +
            escapeHtml(assetUrl(item.image)) +
            '" alt="' +
            escapeHtml(item.title) +
            '"><div><strong>' +
            escapeHtml(item.title) +
            "</strong><small>" +
            escapeHtml(item.media) +
            '</small></div></div></td><td><div class="platform-account">' +
            platformBadge(item.platformKey, item.platform) +
            "<strong>" +
            escapeHtml(item.account) +
            "</strong><small>粉丝：" +
            escapeHtml(item.followers) +
            " · ID: " +
            escapeHtml(item.accountId) +
            '</small></div></td><td><p class="summary-cell">' +
            escapeHtml(item.summary) +
            "</p></td><td><time>" +
            escapeHtml(item.time.slice(0, 10)) +
            "<br>" +
            escapeHtml(item.time.slice(11)) +
            '</time></td><td><div class="spread-cell">' +
            spread +
            '</div></td><td><strong class="suggestion suggestion-' +
            (item.suggestion === "彻底清理" ? "danger" : "warning") +
            '">' +
            escapeHtml(item.suggestion) +
            '</strong></td><td><span class="status status-' +
            (item.status === "已处置" || item.status === "已通过"
              ? "done"
              : item.status === "整改中"
                ? "progress"
                : "pending") +
            '">' +
            escapeHtml(item.status) +
            '</span></td><td><div class="row-actions"><button class="link-button" type="button" data-action="open-detail" data-id="' +
            escapeHtml(item.id) +
            '">查看详情</button><button class="subtle-link" type="button" data-action="mark-item" data-id="' +
            escapeHtml(item.id) +
            '">标记 <span aria-hidden="true">|</span> 加入黑名单</button></div></td></tr>'
          );
        })
        .join("") +
      "</tbody></table></div>"
    );
  }

  function renderAlerts() {
    var invalidDateRange =
      state.filters.startDate &&
      state.filters.endDate &&
      state.filters.startDate > state.filters.endDate;
    var list = invalidDateRange ? [] : filterAlerts();
    var totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    var pageList = list.slice(
      (state.page - 1) * state.pageSize,
      state.page * state.pageSize,
    );
    var pageButtons = "";
    for (var p = 1; p <= totalPages; p += 1)
      pageButtons +=
        '<button type="button" class="page-number ' +
        (p === state.page ? "active" : "") +
        '" data-action="page" data-page="' +
        p +
        '">' +
        p +
        "</button>";
    var statusTabs = [
      ["all", "全部", data.totalAlerts],
      ["待处置", "待处置", data.statusCounts["待处置"]],
      ["待人工审核", "待人工审核", data.statusCounts["待人工审核"]],
      ["整改中", "整改中", data.statusCounts["整改中"]],
      ["已通过", "已通过", data.statusCounts["已通过"]],
      ["已处置", "已处置", data.statusCounts["已处置"]],
    ]
      .map(function (tab) {
        return (
          '<button class="alert-tab ' +
          (state.filters.status === tab[0] ? "active" : "") +
          '" type="button" data-action="status-tab" data-status="' +
          tab[0] +
          '">' +
          tab[1] +
          " <span>(" +
          formatNumber(tab[2]) +
          ")</span></button>"
        );
      })
      .join("");
    var summary = data.alertSummary;
    var tableMarkup = invalidDateRange
      ? '<div class="empty-state"><span>' +
        icon("calendar", 30) +
        '</span><strong>日期范围无效</strong><p>开始日期不能晚于结束日期。</p><button class="button secondary" type="button" data-action="reset-filters">恢复默认范围</button></div>'
      : renderAlertsTable(pageList);
    return (
      '<div class="page page-alerts"><div class="alerts-top-grid"><section class="panel alert-summary-panel"><div class="section-title-line"><div><span class="eyebrow">REAL-TIME MONITORING</span><h1>实时预警</h1></div><span class="updated-label"><i></i>最后更新 ' +
      formatRefreshTime() +
      '</span></div><div class="alert-summary-grid">' +
      alertSummaryCard(
        "bell",
        summary.pending.label,
        summary.pending.value,
        summary.pending.trend,
        summary.pending.tone,
      ) +
      alertSummaryCard(
        "shield-alert",
        summary.newlyDiscovered.label,
        summary.newlyDiscovered.value,
        summary.newlyDiscovered.trend,
        summary.newlyDiscovered.tone,
      ) +
      alertSummaryCard(
        "shield-check",
        summary.completedToday.label,
        summary.completedToday.value,
        summary.completedToday.trend,
        summary.completedToday.tone,
      ) +
      alertSummaryCard(
        "file-text",
        summary.manualReview.label,
        summary.manualReview.value,
        summary.manualReview.trend,
        summary.manualReview.tone,
      ) +
      '</div></section><section class="panel keyword-panel"><div class="section-title-line"><div><span class="eyebrow">KEYWORD EXTRACTION</span><h2>关键词云 <small>（危害作品提取）</small></h2></div><span class="keyword-count">15 个高频词</span></div><div class="keyword-cloud">' +
      renderKeywordCloud() +
      '</div></section></div><section class="panel filter-panel"><form class="filter-form" id="filter-form"><label class="search-field"><span class="sr-only">内容关键词</span><input id="filter-search" name="search" value="' +
      escapeHtml(state.filters.search) +
      '" placeholder="请输入内容关键词"><button type="submit" aria-label="搜索">' +
      icon("search", 19) +
      '</button></label><label class="filter-select"><span>平台</span><select name="platform"><option value="all">全部</option>' +
      Object.keys(platformMeta)
        .map(function (key) {
          return (
            '<option value="' +
            key +
            '" ' +
            (state.filters.platform === key ? "selected" : "") +
            ">" +
            platformMeta[key].label +
            "</option>"
          );
        })
        .join("") +
      '</select></label><label class="filter-select"><span>发布时间</span><select name="sort"><option value="newest" ' +
      (state.filters.sort === "newest" ? "selected" : "") +
      '>最新发布</option><option value="oldest" ' +
      (state.filters.sort === "oldest" ? "selected" : "") +
      '>最早发布</option><option value="confidence" ' +
      (state.filters.sort === "confidence" ? "selected" : "") +
      '>模型置信度</option></select></label><label class="filter-select"><span>失范领域</span><select name="risk"><option value="all">全部</option>' +
      data.categories
        .map(function (item) {
          return (
            '<option value="' +
            item.key +
            '" ' +
            (state.filters.risk === item.key ? "selected" : "") +
            ">" +
            item.label +
            "</option>"
          );
        })
        .join("") +
      '</select></label><label class="filter-select"><span>处置状态</span><select name="status"><option value="all" ' +
      (state.filters.status === "all" ? "selected" : "") +
      '>全部</option><option value="待处置" ' +
      (state.filters.status === "待处置" ? "selected" : "") +
      '>待处置</option><option value="待人工审核" ' +
      (state.filters.status === "待人工审核" ? "selected" : "") +
      '>待人工审核</option><option value="整改中" ' +
      (state.filters.status === "整改中" ? "selected" : "") +
      '>整改中</option><option value="已通过" ' +
      (state.filters.status === "已通过" ? "selected" : "") +
      '>已通过</option><option value="已处置" ' +
      (state.filters.status === "已处置" ? "selected" : "") +
      '>已处置</option></select></label><div class="date-range"><span>时间范围</span><input type="date" name="startDate" value="' +
      escapeHtml(state.filters.startDate) +
      '" max="' +
      escapeHtml(state.filters.endDate) +
      '" aria-label="开始日期"><i>至</i><input type="date" name="endDate" value="' +
      escapeHtml(state.filters.endDate) +
      '" min="' +
      escapeHtml(state.filters.startDate) +
      '" aria-label="结束日期"></div><div class="filter-actions"><button class="button secondary" type="button" data-action="reset-filters">重置</button><button class="button primary" type="submit">搜索 ' +
      icon("search", 16) +
      '</button></div></form></section><section class="panel table-panel"><div class="table-tabs">' +
      statusTabs +
      "</div>" +
      tableMarkup +
      '<div class="table-footer"><span>全量统计 <b>' +
      formatNumber(data.totalAlerts) +
      "</b> 条 · 当前筛选展示 " +
      list.length +
      ' 条示例数据</span><div class="pagination"><button type="button" class="page-number" data-action="page" data-page="prev" aria-label="上一页">' +
      icon("chevron-left", 16) +
      "</button>" +
      pageButtons +
      '<button type="button" class="page-number" data-action="page" data-page="next" aria-label="下一页">' +
      icon("chevron-right", 16) +
      "</button></div><span>数据每10秒自动刷新 · 最后更新 " +
      formatRefreshTime() +
      ' <button class="icon-button" type="button" data-action="show-refresh" aria-label="刷新">' +
      icon("refresh-cw", 17) +
      "</button></span></div></section></div>"
    );
  }

  function findDetailProfile(id) {
    var profiles = data.caseDetails || data.detailProfiles;
    var profile = null;
    if (Array.isArray(profiles)) {
      profile = profiles.find(function (entry) {
        return entry && entry.id === id;
      });
    } else if (profiles && typeof profiles === "object") {
      profile = profiles[id];
    }
    if (!profile && data.detail && data.detail.id === id) profile = data.detail;
    return profile && typeof profile === "object" ? profile : {};
  }

  function formatConfidence(value) {
    var numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric.toFixed(1) + "%";
    var text = String(value == null ? "" : value);
    return /%$/.test(text) ? text : text + "%";
  }

  function getDetail(id) {
    var item = data.alerts.find(function (entry) {
      return entry.id === id;
    });
    if (!item) return null;

    var profile = findDetailProfile(id);
    var saved = state.draft[id] || {};
    var defaultRules = [item.categoryLabel || item.category, item.risk].filter(
      function (value, index, values) {
        return value && values.indexOf(value) === index;
      },
    );
    var defaults = {
      originalText: item.title + "\n\n" + item.summary,
      conclusion: item.summary,
      logicSummary: item.summary,
      judgments: [
        { label: item.category, tone: "danger", icon: "shield-alert" },
        { label: item.risk, tone: "warning", icon: "circle-alert" },
      ],
      evidence: [
        ["标题与内容摘要出现“" + item.category + "”相关风险特征", "标题/正文"],
        ["传播数据达到预警监测阈值，存在继续扩散的可能", "传播数据"],
        ["建议结合完整上下文与平台规则进行人工复核", "研判建议"],
      ],
      rules: defaultRules,
      similar: [],
    };
    var detail = Object.assign({}, defaults, profile, {
      id: item.id,
      categoryCode: item.categoryCode,
      category: item.category,
      categoryLabel: item.categoryLabel,
      risk: item.risk,
      riskKey: item.riskKey,
      level: item.level,
      confidence: formatConfidence(item.confidence),
      status: item.status,
      suggestion: item.suggestion,
      time: item.time,
      platformKey: item.platformKey,
      platform: item.platform,
      image: item.image,
      title: item.title,
      summary: item.summary,
      media: item.media,
      account: item.account.replace(/^@/, ""),
      accountId: item.accountId,
      fans: item.followers,
      likes: item.spread[0] ? item.spread[0][1] : "—",
      primaryMetricLabel: item.spread[0] ? item.spread[0][0] : "传播量",
      primaryMetricValue: item.spread[0] ? item.spread[0][1] : "—",
      spread: Array.isArray(item.spread) ? item.spread : [],
      spreadGrowth: Array.isArray(item.spreadGrowth) ? item.spreadGrowth : [],
      sourceItem: item,
      judgment: saved.judgment || "确认失范",
      opinion: saved.opinion || "",
    });

    detail.originalText = detail.originalText || detail.copy || defaults.originalText;
    detail.conclusion = detail.conclusion || detail.analysis || defaults.conclusion;
    detail.logicSummary =
      profile.logicSummary ||
      profile.logic ||
      profile.analysisSummary ||
      detail.logicSummary ||
      detail.conclusion;
    detail.judgments =
      Array.isArray(detail.judgments) && detail.judgments.length
        ? detail.judgments
        : defaults.judgments;
    detail.evidence =
      Array.isArray(detail.evidence) && detail.evidence.length
        ? detail.evidence
        : Array.isArray(detail.keyEvidence) && detail.keyEvidence.length
          ? detail.keyEvidence
          : defaults.evidence;
    detail.rules =
      state.detailRules[id] ||
      (Array.isArray(detail.rules) && detail.rules.length
        ? detail.rules.slice()
        : defaults.rules.slice());
    detail.similar = Array.isArray(detail.similar) ? detail.similar : [];
    return detail;
  }

  function renderRouteError(route) {
    var invalidDetail =
      route &&
      (route.reason === "invalid-detail-id" ||
        route.reason === "missing-detail-id");
    var title = invalidDetail ? "预警地址无效" : "页面不存在";
    var message = invalidDetail
      ? "该详情地址无法解析，请返回预警列表重新选择记录。"
      : "当前地址不存在，可能已被移动或删除。";
    return (
      '<div class="page page-route-error"><section class="panel route-error"><span>' +
      icon("circle-alert", 34) +
      "</span><strong>" +
      title +
      "</strong><p>" +
      message +
      '</p><div><button class="button secondary" type="button" data-action="go-alerts">返回预警列表</button><a class="button primary" href="#/overview">返回系统总览</a></div></section></div>'
    );
  }

  function renderMissingDetail(id) {
    return (
      '<div class="page page-route-error"><section class="panel route-error"><span>' +
      icon("search", 34) +
      "</span><strong>未找到预警</strong><p>编号 " +
      escapeHtml(id) +
      ' 不存在或已被移除。</p><div><button class="button primary" type="button" data-action="go-alerts">返回预警列表</button></div></section></div>'
    );
  }

  function ruleTags(detail) {
    return (detail.rules || [])
      .map(function (rule, index) {
        return (
          '<span class="rule-tag">' +
          escapeHtml(rule) +
          '<button type="button" data-action="remove-rule" data-index="' +
          index +
          '" aria-label="移除' +
          escapeHtml(rule) +
          '">' +
          icon("x", 12) +
          "</button></span>"
        );
      })
      .join("");
  }

  function findAlertById(id) {
    return data.alerts.find(function (entry) {
      return entry.id === id;
    });
  }

  function similarityText(value, index) {
    var numeric = Number(value);
    if (Number.isFinite(numeric)) {
      if (numeric <= 1) numeric *= 100;
      return numeric.toFixed(numeric % 1 ? 1 : 0) + "%";
    }
    if (typeof value === "string" && value) return /%$/.test(value) ? value : value + "%";
    return String(Math.max(72, 92 - index * 4)) + "%";
  }

  function getSimilarAlerts(detail) {
    var selected = [];
    var usedIds = [detail.id];
    var configuredSimilar = (detail.similar || []).slice();
    (detail.relatedIds || []).forEach(function (id) {
      configuredSimilar.push({ id: id });
    });
    configuredSimilar.forEach(function (entry, index) {
      var configured = Array.isArray(entry)
        ? { id: entry[4] || entry[0], similarity: entry[2] }
        : entry || {};
      var target = findAlertById(configured.id || configured.alertId);
      if (!target || usedIds.indexOf(target.id) > -1) return;
      usedIds.push(target.id);
      selected.push({
        item: target,
        similarity: similarityText(configured.similarity || configured.score, index),
      });
    });

    var candidates = data.alerts
      .filter(function (entry) {
        return usedIds.indexOf(entry.id) === -1;
      })
      .sort(function (left, right) {
        var leftScore =
          (left.categoryCode === detail.categoryCode ? 2 : 0) +
          (left.riskKey === detail.riskKey ? 1 : 0);
        var rightScore =
          (right.categoryCode === detail.categoryCode ? 2 : 0) +
          (right.riskKey === detail.riskKey ? 1 : 0);
        if (rightScore !== leftScore) return rightScore - leftScore;
        return right.time.localeCompare(left.time);
      });
    candidates.some(function (target) {
      if (selected.length >= 4) return true;
      selected.push({
        item: target,
        similarity: similarityText(null, selected.length),
      });
      return false;
    });
    return selected;
  }

  function formatLogTime(value, offsetSeconds) {
    var match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value || "");
    if (!match) return value || "—";
    var stamp = Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
    );
    var date = new Date(stamp + offsetSeconds * 1000);
    function pad(number) {
      return String(number).padStart(2, "0");
    }
    return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join("-") +
      " " +
      [pad(date.getUTCHours()), pad(date.getUTCMinutes()), pad(date.getUTCSeconds())].join(":");
  }

  function getDetailLogs(detail) {
    return [
      [
        formatLogTime(detail.time, 80),
        "创建研判记录",
        "研判员（当前）",
        "人工研判",
        detail.status,
        "来源：自动预警",
      ],
      [
        formatLogTime(detail.time, 34),
        "触发人工研判流程",
        "系统",
        "流程引擎",
        "待研判",
        "模型置信度：" + detail.confidence,
      ],
      [
        formatLogTime(detail.time, 5),
        "生成AI预警",
        "系统",
        "模型服务",
        detail.level,
        "内容标签：" + detail.categoryLabel,
      ],
      [
        formatLogTime(detail.time, 0),
        "获取平台数据",
        "系统",
        "数据引擎",
        "成功",
        "平台：" + detail.platform,
      ],
      [
        formatLogTime(detail.time, -8),
        "发现内容",
        "系统",
        "内容中心",
        "已入库",
        "匹配类别：" + detail.categoryLabel,
      ],
    ];
  }

  function renderDetail(route) {
    var detail = getDetail(route.id);
    if (!detail) return renderMissingDetail(route.id);
    var item = detail.sourceItem;
    var similar = getSimilarAlerts(detail)
      .map(function (row) {
        var target = row.item;
        return (
          '<button class="similar-row" type="button" data-action="open-detail" data-id="' +
          escapeHtml(target.id) +
          '"><strong>' +
          escapeHtml(target.title) +
          "</strong><span>平台：" +
          escapeHtml(target.platform) +
          "</span><span>相似度：<b>" +
          escapeHtml(row.similarity) +
          "</b></span><span>处置：" +
          escapeHtml(target.suggestion) +
          "</span>" +
          icon("chevron-right", 17) +
          "</button>"
        );
      })
      .join("");
    var evidence = (detail.evidence || [])
      .map(function (row) {
        var text = Array.isArray(row) ? row[0] : row.text || row.label || row.content;
        var marker = Array.isArray(row) ? row[1] : row.time || row.source || row.location;
        return (
          "<li><span>" +
          escapeHtml(text) +
          "</span><time>" +
          escapeHtml(marker) +
          "</time></li>"
        );
      })
      .join("");
    var logs = getDetailLogs(detail);
    var logRows = logs
      .map(function (row) {
        return (
          "<tr>" +
          row
            .map(function (cell) {
              return "<td>" + escapeHtml(cell) + "</td>";
            })
            .join("") +
          "</tr>"
        );
      })
      .join("");
    var spreadEntries = detail.spread || (item ? item.spread : []);
    var spreadGrowth = detail.spreadGrowth || (item ? item.spreadGrowth : []);
    var spreadMarkup = spreadEntries
      .map(function (entry, index) {
        var growth = Number(spreadGrowth[index]);
        var displayGrowth = Number.isFinite(growth) ? growth.toFixed(1) : "0.0";
        return (
          "<span><small>" +
          escapeHtml(entry[0]) +
          "</small><b>" +
          escapeHtml(entry[1]) +
          "</b><em>↑ " +
          displayGrowth +
          "%</em></span>"
        );
      })
      .join("");
    return (
      '<div class="page page-detail"><div class="detail-toolbar"><div class="breadcrumb"><button type="button" class="breadcrumb-link" data-action="go-alerts">研判中心</button><span>›</span><strong>预警详情</strong></div><div class="detail-title-row"><div><span class="eyebrow">ALERT DETAIL</span><h1>预警详情</h1></div><div class="detail-meta"><span><small>预警编号</small><b>' +
      escapeHtml(detail.id) +
      '</b></span><span class="meta-danger"><small>失范类别</small><b>' +
      icon("triangle-alert", 17) +
      escapeHtml(detail.categoryLabel || detail.category) +
      "</b></span><span><small>模型置信度</small><b>" +
      escapeHtml(detail.confidence) +
      '</b></span><span class="meta-warning"><small>处置状态</small><b>◇ ' +
      escapeHtml(detail.status) +
      "</b></span><span><small>发布时间</small><b>" +
      escapeHtml(detail.time) +
      "</b></span><span><small>平台</small><b>" +
      platformBadge(detail.platformKey || (item ? item.platformKey : "douyin"), detail.platform) +
      '</b></span></div><div class="detail-actions"><button class="button secondary" type="button" data-action="go-alerts">' +
      icon("arrow-left", 16) +
      ' 返回列表</button><button class="button primary" type="button" data-action="export-report">' +
      icon("download", 16) +
      ' 导出报告</button></div></div></div><div class="detail-grid"><div class="detail-left"><section class="panel original-panel"><div class="panel-heading"><h2>原始作品</h2><span class="source-pill">' +
      escapeHtml(detail.media || "内容截图") +
      '</span></div><div class="original-media"><img src="' +
      escapeHtml(assetUrl(detail.image)) +
      '" alt="' +
      escapeHtml(detail.imageAlt || detail.title + " 原始作品截图") +
      '"></div><div class="transcript"><div class="subheading"><strong>作品标题</strong></div><p>' +
      escapeHtml(detail.title) +
      '</p><div class="subheading"><strong>案例简介</strong></div><p>' +
      escapeHtml(detail.introduction || detail.summary) +
      '</p><div class="subheading"><strong>原始文案 / 字幕摘要</strong><button class="icon-text-button" type="button" data-action="copy-text">' +
      icon("copy", 15) +
      ' 复制全部</button></div><p class="original-copy">' +
      escapeHtml(detail.originalText).replace(/\n/g, "<br>") +
      '</p></div></section><section class="panel account-detail-panel"><div class="panel-heading"><h2>账号信息</h2><span class="verified">监测中</span></div><div class="account-hero"><span class="large-avatar">' +
      escapeHtml((detail.account || "自").slice(0, 1)) +
      "</span><div><strong>" +
      escapeHtml(detail.account) +
      "</strong><small>ID: " +
      escapeHtml(detail.accountId) +
      '</small></div></div><div class="account-metrics"><span><small>粉丝数</small><b>' +
      escapeHtml(detail.fans) +
      "</b></span><span><small>" +
      escapeHtml(detail.primaryMetricLabel) +
      "</small><b>" +
      escapeHtml(detail.primaryMetricValue) +
      '</b></span><span><small>处置状态</small><b>' +
      escapeHtml(detail.status) +
      '</b></span><span><small>预警等级</small><b>' +
      escapeHtml(detail.level) +
      '</b></span></div></section><section class="panel spread-detail-panel"><div class="panel-heading"><h2>传播数据</h2><span>截至 ' +
      formatRefreshTime() +
      '</span></div><div class="spread-detail-grid">' +
      spreadMarkup +
      '</div></section></div><div class="detail-middle"><section class="panel ai-panel"><div class="panel-heading"><div><span class="eyebrow">MODEL REVIEW</span><h2>AI失范分析</h2></div><span class="model-chip">V2.07 · 多模态</span></div><div class="conclusion-banner"><span class="banner-icon">' +
      icon("shield-alert", 24) +
      "</span><strong>风险结论</strong><b>" +
      escapeHtml(detail.conclusion) +
      '</b></div><div class="subsection"><h3>关键模型判断</h3><div class="judgment-grid">' +
      detail.judgments
        .map(function (j) {
          var judgment =
            typeof j === "string"
              ? { label: j, tone: "warning", icon: "circle-alert" }
              : j || {};
          return (
            '<div class="judgment-chip ' +
            escapeHtml(judgment.tone || "warning") +
            '">' +
            icon(judgment.icon || "circle-alert", 22) +
            "<strong>" +
            escapeHtml(judgment.label) +
            "</strong></div>"
          );
        })
        .join("") +
      '</div></div><div class="subsection evidence-section"><h3>关键证据</h3><ul class="evidence-list">' +
      evidence +
      '</ul></div><div class="subsection logic-section"><h3>逻辑摘要</h3><div class="logic-copy">' +
      icon("file-text", 24) +
      '<p>' +
      escapeHtml(detail.logicSummary) +
      '</p></div></div></section><section class="panel similar-panel"><div class="panel-heading"><h2>相似案例</h2><span>按相似度排序</span></div><div class="similar-list">' +
      similar +
      '</div></section></div><div class="detail-right"><section class="panel disposition-panel"><div class="panel-heading"><div><span class="eyebrow">HUMAN REVIEW</span><h2>研判与处置</h2></div><span class="required-label">* 必填项</span></div><div class="recommendation-box"><span>' +
      icon("triangle-alert", 28) +
      '</span><strong>' +
      escapeHtml(detail.suggestion) +
      '</strong><small>' +
      escapeHtml(
        detail.recommendationReason ||
          (detail.recommendation && detail.recommendation.note) ||
          detail.dispositionNote ||
          "建议依据对应失范类别与平台规则执行处置",
      ) +
      '</small></div><form id="judgment-form"><fieldset><legend>研判结论 <i>*</i></legend><div class="radio-row"><label><input type="radio" name="judgment" value="确认失范" ' +
      (detail.judgment === "确认失范" ? "checked" : "") +
      '><span>确认失范</span></label><label><input type="radio" name="judgment" value="部分失范" ' +
      (detail.judgment === "部分失范" ? "checked" : "") +
      '><span>部分失范</span></label><label><input type="radio" name="judgment" value="无法判断" ' +
      (detail.judgment === "无法判断" ? "checked" : "") +
      '><span>无法判断</span></label><label><input type="radio" name="judgment" value="模型误报" ' +
      (detail.judgment === "模型误报" ? "checked" : "") +
      '><span>模型误报</span></label></div></fieldset><fieldset><legend>最终关联规则（可多选）<i>*</i></legend><div class="rule-editor"><div class="rule-tags">' +
      ruleTags(detail) +
      '</div><button class="add-rule" type="button" data-action="add-rule">' +
      icon("plus", 14) +
      ' 选择标签</button></div></fieldset><fieldset><legend>研判意见 <i>*</i></legend><div class="textarea-wrap"><textarea id="judgment-opinion" name="opinion" maxlength="500" placeholder="请撰写研判意见（不少于10字）">' +
      escapeHtml(detail.opinion) +
      '</textarea><span id="opinion-count">' +
      String(detail.opinion || "").length +
      '/500</span></div></fieldset><div class="form-actions"><button class="button danger" type="button" data-action="save-suggestion">采纳建议</button><button class="button secondary" type="button" data-action="switch-disposition">切换处置</button><button class="button muted" type="button" data-action="mark-false">判定为误报</button><button class="button primary" type="submit">提交复核 ' +
      icon("send", 15) +
      '</button></div></form></section><section class="panel process-panel"><div class="panel-heading"><h2>复核 / 审批流程</h2><span>提交后自动流转</span></div><div class="process-flow"><div class="process-step active"><span>' +
      icon("user-pen", 20) +
      '</span><strong>研判（当前）</strong><small>等待中</small></div><i></i><div class="process-step"><span>' +
      icon("user-round", 20) +
      '</span><strong>复核</strong><small>资深研判员</small></div><i></i><div class="process-step"><span>' +
      icon("user-round", 20) +
      '</span><strong>审批</strong><small>审核主管</small></div><i></i><div class="process-step"><span>' +
      icon("monitor-check", 20) +
      '</span><strong>执行处置</strong><small>平台执行</small></div></div></section></div></div><section class="panel logs-panel"><div class="panel-heading"><div class="log-tabs"><button class="active" type="button">操作日志</button><button type="button">处置记录</button><button type="button">历史预警</button></div><span>共 5 条</span></div><div class="table-scroll"><table class="logs-table"><thead><tr><th>时间</th><th>操作记录</th><th>操作人</th><th>角色</th><th>结果</th><th>备注</th></tr></thead><tbody>' +
      logRows +
      "</tbody></table></div></section></div>"
    );
  }

  function captureDetailDraft(id) {
    var form = document.getElementById("judgment-form");
    if (!form || typeof form.querySelector !== "function") return;
    var opinionField = form.querySelector('textarea[name="opinion"]');
    var judgmentField = form.querySelector('input[name="judgment"]:checked');
    if (!opinionField && !judgmentField) return;
    var current = state.draft[id] || {};
    state.draft[id] = {
      judgment: judgmentField ? judgmentField.value : current.judgment,
      opinion: opinionField ? opinionField.value : current.opinion || "",
    };
  }

  function refreshData(manual) {
    var route = parseRoute();
    if (route.name === "detail") captureDetailDraft(route.id);
    var latestData = window.APP_DATA;
    if (!latestData || !Array.isArray(latestData.alerts)) {
      if (manual) showToast("数据刷新失败，请稍后重试", "error");
      return;
    }
    data = latestData;
    state.lastUpdated = new Date();
    state.refreshVersion += 1;
    render();
    if (manual) showToast("数据已刷新，更新时间 " + formatRefreshTime());
  }

  function render() {
    var route = parseRoute();
    syncStateFromRoute(route);
    var main = document.getElementById("main-content");
    if (!main) return;
    if (route.name === "overview") main.innerHTML = renderOverview();
    else if (route.name === "alerts") main.innerHTML = renderAlerts();
    else if (route.name === "detail") main.innerHTML = renderDetail(route);
    else main.innerHTML = renderRouteError(route);
    document.querySelectorAll("[data-nav]").forEach(function (nav) {
      var target = nav.getAttribute("data-nav");
      nav.classList.toggle(
        "active",
        target === (route.name === "detail" ? "analysis" : route.name),
      );
    });
    document.body.classList.toggle("menu-open", state.menuOpen);
    document.body.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
    window.hydrateIcons(main);
    window.hydrateIcons(document.querySelector(".topbar"));
    window.hydrateIcons(document.querySelector(".sidebar"));
    if (route.name === "detail") bindOpinionCounter();
  }

  function bindOpinionCounter() {
    var textarea = document.getElementById("judgment-opinion");
    var counter = document.getElementById("opinion-count");
    if (!textarea || !counter) return;
    textarea.addEventListener("input", function () {
      counter.textContent = textarea.value.length + "/500";
    });
  }

  function copyText() {
    var text = document.querySelector(".transcript .original-copy");
    if (!text) return;
    var value = text.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard
        .writeText(value)
        .then(function () {
          showToast("原始文案已复制");
        })
        .catch(function () {
          showToast("复制失败，请手动选择文本", "error");
        });
    else {
      var area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      showToast("原始文案已复制");
    }
  }

  function exportReport() {
    var route = parseRoute();
    var detail = getDetail(route.id);
    if (!detail) {
      showToast("预警不存在，无法导出报告", "error");
      return;
    }
    var lines = [
      "文化产品价值失范综合预警平台",
      "预警编号：" + detail.id,
      "失范类别：" + (detail.categoryLabel || detail.category),
      "模型置信度：" + detail.confidence,
      "发布时间：" + detail.time,
      "平台：" + detail.platform,
      "",
      "风险结论：" + detail.conclusion,
      "关联规则：" + (detail.rules || []).join("、"),
      "研判意见：" + (detail.opinion || "尚未提交"),
    ];
    var blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = detail.id + "-预警报告.txt";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("报告已导出");
  }

  function submitJudgment(event) {
    event.preventDefault();
    var route = parseRoute();
    if (route.name !== "detail" || !getDetail(route.id)) {
      showToast("当前预警不存在，无法提交复核", "error");
      return;
    }
    var form = document.getElementById("judgment-form");
    var opinion = (form.querySelector("textarea") || {}).value || "";
    var judgment =
      (form.querySelector('input[name="judgment"]:checked') || {}).value || "";
    if (!judgment) {
      showToast("请选择研判结论", "error");
      return;
    }
    if (opinion.trim().length < 10) {
      showToast("研判意见不少于 10 个字", "error");
      form.querySelector("textarea").focus();
      return;
    }
    state.draft[route.id] = { judgment: judgment, opinion: opinion };
    try {
      localStorage.setItem("cultural-alert-draft", JSON.stringify(state.draft));
    } catch (e) {
      /* private mode */
    }
    showToast("已提交复核，流程节点已更新");
    setTimeout(function () {
      render();
    }, 500);
  }

  function readFilterForm() {
    var form = document.getElementById("filter-form");
    if (!form) return;
    var formData = new FormData(form);
    var startDate = formData.get("startDate");
    var endDate = formData.get("endDate");
    var nextFilters = normalizeFilters({
      search: formData.get("search") || DEFAULT_FILTERS.search,
      platform: formData.get("platform") || DEFAULT_FILTERS.platform,
      risk: formData.get("risk") || DEFAULT_FILTERS.risk,
      status: formData.get("status") || DEFAULT_FILTERS.status,
      sort: formData.get("sort") || DEFAULT_FILTERS.sort,
      startDate: startDate == null ? DEFAULT_FILTERS.startDate : startDate,
      endDate: endDate == null ? DEFAULT_FILTERS.endDate : endDate,
    });
    if (
      nextFilters.startDate &&
      nextFilters.endDate &&
      nextFilters.startDate > nextFilters.endDate
    ) {
      showToast("开始日期不能晚于结束日期", "error");
      return;
    }
    state.filters = nextFilters;
    setAlertsHash({ page: 1 });
  }

  document.addEventListener("click", function (event) {
    var target =
      event.target && typeof event.target.closest === "function"
        ? event.target.closest("[data-action]")
        : null;
    if (!target) return;
    var action = target.getAttribute("data-action");
    if (action === "toggle-menu") state.menuOpen = !state.menuOpen;
    else if (action === "collapse-menu")
      state.sidebarCollapsed = !state.sidebarCollapsed;
    else if (action === "admin-menu") showToast("管理员菜单暂未开放");
    else if (action === "nav-placeholder")
      showToast(target.getAttribute("data-label") + "模块正在建设中");
    else if (action === "go-alerts")
      location.hash = state.lastAlertsHash || "#/alerts";
    else if (action === "open-detail") {
      if (location.hash.indexOf("#/alerts") === 0)
        state.lastAlertsHash = location.hash;
      location.hash =
        "#/detail/" + encodeURIComponent(target.getAttribute("data-id"));
    } else if (action === "platform-filter")
      setAlertsHash({
        platform: target.getAttribute("data-platform"),
        page: 1,
      });
    else if (action === "risk-filter")
      setAlertsHash({ risk: target.getAttribute("data-risk"), page: 1 });
    else if (action === "keyword-search")
      setAlertsHash({ search: target.getAttribute("data-keyword"), page: 1 });
    else if (action === "status-tab")
      setAlertsHash({ status: target.getAttribute("data-status"), page: 1 });
    else if (action === "page") {
      var list = filterAlerts();
      var pages = Math.max(1, Math.ceil(list.length / state.pageSize));
      var requested = target.getAttribute("data-page");
      var next =
        requested === "prev"
          ? state.page - 1
          : requested === "next"
            ? state.page + 1
            : Number(requested);
      next = Math.min(pages, Math.max(1, next));
      setAlertsHash({ page: next });
    } else if (action === "reset-filters") {
      state.filters = Object.assign({}, DEFAULT_FILTERS);
      setAlertsHash({ page: 1 });
    } else if (action === "show-refresh") {
      refreshData(true);
    } else if (action === "map-marker") {
      showToast(target.getAttribute("data-label"));
    } else if (action === "mark-item") {
      showToast("已标记记录，可在重点账号中查看");
    } else if (action === "copy-text") copyText();
    else if (action === "export-report") exportReport();
    else if (action === "add-rule") {
      var route = parseRoute();
      var currentDetail = getDetail(route.id);
      if (!currentDetail) return;
      var existing = state.detailRules[route.id] || currentDetail.rules.slice();
      if (existing.indexOf("待人工复核") === -1) existing.push("待人工复核");
      state.detailRules[route.id] = existing;
      render();
    } else if (action === "remove-rule") {
      var routeRemove = parseRoute();
      var currentRemoveDetail = getDetail(routeRemove.id);
      if (!currentRemoveDetail) return;
      var rules =
        state.detailRules[routeRemove.id] || currentRemoveDetail.rules.slice();
      var ruleIndex = Number(target.getAttribute("data-index"));
      if (
        !Number.isInteger(ruleIndex) ||
        ruleIndex < 0 ||
        ruleIndex >= rules.length
      )
        return;
      rules.splice(ruleIndex, 1);
      state.detailRules[routeRemove.id] = rules;
      render();
    } else if (action === "save-suggestion") showToast("已采纳系统处置建议");
    else if (action === "switch-disposition")
      showToast("处置方式已切换为限期整改");
    else if (action === "mark-false") showToast("已标记为待确认误报");
    if (action === "toggle-menu" || action === "collapse-menu") render();
  });

  document.addEventListener("submit", function (event) {
    if (event.target.id === "filter-form") {
      event.preventDefault();
      readFilterForm();
    }
    if (event.target.id === "judgment-form") submitJudgment(event);
  });

  window.addEventListener("hashchange", function () {
    state.menuOpen = false;
    render();
  });
  try {
    var storedDraft = JSON.parse(
      localStorage.getItem("cultural-alert-draft") || "{}",
    );
    state.draft =
      storedDraft && typeof storedDraft === "object" && !Array.isArray(storedDraft)
        ? storedDraft
        : {};
  } catch (e) {
    state.draft = {};
  }
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(function () {
    if (document.visibilityState !== "hidden") refreshData(false);
  }, 10000);
  render();
})();
