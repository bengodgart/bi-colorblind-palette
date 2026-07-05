// palette.js, the colorblind-check logic.
// Pure, dependency-free, and shared between the browser (index.html) and Node (test.js).
// No data ever leaves the caller; these functions only transform hex strings and numbers.

// The three common forms of color blindness this tool checks, in the order they are shown.
var SIMULATION_TYPES = [
  { id: 'protanopia', label: 'Protanopia', note: 'red-blind, about 1% of men' },
  { id: 'deuteranopia', label: 'Deuteranopia', note: 'green-blind, the most common form, about 5% of men' },
  { id: 'tritanopia', label: 'Tritanopia', note: 'blue-blind, rare, under 1% of people' }
];

// Simulation matrices (Machado, Oliveira & Fernandes, 2009), full severity, applied in linear RGB.
// This is the same model used by Chrome DevTools' vision-deficiency emulation.
var MATRICES = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881]
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900]
  ]
};

// A pair whose simulated distance falls below this (on a 0-764.8 redmean scale) reads as the
// same color to that colorblind type. Above it, the pair stays visibly distinct.
var FAIL_THRESHOLD = 50;

// The Okabe-Ito palette (Okabe & Ito, 2008, "Color Universal Design"), the standard
// colorblind-safe qualitative set recommended for charts and dashboards. Ordered by how
// well each new color holds up against everything picked before it.
var SAFE_PALETTE = [
  { hex: '#000000', name: 'black' },
  { hex: '#E69F00', name: 'orange' },
  { hex: '#56B4E9', name: 'sky blue' },
  { hex: '#009E73', name: 'bluish green' },
  { hex: '#F0E442', name: 'yellow' },
  { hex: '#0072B2', name: 'blue' },
  { hex: '#D55E00', name: 'vermillion' },
  { hex: '#CC79A7', name: 'reddish purple' }
];

// Parse one token into a normalized "#rrggbb" hex string, or null if it is not a valid color.
// Accepts a leading # or not, and both 3-digit and 6-digit hex.
function parseHex(input) {
  if (typeof input !== 'string') return null;
  var s = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s.split('').map(function (ch) { return ch + ch; }).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return '#' + s.toLowerCase();
}

function hexToRgb(hex) {
  var n = hex.replace('#', '');
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16)
  };
}

function rgbToHex(rgb) {
  function ch(v) {
    var n = Math.max(0, Math.min(255, Math.round(v)));
    var h = n.toString(16);
    return h.length === 1 ? '0' + h : h;
  }
  return '#' + ch(rgb.r) + ch(rgb.g) + ch(rgb.b);
}

// Split free-typed text into hex tokens (comma, space, or newline separated), parse each,
// and report both the valid colors (deduplicated, order kept) and every token that failed to parse.
function parsePaletteInput(text) {
  var raw = (text || '').split(/[\s,]+/).map(function (t) { return t.trim(); }).filter(Boolean);
  var colors = [];
  var seen = {};
  var errors = [];
  raw.forEach(function (token) {
    var hex = parseHex(token);
    if (!hex) {
      errors.push(token);
      return;
    }
    if (!seen[hex]) {
      seen[hex] = true;
      colors.push(hex);
    }
  });
  return { colors: colors, errors: errors };
}

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  var v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, v * 255));
}

// Simulate how a hex color appears to the given colorblindness type. Returns a hex string.
function simulate(hex, typeId) {
  var m = MATRICES[typeId];
  if (!m) throw new Error('Unknown simulation type: ' + typeId);
  var rgb = hexToRgb(hex);
  var lin = [srgbToLinear(rgb.r), srgbToLinear(rgb.g), srgbToLinear(rgb.b)];
  var out = [0, 1, 2].map(function (i) {
    return m[i][0] * lin[0] + m[i][1] * lin[1] + m[i][2] * lin[2];
  });
  return rgbToHex({ r: linearToSrgb(out[0]), g: linearToSrgb(out[1]), b: linearToSrgb(out[2]) });
}

// Perceptual-ish color distance ("redmean" weighted Euclidean distance). 0 = identical,
// about 764.8 = black vs white, the maximum possible.
function colorDistance(hexA, hexB) {
  var a = hexToRgb(hexA);
  var b = hexToRgb(hexB);
  var rMean = (a.r + b.r) / 2;
  var dR = a.r - b.r, dG = a.g - b.g, dB = a.b - b.b;
  return Math.sqrt((2 + rMean / 256) * dR * dR + 4 * dG * dG + (2 + (255 - rMean) / 256) * dB * dB);
}

// Check every pair of colors against every simulation type. A pair only counts as a colorblind
// failure if it reads as distinct in normal vision (original distance clears the threshold) but
// collapses under simulation (simulated distance does not); two colors that are already too close
// for anyone to tell apart are a duplicate-color problem, not a colorblindness one, and are skipped.
function evaluatePalette(colors) {
  var pairs = [];
  for (var i = 0; i < colors.length; i++) {
    for (var j = i + 1; j < colors.length; j++) {
      var a = colors[i], b = colors[j];
      var origDistance = colorDistance(a, b);
      if (origDistance < FAIL_THRESHOLD) continue; // already indistinguishable in normal vision
      SIMULATION_TYPES.forEach(function (t) {
        var simDistance = colorDistance(simulate(a, t.id), simulate(b, t.id));
        pairs.push({
          a: a, b: b, typeId: t.id, typeLabel: t.label,
          origDistance: origDistance, simDistance: simDistance,
          fails: simDistance < FAIL_THRESHOLD
        });
      });
    }
  }
  var failingPairs = pairs.filter(function (p) { return p.fails; });
  return { pairs: pairs, failingPairs: failingPairs, pass: failingPairs.length === 0 };
}

// Pick a colorblind-safe suggested palette sized to the input, capped at the 8 Okabe-Ito colors.
// Beyond 8 categories a qualitative palette stops being reliably distinguishable for anyone, so the
// cap is named rather than silently repeating colors.
function suggestSafePalette(count) {
  var n = Math.max(1, count || 1);
  var capped = Math.min(n, SAFE_PALETTE.length);
  return {
    colors: SAFE_PALETTE.slice(0, capped),
    requested: n,
    capped: n > SAFE_PALETTE.length
  };
}

// A minimal, valid Power BI custom theme. Power BI Desktop accepts a theme JSON with a name and
// a dataColors array; background/foreground/tableAccent are optional but make it a complete theme.
function buildPowerBiTheme(name, colors) {
  return {
    name: name || 'Colorblind safe palette',
    dataColors: colors.slice(),
    background: '#FFFFFF',
    foreground: '#000000',
    tableAccent: colors[0] || '#000000'
  };
}

// A Tableau custom color palette in the Preferences.tps format Tableau Desktop reads from
// "My Tableau Repository/Preferences.tps".
function buildTableauPaletteXml(name, colors) {
  var lines = [];
  lines.push("<?xml version='1.0'?>");
  lines.push('<workbook>');
  lines.push('    <preferences>');
  lines.push('        <color-palette name="' + (name || 'Colorblind safe palette') + '" type="regular">');
  colors.forEach(function (hex) {
    lines.push('            <color>' + hex.toUpperCase() + '</color>');
  });
  lines.push('        </color-palette>');
  lines.push('    </preferences>');
  lines.push('</workbook>');
  return lines.join('\n');
}

// Export for Node (test.js); harmless in the browser where module is undefined.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SIMULATION_TYPES: SIMULATION_TYPES,
    SAFE_PALETTE: SAFE_PALETTE,
    FAIL_THRESHOLD: FAIL_THRESHOLD,
    parseHex: parseHex,
    parsePaletteInput: parsePaletteInput,
    simulate: simulate,
    colorDistance: colorDistance,
    evaluatePalette: evaluatePalette,
    suggestSafePalette: suggestSafePalette,
    buildPowerBiTheme: buildPowerBiTheme,
    buildTableauPaletteXml: buildTableauPaletteXml
  };
}
