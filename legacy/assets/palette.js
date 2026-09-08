/* palette.js - Catppuccin 色板页:数据渲染 + 点击复制 Hex
   色值来源:catppuccin/palette 官方 palette(经 catppuccin-palette skill 核验)。 */
(function () {
  'use strict';
  var ACCENTS = ['Rosewater', 'Flamingo', 'Pink', 'Mauve', 'Red', 'Maroon', 'Peach',
                 'Yellow', 'Green', 'Teal', 'Sky', 'Sapphire', 'Blue', 'Lavender'];
  var NEUTRALS = ['Text', 'Subtext 1', 'Subtext 0', 'Overlay 2', 'Overlay 1', 'Overlay 0',
                  'Surface 2', 'Surface 1', 'Surface 0', 'Base', 'Mantle', 'Crust'];
  var FLAVORS = [
    { name: 'Latte', note: '唯一的浅色风味', hex: {
      Rosewater: '#dc8a78', Flamingo: '#dd7878', Pink: '#ea76cb', Mauve: '#8839ef',
      Red: '#d20f39', Maroon: '#e64553', Peach: '#fe640b', Yellow: '#df8e1d',
      Green: '#40a02b', Teal: '#179299', Sky: '#04a5e5', Sapphire: '#209fb5',
      Blue: '#1e66f5', Lavender: '#7287fd',
      Text: '#4c4f69', 'Subtext 1': '#5c5f77', 'Subtext 0': '#6c6f85',
      'Overlay 2': '#7c7f93', 'Overlay 1': '#8c8fa1', 'Overlay 0': '#9ca0b0',
      'Surface 2': '#acb0be', 'Surface 1': '#bcc0cc', 'Surface 0': '#ccd0da',
      Base: '#eff1f5', Mantle: '#e6e9ef', Crust: '#dce0e8' } },
    { name: 'Frappé', note: '柔和低对比', hex: {
      Rosewater: '#f2d5cf', Flamingo: '#eebebe', Pink: '#f4b8e4', Mauve: '#ca9ee6',
      Red: '#e78284', Maroon: '#ea999c', Peach: '#ef9f76', Yellow: '#e5c890',
      Green: '#a6d189', Teal: '#81c8be', Sky: '#99d1db', Sapphire: '#85c1dc',
      Blue: '#8caaee', Lavender: '#babbf1',
      Text: '#c6d0f5', 'Subtext 1': '#b5bfe2', 'Subtext 0': '#a5adce',
      'Overlay 2': '#949cbb', 'Overlay 1': '#838ba7', 'Overlay 0': '#737994',
      'Surface 2': '#626880', 'Surface 1': '#51576d', 'Surface 0': '#414559',
      Base: '#303446', Mantle: '#292c3c', Crust: '#232634' } },
    { name: 'Macchiato', note: '中等对比', hex: {
      Rosewater: '#f4dbd6', Flamingo: '#f0c6c6', Pink: '#f5bde6', Mauve: '#c6a0f6',
      Red: '#ed8796', Maroon: '#ee99a0', Peach: '#f5a97f', Yellow: '#eed49f',
      Green: '#a6da95', Teal: '#8bd5ca', Sky: '#91d7e3', Sapphire: '#7dc4e4',
      Blue: '#8aadf4', Lavender: '#b7bdf8',
      Text: '#cad3f5', 'Subtext 1': '#b8c0e0', 'Subtext 0': '#a5adcb',
      'Overlay 2': '#939ab7', 'Overlay 1': '#8087a2', 'Overlay 0': '#6e738d',
      'Surface 2': '#5b6078', 'Surface 1': '#494d64', 'Surface 0': '#363a4f',
      Base: '#24273a', Mantle: '#1e2030', Crust: '#181926' } },
    { name: 'Mocha', note: '原版,最深', hex: {
      Rosewater: '#f5e0dc', Flamingo: '#f2cdcd', Pink: '#f5c2e7', Mauve: '#cba6f7',
      Red: '#f38ba8', Maroon: '#eba0ac', Peach: '#fab387', Yellow: '#f9e2af',
      Green: '#a6e3a1', Teal: '#94e2d5', Sky: '#89dceb', Sapphire: '#74c7ec',
      Blue: '#89b4fa', Lavender: '#b4befe',
      Text: '#cdd6f4', 'Subtext 1': '#bac2de', 'Subtext 0': '#a6adc8',
      'Overlay 2': '#9399b2', 'Overlay 1': '#7f849c', 'Overlay 0': '#6c7086',
      'Surface 2': '#585b70', 'Surface 1': '#45475a', 'Surface 0': '#313244',
      Base: '#1e1e2e', Mantle: '#181825', Crust: '#11111b' } }
  ];

  function swatchHtml(name, hex) {
    return '<button type="button" class="swatch" data-hex="' + hex + '" title="复制 ' + hex + '">' +
           '<span class="swatch-chip" style="background:' + hex + '"></span>' +
           '<span class="swatch-name">' + name + '</span>' +
           '<span class="swatch-hex">' + hex + '</span>' +
           '</button>';
  }

  function flavorHtml(f) {
    var accents = ACCENTS.map(function (n) { return swatchHtml(n, f.hex[n]); }).join('');
    var neutrals = NEUTRALS.map(function (n) { return swatchHtml(n, f.hex[n]); }).join('');
    return '<div class="palette-flavor">' +
           '<div class="palette-head"><h3>' + f.name + '</h3><span>' + f.note + '</span></div>' +
           '<div class="palette-group"><span>Accent</span></div>' +
           '<div class="swatch-grid">' + accents + '</div>' +
           '<div class="palette-group"><span>Neutrals</span></div>' +
           '<div class="swatch-grid">' + neutrals + '</div>' +
           '</div>';
  }

  var root = document.getElementById('palette');
  if (!root) return;
  root.innerHTML = FLAVORS.map(flavorHtml).join('');

  /* 点击复制 Hex,带瞬时反馈 */
  root.addEventListener('click', function (e) {
    var sw = e.target.closest ? e.target.closest('.swatch') : null;
    if (!sw) return;
    var hex = sw.getAttribute('data-hex');
    if (!hex) return;
    var label = sw.querySelector('.swatch-hex');
    var old = label.textContent;
    function done() {
      sw.classList.add('copied');
      label.textContent = 'Copied!';
      setTimeout(function () {
        sw.classList.remove('copied');
        label.textContent = old;
      }, 900);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hex).then(done, done);
    } else {
      done();
    }
  });
})();
