'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function elementStub() {
  return {
    innerHTML: '',
    innerText: '',
    textContent: '',
    className: '',
    value: '',
    classList: { toggle() {}, add() {}, remove() {} },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {},
    appendChild() {},
    remove() {},
    focus() {},
    select() {},
    click() {}
  };
}

const main = elementStub();
const elements = new Map([['main-content', main]]);
const listeners = {};
const intervals = [];
let nextTimerId = 1;

function addListener(scope, type, handler) {
  const key = scope + ':' + type;
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(handler);
}

function dispatch(scope, type, event) {
  const handlers = listeners[scope + ':' + type] || [];
  handlers.forEach((handler) => handler(event));
}

const documentStub = {
  body: elementStub(),
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, elementStub());
    return elements.get(id);
  },
  querySelectorAll() { return []; },
  querySelector() { return elementStub(); },
  addEventListener(type, handler) { addListener('document', type, handler); },
  createElement() { return elementStub(); },
  execCommand() { return true; }
};

const locationStub = { hash: '#/overview' };
const sandbox = {
  console,
  document: documentStub,
  location: locationStub,
  navigator: {},
  localStorage: { getItem() { return null; }, setItem() {} },
  URL,
  URLSearchParams,
  FormData,
  Blob,
  Date,
  Math,
  setTimeout() { return nextTimerId++; },
  clearTimeout() {},
  setInterval(callback, delay) {
    intervals.push({ callback, delay });
    return nextTimerId++;
  },
  clearInterval() {},
  addEventListener(type, handler) { addListener('window', type, handler); }
};
sandbox.window = sandbox;

const context = vm.createContext(sandbox);
['icons.js', 'data.js', 'app.js'].forEach((file) => {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
});

const data = context.APP_DATA;
assert.ok(data, 'APP_DATA 未初始化');

function renderHash(hash) {
  locationStub.hash = hash;
  assert.doesNotThrow(() => dispatch('window', 'hashchange'), `${hash} 路由渲染抛出了异常`);
  return main.innerHTML;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tagsWithAttribute(html, name, value) {
  const pattern = new RegExp(`<[^>]*\\b${escapeRegExp(name)}=(?:"${escapeRegExp(value)}"|'${escapeRegExp(value)}')[^>]*>`, 'g');
  return html.match(pattern) || [];
}

function readAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${escapeRegExp(name)}=(?:"([^"]*)"|'([^']*)')`));
  return match ? (match[1] == null ? match[2] : match[1]) : null;
}

function detailIdsFromAlerts(html) {
  return [...new Set(tagsWithAttribute(html, 'data-action', 'open-detail')
    .map((tag) => readAttribute(tag, 'data-id'))
    .filter(Boolean))];
}

function activePage(html) {
  const buttons = tagsWithAttribute(html, 'data-action', 'page');
  const active = buttons.find((tag) => /\bactive\b/.test(readAttribute(tag, 'class') || ''));
  return active ? Number(readAttribute(active, 'data-page')) : NaN;
}

function spreadGrowthFromDetail(html) {
  const section = html.match(/<section[^>]*class="[^"]*spread-detail-panel[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(section, '详情页缺少传播数据区域');
  return [...section[1].matchAll(/(?:↑|\+)\s*(\d+(?:\.\d+)?)\s*%/g)].map((match) => Number(match[1]));
}

function assertErrorState(html, route) {
  assert.ok(html.length > 20, `${route} 未渲染可用的错误页面`);
  assert.match(html, /(?:error|not-found|empty-state|route-error|invalid-route|未找到|不存在|无效|错误|异常|路径)/i,
    `${route} 未显示明确的错误状态`);
}

const expectedTaxonomy = [
  ['1', '政治安全风险', [['1.1', '政治制度攻击'], ['1.2', '历史虚无'], ['1.3', '破坏民族团结'], ['1.4', '破坏宗教政策']]],
  ['2', '社会安全风险', [['2.1', '违法违规'], ['2.2', '暴力恐怖']]],
  ['3', '道德风化风险', [['3.1', '丑化内容'], ['3.2', '低俗内容'], ['3.3', '色情淫秽']]],
  ['4', '未成年人保护风险', [['4.1', '不良行为诱导'], ['4.2', '宣扬畸形审美'], ['4.3', '宣扬奢靡享乐']]],
  ['5', '文化信息风险', [['5.1', '多模态隐晦虚假内容'], ['5.2', '危害优秀文化传统'], ['5.3', '传播不良网络用语']]]
];

assert.equal(data.riskDomains.length, 5, '失范领域必须恰为 5 类');
assert.equal(data.riskDomains.reduce((count, domain) => count + domain.categories.length, 0), 15, '失范类别必须恰为 15 类');
assert.deepEqual(
  Array.from(data.riskDomains, (domain) => [
    domain.code,
    domain.label,
    Array.from(domain.categories, (category) => [category.code, category.label])
  ]),
  expectedTaxonomy,
  '失范领域和类别字典与展示分类不一致'
);

const categoryTotal = Array.from(data.categories).reduce((sum, category) => sum + Number(category.value), 0);
const warningTypeTotal = Array.from(data.warningTypes).reduce((sum, type) => sum + Number(type.value), 0);
const statusTotal = Object.values(data.statusCounts).reduce((sum, value) => sum + Number(value), 0);
assert.equal(categoryTotal, data.totalAlerts, '失范领域统计总数与预警总数不一致');
assert.equal(warningTypeTotal, data.totalAlerts, '预警类型统计总数与预警总数不一致');
assert.equal(statusTotal, data.totalAlerts, '处置状态统计总数与预警总数不一致');

const alertById = new Map(Array.from(data.alerts, (alert) => [alert.id, alert]));
const sortedAlertIds = Array.from(data.alerts)
  .sort((left, right) => right.time.localeCompare(left.time))
  .slice(0, data.latestWarnings.length)
  .map((alert) => alert.id);
const latestIds = Array.from(data.latestWarnings, (alert) => alert.id);
assert.ok(latestIds.length > 0, '最新高危预警不能为空');
assert.equal(new Set(latestIds).size, latestIds.length, '最新高危预警存在重复 ID');
latestIds.forEach((id) => assert.ok(alertById.has(id), `最新高危预警 ${id} 不存在于预警列表`));
assert.deepEqual(latestIds, sortedAlertIds, '最新高危预警 ID 未与列表按发布时间对齐');

const leadAlert = alertById.get(data.detail.id);
assert.ok(leadAlert, '详情主预警未对应到预警列表');
['id', 'categoryCode', 'category', 'categoryLabel', 'time', 'platformKey', 'platform', 'image', 'title', 'summary', 'accountId'].forEach((field) => {
  assert.equal(data.detail[field], leadAlert[field], `详情与列表的 ${field} 不一致`);
});
assert.equal(data.detail.account, leadAlert.account.replace(/^@/, ''), '详情与列表的账号不一致');
assert.equal(data.detail.fans, leadAlert.followers, '详情与列表的粉丝数不一致');
assert.equal(data.detail.likes, leadAlert.spread[0][1], '详情与列表的首项传播数据不一致');
assert.deepEqual(
  JSON.parse(JSON.stringify(data.detail.spread)),
  JSON.parse(JSON.stringify(leadAlert.spread)),
  '详情与列表的传播数据不一致'
);

const checks = [
  ['#/overview', ['今日监测概况', '全国风险态势感知', '最新高危预警']],
  ['#/alerts', ['实时预警', '关键词云', leadAlert.title]],
  ['#/detail/' + encodeURIComponent(leadAlert.id), ['预警详情', 'AI失范分析', '研判与处置', leadAlert.id, leadAlert.image]]
];

checks.forEach(([hash, expected]) => {
  const html = renderHash(hash);
  expected.forEach((text) => {
    assert.ok(html.includes(text), `${hash} 缺少关键内容：${text}`);
  });
  assert.ok(html.length >= 1000, `${hash} 渲染内容异常短`);
});

const dateStart = '2025-06-01';
const dateEnd = '2025-06-01';
const dateFilteredHtml = renderHash('#/alerts?startDate=' + dateStart + '&endDate=' + dateEnd + '&page=1');
const expectedDateIds = Array.from(data.alerts)
  .filter((alert) => alert.time.slice(0, 10) >= dateStart && alert.time.slice(0, 10) <= dateEnd)
  .sort((left, right) => right.time.localeCompare(left.time))
  .map((alert) => alert.id);
assert.deepEqual(detailIdsFromAlerts(dateFilteredHtml), expectedDateIds, '开始/结束日期筛选未仅显示日期范围内的预警');

['not-a-number', '0', '-3'].forEach((invalidPage) => {
  const html = renderHash('#/alerts?page=' + encodeURIComponent(invalidPage));
  assert.equal(activePage(html), 1, `非法页码 ${invalidPage} 未回退到第一页`);
  assert.ok(!html.includes('NaN'), `非法页码 ${invalidPage} 在页面中泄露了 NaN`);
});
const overflowPageHtml = renderHash('#/alerts?page=999');
const renderedPages = tagsWithAttribute(overflowPageHtml, 'data-action', 'page')
  .map((tag) => Number(readAttribute(tag, 'data-page')))
  .filter(Number.isFinite);
assert.ok(renderedPages.length > 0, '分页未渲染任何有效页码');
assert.equal(activePage(overflowPageHtml), Math.max(...renderedPages), '超出范围的页码未回退到最后一页');

[
  '#/detail',
  '#/detail/UNKNOWN-ALERT',
  '#/detail/%E0%A4%A'
].forEach((route) => assertErrorState(renderHash(route), route));

const refreshIntervals = intervals.filter((interval) => interval.delay === 10000);
assert.ok(refreshIntervals.length >= 1, '未注册 10 秒自动刷新定时器');
refreshIntervals.forEach((interval) => assert.doesNotThrow(() => interval.callback(), '10 秒自动刷新回调抛出了异常'));

const firstDetailHtml = renderHash('#/detail/' + encodeURIComponent(leadAlert.id));
const firstGrowth = spreadGrowthFromDetail(firstDetailHtml);
const secondDetailHtml = renderHash('#/detail/' + encodeURIComponent(leadAlert.id));
const secondGrowth = spreadGrowthFromDetail(secondDetailHtml);
assert.deepEqual(firstGrowth, Array.from(leadAlert.spreadGrowth, Number), '详情传播增幅未使用预警的固定数据');
assert.deepEqual(secondGrowth, firstGrowth, '详情重新渲染后传播增幅不稳定');

function clickAction(attributes) {
  const target = {
    getAttribute(name) { return attributes[name] || null; }
  };
  dispatch('document', 'click', { target: { closest() { return target; } } });
}

renderHash('#/alerts');
clickAction({ 'data-action': 'open-detail', 'data-id': leadAlert.id });
assert.equal(locationStub.hash, '#/detail/' + leadAlert.id, '查看详情未生成正确路由');

renderHash('#/alerts');
clickAction({ 'data-action': 'status-tab', 'data-status': '已处置' });
assert.ok(locationStub.hash.includes('%E5%B7%B2%E5%A4%84%E7%BD%AE'), '状态页签未写入筛选路由');

const expectedCaseAssets = Array.from({ length: 12 }, (_, index) => 'assets/case-' + (index + 1) + '.png');
const alertImagePaths = Array.from(data.alerts, (alert) => alert.image);
assert.equal(alertImagePaths.length, 12, '示例预警必须恰有 12 条');
assert.equal(new Set(alertImagePaths).size, alertImagePaths.length, '每条示例预警必须使用唯一案例图');
assert.deepEqual(
  alertImagePaths.slice().sort(),
  expectedCaseAssets.slice().sort(),
  '示例预警图片必须完整且唯一地映射到 assets/case-1.png 至 assets/case-12.png'
);

function readPngDimensions(asset) {
  const buffer = fs.readFileSync(path.join(__dirname, asset));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.length >= 24, 'PNG 文件过短：' + asset);
  assert.ok(buffer.subarray(0, 8).equals(signature), '案例图不是 PNG：' + asset);
  assert.equal(buffer.toString('ascii', 12, 16), 'IHDR', '案例图缺少 IHDR 头：' + asset);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

expectedCaseAssets.forEach((asset) => {
  assert.ok(fs.existsSync(path.join(__dirname, asset)), '缺少案例图：' + asset);
  const dimensions = readPngDimensions(asset);
  assert.ok(dimensions.width >= 1536, '案例图宽度不足 1536px：' + asset + '（' + dimensions.width + 'px）');
  assert.ok(dimensions.height >= 1024, '案例图高度不足 1024px：' + asset + '（' + dimensions.height + 'px）');
});

const sourceText = ['app.js', 'data.js'].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');
const referencedAssets = [...sourceText.matchAll(/assets\/[\w-]+\.png/g)].map((match) => match[0]);
[...new Set(referencedAssets)].forEach((asset) => {
  assert.ok(fs.existsSync(path.join(__dirname, asset)), `缺少资源：${asset}`);
});

const iconSource = fs.readFileSync(path.join(__dirname, 'icons.js'), 'utf8');
const iconNames = new Set([...iconSource.matchAll(/'([^']+)':\s*'<(?:path|circle|rect)/g)].map((match) => match[1]));
const staticIconCalls = [...sourceText.matchAll(/icon\('([^']+)'/g)].map((match) => match[1]);
staticIconCalls.forEach((name) => {
  assert.ok(iconNames.has(name), `缺少图标定义：${name}`);
});

console.log('Smoke test passed: data consistency, routing, filtering, refresh, deterministic detail rendering, high-resolution case images, assets and icons are valid.');
