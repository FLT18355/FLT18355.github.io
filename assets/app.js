(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  function commitTheme(prevTheme, nextTheme) {
    if (prevTheme === nextTheme) return;
    root.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('theme', nextTheme); } catch (err) {}
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { from: prevTheme, to: nextTheme, via: btn }
    }));
  }

  btn.addEventListener('click', function (e) {
    e.preventDefault(); // <a> 化后可去掉 href 跳转；button 元素时无副作用
    var from = root.getAttribute('data-theme');
    commitTheme(from, from === 'mocha' ? 'latte' : 'mocha');
  });
})();
