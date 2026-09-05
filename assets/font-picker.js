/* font-picker.js - 首启字体选择交互
   恢复选择与 data-font 属性由 head 内联脚本完成(防字体闪烁);
   本文件在 DOM 就绪后决定选择界面显隐并绑定交互。 */
(function () {
  'use strict';
  var overlay = document.getElementById('fontPicker');
  if (!overlay) return;

  var saved = null;
  try { saved = localStorage.getItem('site-font'); } catch (e) {}

  function hide() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }
  function show() {
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    var first = overlay.querySelector('.font-option');
    if (first) first.focus();
  }

  function choose(font) {
    try { localStorage.setItem('site-font', font); } catch (err) {}
    /* 立即刷新:重载时 head 内联脚本恢复 data-font,字体从渲染一开始就正确,
       避免动态切换导致整页字体跳动 */
    location.reload();
  }

  Array.prototype.forEach.call(overlay.querySelectorAll('.font-option'), function (b) {
    b.addEventListener('click', function () {
      choose(b.getAttribute('data-font-choice'));
    });
  });

  var reopen = document.getElementById('fontPickerReopen');
  if (reopen) reopen.addEventListener('click', show);

  if (saved === 'default' || saved === 'maple') {
    hide();
  } else {
    show();
  }
})();
