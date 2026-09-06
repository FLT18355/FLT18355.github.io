/* search.js - search 页专属:实时时钟 + 最近搜索 + 快捷键聚焦
   仅 search 页通过内容区 <script src> 加载;其它页面无这些元素,守卫后零副作用。 */
(function () {
  'use strict';

  /* ---------- 1. 实时时钟(中文日期,字面量须进字体子集) ---------- */
  var dateEl = document.getElementById('searchDate');
  var timeEl = document.getElementById('searchTime');
  var WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var d = new Date();
    dateEl.textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + WEEK[d.getDay()];
    timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  if (dateEl && timeEl) {
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 2. 快捷键:/ 或 Ctrl/Cmd+K 聚焦搜索框,Esc 清空 ---------- */
  var input = document.getElementById('searchQ');
  function isTyping(el) {
    var tag = el && el.tagName ? el.tagName : '';
    return tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable);
  }
  if (input) {
    document.addEventListener('keydown', function (e) {
      var wantFocus = e.key === '/' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'));
      if (!wantFocus) return;
      if (isTyping(e.target)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        input.blur();
      }
    });
  }

  /* ---------- 3. 最近搜索:localStorage 存最近 5 条,chips 点击重搜 ---------- */
  var box = document.getElementById('searchHistory');
  var chips = document.getElementById('searchChips');
  var clearBtn = document.getElementById('searchClear');
  var form = document.querySelector('.search-form');
  var KEY = 'search-history';
  var MAX = 5;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function render(list) {
    chips.textContent = '';
    list.forEach(function (q) {
      var a = document.createElement('a');
      a.className = 'search-chip';
      a.href = 'https://www.bing.com/search?q=' + encodeURIComponent(q);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = q;
      chips.appendChild(a);
    });
    box.hidden = list.length === 0;
  }

  if (box && chips && clearBtn && form && input) {
    form.addEventListener('submit', function () {
      var q = (input.value || '').trim();
      if (!q) return;
      var list = load().filter(function (x) { return x !== q; });
      list.unshift(q);
      save(list.slice(0, MAX));
      render(list.slice(0, MAX));
    });
    clearBtn.addEventListener('click', function () {
      save([]);
      render([]);
    });
    render(load());
  }
})();
