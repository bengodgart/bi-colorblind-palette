// app.js, DOM wiring for the colorblind palette checker. Pure client-side; no network calls.
(function () {
  'use strict';

  var EXAMPLES = {
    unsafe: '#e74c3c, #2ecc71, #f1c40f, #c0392b',
    safe: '#1f77b4, #ff7f0e, #009e73, #0f172a'
  };

  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.remove('hidden'); }
  function hide(id) { el(id).classList.add('hidden'); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, function (ch) {
      return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;';
    });
  }

  // Example segmented control: loads sample text into the textarea. Not a form field itself,
  // so clicking one just fills the textarea and marks itself active until the text is edited.
  var segButtons = Array.prototype.slice.call(document.querySelectorAll('#example-seg button'));
  segButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      segButtons.forEach(function (c) { c.classList.remove('active'); });
      b.classList.add('active');
      el('palette-input').value = EXAMPLES[b.getAttribute('data-example')];
    });
  });
  el('palette-input').addEventListener('input', function () {
    segButtons.forEach(function (c) { c.classList.remove('active'); });
  });

  function renderErrors(errors) {
    var box = el('input-error');
    if (!errors.length) {
      hide('input-error');
      box.innerHTML = '';
      return;
    }
    var noun = errors.length === 1 ? 'entry' : 'entries';
    box.innerHTML = '<b>' + errors.length + ' ' + noun + ' could not be read as a color:</b>'
      + '<ul>' + errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') + '</ul>'
      + '<span>Use hex codes like <code>#e74c3c</code> or <code>e74c3c</code>.</span>';
    show('input-error');
  }

  function swatchHtml(hex) {
    return '<span class="swatch"><span class="chip" style="background:' + hex + '"></span>'
      + '<span class="hexlabel">' + hex + '</span></span>';
  }

  function renderSimTable(colors) {
    var table = el('sim-table');
    var head = '<tr><th>Your color</th>';
    SIMULATION_TYPES.forEach(function (t) { head += '<th>' + t.label + '</th>'; });
    head += '</tr>';
    var rows = colors.map(function (hex) {
      var row = '<td>' + swatchHtml(hex) + '</td>';
      SIMULATION_TYPES.forEach(function (t) {
        row += '<td>' + swatchHtml(simulate(hex, t.id)) + '</td>';
      });
      return '<tr>' + row + '</tr>';
    }).join('');
    table.innerHTML = head + rows;
  }

  function renderVerdict(colors) {
    var summary = el('verdict-summary');
    var pairsHost = el('verdict-pairs');
    pairsHost.innerHTML = '';

    if (colors.length < 2) {
      summary.className = 'verdict pass';
      summary.textContent = 'Only one color entered. Add at least one more to check for a conflict.';
      return;
    }

    var result = evaluatePalette(colors);
    if (result.pass) {
      summary.className = 'verdict pass';
      summary.textContent = 'Passes: no pair in this palette collapses for protanopia, deuteranopia, or tritanopia.';
      return;
    }

    var failCount = result.failingPairs.length;
    summary.className = 'verdict fail';
    summary.textContent = 'Fails: ' + failCount + ' color pair' + (failCount === 1 ? '' : 's') + ' become' + (failCount === 1 ? 's' : '') + ' hard to tell apart for at least one colorblind type.';

    result.failingPairs.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'pair-card';
      var title = document.createElement('div');
      title.className = 'pair-title';
      title.innerHTML = swatchHtml(p.a) + ' and ' + swatchHtml(p.b) + ' collapse for ' + escapeHtml(p.typeLabel.toLowerCase());
      card.appendChild(title);
      var detail = document.createElement('div');
      detail.className = 'pair-detail';
      var typeInfo = SIMULATION_TYPES.filter(function (t) { return t.id === p.typeId; })[0];
      detail.textContent = 'These two look clearly different normally, but nearly the same to someone with ' + p.typeLabel.toLowerCase() + ' (' + typeInfo.note + ').';
      card.appendChild(detail);
      pairsHost.appendChild(card);
    });
  }

  function renderSafePalette(colors) {
    var suggestion = suggestSafePalette(Math.max(colors.length, 1));
    var hexes = suggestion.colors.map(function (c) { return c.hex; });

    var note = el('safe-note');
    note.textContent = suggestion.capped
      ? 'Showing the 8 Okabe-Ito colorblind-safe colors (Okabe and Ito, 2008). Your palette asked for ' + suggestion.requested + '; beyond 8 categories, a qualitative palette stops being reliably distinguishable for anyone, so consider a sequential or diverging scale instead.'
      : 'The Okabe-Ito colorblind-safe palette (Okabe and Ito, 2008), sized to match your ' + suggestion.requested + '-color palette.';

    var swatchHost = el('safe-swatches');
    swatchHost.innerHTML = suggestion.colors.map(function (c) {
      return '<span class="card"><span class="chip" style="background:' + c.hex + '"></span>'
        + '<span class="label"><span class="name">' + escapeHtml(c.name) + '</span> '
        + '<span class="hexlabel">' + c.hex + '</span></span></span>';
    }).join('');

    var theme = buildPowerBiTheme('Colorblind safe palette', hexes);
    var themeText = JSON.stringify(theme, null, 2);
    var tableauText = buildTableauPaletteXml('Colorblind safe palette', hexes);
    el('powerbi-out').textContent = themeText;
    el('tableau-out').textContent = tableauText;

    return { themeText: themeText, tableauText: tableauText };
  }

  function runCheck() {
    var parsed = parsePaletteInput(el('palette-input').value);
    renderErrors(parsed.errors);

    if (!parsed.colors.length) {
      hide('simulation-panel');
      hide('verdict-panel');
      hide('safe-panel');
      return;
    }

    renderSimTable(parsed.colors);
    renderVerdict(parsed.colors);
    renderSafePalette(parsed.colors);

    show('simulation-panel');
    show('verdict-panel');
    show('safe-panel');
    el('simulation-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  el('check').addEventListener('click', runCheck);

  el('clear').addEventListener('click', function () {
    el('palette-input').value = '';
    segButtons.forEach(function (c) { c.classList.remove('active'); });
    renderErrors([]);
    hide('simulation-panel');
    hide('verdict-panel');
    hide('safe-panel');
  });

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function flash(msg) {
    var s = el('export-status');
    s.textContent = msg;
    setTimeout(function () { s.textContent = ''; }, 2000);
  }

  function download(filename, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  el('copy-powerbi').addEventListener('click', function () {
    copyText(el('powerbi-out').textContent).then(function () { flash('Power BI theme.json copied.'); });
  });
  el('download-powerbi').addEventListener('click', function () {
    download('theme.json', el('powerbi-out').textContent, 'application/json');
    flash('Downloaded theme.json.');
  });
  el('copy-tableau').addEventListener('click', function () {
    copyText(el('tableau-out').textContent).then(function () { flash('Tableau palette copied.'); });
  });
  el('download-tableau').addEventListener('click', function () {
    download('Preferences.tps', el('tableau-out').textContent, 'application/xml');
    flash('Downloaded Preferences.tps.');
  });
})();
