'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function elementStub() {
  return {
    innerHTML: '',
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
const documentStub = {
  body: elementStub(),
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, elementStub());
    return elements.get(id);
  },
  querySelectorAll() { return []; },
  querySelector() { return elementStub(); },
  addEventListener(type, handler) { listeners['document:' + type] = handler; },
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
  setTimeout() {},
  clearTimeout() {},
  setInterval() {},
  addEventListener(type, handler) { listeners['window:' + type] = handler; }
};
sandbox.window = sandbox;

const context = vm.createContext(sandbox);
['icons.js', 'data.js', 'app.js'].forEach((file) => {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
});

const checks = [
  ['#/overview', ['今日监测概况', '全国风险态势感知', '最新高危预警']],
  ['#/alerts', ['实时预警', '关键词云', '日本侵华历史早已翻篇']],
  ['#/detail/AL250602-009845', ['预警详情', 'AI失范分析', '研判与处置']]
];

checks.forEach(([hash, expected]) => {
  locationStub.hash = hash;
  listeners['window:hashchange']();
  expected.forEach((text) => {
    if (!main.innerHTML.includes(text)) throw new Error(`${hash} 缺少关键内容：${text}`);
  });
  if (main.innerHTML.length < 1000) throw new Error(`${hash} 渲染内容异常短`);
});

function clickAction(attributes) {
  const target = {
    getAttribute(name) { return attributes[name] || null; }
  };
  listeners['document:click']({ target: { closest() { return target; } } });
}

locationStub.hash = '#/alerts';
listeners['window:hashchange']();
clickAction({ 'data-action': 'open-detail', 'data-id': 'AL250602-009845' });
if (locationStub.hash !== '#/detail/AL250602-009845') throw new Error('查看详情未生成正确路由');

locationStub.hash = '#/alerts';
listeners['window:hashchange']();
clickAction({ 'data-action': 'status-tab', 'data-status': '已处置' });
if (!locationStub.hash.includes('%E5%B7%B2%E5%A4%84%E7%BD%AE')) throw new Error('状态页签未写入筛选路由');

const sourceText = ['app.js', 'data.js'].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');
const referencedAssets = [...sourceText.matchAll(/assets\/[\w-]+\.png/g)].map((match) => match[0]);
[...new Set(referencedAssets)].forEach((asset) => {
  if (!fs.existsSync(path.join(__dirname, asset))) throw new Error(`缺少资源：${asset}`);
});

const iconSource = fs.readFileSync(path.join(__dirname, 'icons.js'), 'utf8');
const iconNames = new Set([...iconSource.matchAll(/'([^']+)':\s*'<(?:path|circle|rect)/g)].map((match) => match[1]));
const staticIconCalls = [...sourceText.matchAll(/icon\('([^']+)'/g)].map((match) => match[1]);
staticIconCalls.forEach((name) => {
  if (!iconNames.has(name)) throw new Error(`缺少图标定义：${name}`);
});

console.log('Smoke test passed: overview, alerts, detail and local image assets are valid.');
