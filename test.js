// test.js, smoke test for the colorblind palette logic. Run: node test.js
// No dependencies. Exits 0 on pass, 1 on first failure.

var palette = require('./palette.js');
var EM = String.fromCharCode(8212);

var passed = 0;
function assert(cond, msg) {
  if (!cond) { console.error('FAIL: ' + msg); process.exit(1); }
  passed++;
  console.log('ok: ' + msg);
}

// 1. parseHex: accepts #rrggbb, rrggbb, #rgb, and rejects garbage.
assert(palette.parseHex('#FF0000') === '#ff0000', 'parseHex normalizes #rrggbb to lowercase');
assert(palette.parseHex('ff0000') === '#ff0000', 'parseHex accepts hex without a leading #');
assert(palette.parseHex('#f00') === '#ff0000', 'parseHex expands 3-digit shorthand');
assert(palette.parseHex('not-a-color') === null, 'parseHex rejects garbage');
assert(palette.parseHex('#12') === null, 'parseHex rejects the wrong digit count');

// 2. parsePaletteInput: splits on commas/spaces/newlines, dedupes, and collects every bad token
// at once (the ErrorAlert contract), not just the first one.
var parsed = palette.parsePaletteInput('#ff0000, #00ff00\n#ff0000 notacolor  #zzzzzz');
assert(parsed.colors.length === 2, 'parsePaletteInput dedupes repeated colors');
assert(parsed.colors[0] === '#ff0000' && parsed.colors[1] === '#00ff00', 'parsePaletteInput keeps input order');
assert(parsed.errors.length === 2, 'parsePaletteInput collects both bad tokens, not just the first');
assert(parsed.errors.indexOf('notacolor') !== -1 && parsed.errors.indexOf('#zzzzzz') !== -1, 'parsePaletteInput names each bad token');

// 3. Known UNSAFE pair: firebrick red vs dark olive green is a documented red-green confusion pair.
// Both are clearly distinct in normal vision but must collapse under deuteranopia simulation.
var unsafeA = '#b22222', unsafeB = '#556b2f';
var origDist = palette.colorDistance(unsafeA, unsafeB);
assert(origDist >= palette.FAIL_THRESHOLD, 'firebrick vs dark olive green are distinct in normal vision');
var simA = palette.simulate(unsafeA, 'deuteranopia');
var simB = palette.simulate(unsafeB, 'deuteranopia');
var simDist = palette.colorDistance(simA, simB);
assert(simDist < palette.FAIL_THRESHOLD, 'firebrick vs dark olive green collapse under deuteranopia simulation (' + simDist.toFixed(1) + ' < ' + palette.FAIL_THRESHOLD + ')');
var unsafeEval = palette.evaluatePalette([unsafeA, unsafeB]);
assert(!unsafeEval.pass, 'evaluatePalette fails the known-unsafe pair');
assert(unsafeEval.failingPairs.some(function (p) { return p.typeId === 'deuteranopia'; }), 'evaluatePalette names deuteranopia as the failing type');

// 4. Known SAFE pair: the Tableau/ColorBrewer blue-orange pair stays distinguishable in all three types.
var safeA = '#1f77b4', safeB = '#ff7f0e';
var safeEval = palette.evaluatePalette([safeA, safeB]);
assert(safeEval.pass, 'evaluatePalette passes the known-safe blue/orange pair');
palette.SIMULATION_TYPES.forEach(function (t) {
  var d = palette.colorDistance(palette.simulate(safeA, t.id), palette.simulate(safeB, t.id));
  assert(d >= palette.FAIL_THRESHOLD, 'blue/orange stays distinguishable under ' + t.label + ' (' + d.toFixed(1) + ')');
});

// 5. Duplicate-color pairs are skipped as a colorblindness verdict (they fail for everyone, not
// because of colorblindness), so an exact duplicate does not show up as a "failing pair".
var dupeEval = palette.evaluatePalette(['#336699', '#336699']);
assert(dupeEval.pairs.length === 0, 'a pair that is already indistinguishable in normal vision is not scored as a colorblind failure');

// 6. suggestSafePalette: sized to the request, capped at the 8 Okabe-Ito colors, cap flagged.
var suggestion = palette.suggestSafePalette(4);
assert(suggestion.colors.length === 4, 'suggestSafePalette returns the requested count');
assert(!suggestion.capped, 'suggestSafePalette does not flag a cap when under 8');
var bigSuggestion = palette.suggestSafePalette(12);
assert(bigSuggestion.colors.length === 8, 'suggestSafePalette caps at 8 colors');
assert(bigSuggestion.capped === true, 'suggestSafePalette flags when the request exceeds the safe set');

// 7. Power BI theme.json: parses as valid JSON with the expected dataColors array.
var themeColors = suggestion.colors.map(function (c) { return c.hex; });
var themeObj = palette.buildPowerBiTheme('Colorblind safe demo', themeColors);
var themeJsonText = JSON.stringify(themeObj, null, 2);
var reparsed = JSON.parse(themeJsonText);
assert(Array.isArray(reparsed.dataColors), 'Power BI theme.json parses back with a dataColors array');
assert(reparsed.dataColors.length === themeColors.length, 'Power BI theme.json dataColors has the expected length');
assert(reparsed.dataColors[0] === themeColors[0], 'Power BI theme.json dataColors matches the suggested palette');
assert(typeof reparsed.name === 'string' && reparsed.name.length > 0, 'Power BI theme.json has a non-empty name');

// 8. Tableau palette snippet: valid-looking XML with one <color> per palette entry.
var tableauXml = palette.buildTableauPaletteXml('Colorblind safe demo', themeColors);
assert(tableauXml.indexOf('<color-palette') !== -1, 'Tableau snippet has a color-palette element');
var colorTagCount = (tableauXml.match(/<color>/g) || []).length;
assert(colorTagCount === themeColors.length, 'Tableau snippet has one <color> tag per palette entry');
themeColors.forEach(function (hex) {
  assert(tableauXml.indexOf(hex.toUpperCase()) !== -1, 'Tableau snippet includes ' + hex);
});

// 9. No em-dash anywhere in user-facing generated strings (copy rule).
assert(themeJsonText.indexOf(EM) === -1, 'Power BI theme.json has no em-dash');
assert(tableauXml.indexOf(EM) === -1, 'Tableau snippet has no em-dash');
palette.SIMULATION_TYPES.forEach(function (t) {
  assert(t.label.indexOf(EM) === -1 && t.note.indexOf(EM) === -1, t.id + ' label/note has no em-dash');
});
palette.SAFE_PALETTE.forEach(function (c) {
  assert(c.name.indexOf(EM) === -1, c.name + ' safe-palette name has no em-dash');
});

console.log('\n' + passed + ' assertions passed.');
process.exit(0);
