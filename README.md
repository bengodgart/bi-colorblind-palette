# Colorblind Palette Checker

A free, single-page tool that simulates your dashboard's colors for the three common types of colorblindness, gives you a pass/fail verdict naming the exact pairs that fail, and exports a fixed palette straight into Power BI or Tableau. Everything runs in your browser. No data leaves the page, no accounts, no backend.

> About 1 in 12 men has some form of red-green colorblindness. If your dashboard leans on red and green to mean "bad" and "good," a chunk of your audience cannot read it. This checks that in under two minutes and hands you the fix.

## Why this exists

BI developers pick chart colors constantly, usually red for bad, green for good, sometimes amber in between. That palette is exactly the one that fails for the most common forms of colorblindness. General colorblind simulators exist (Coblis, Color Oracle) and will show you the problem, but none of them hand you a file you can drop into your BI tool. This does both: the simulation and verdict, and a ready-to-use Power BI theme.json and Tableau palette for the fix.

## Use it

Open `index.html` in any browser (or the live version linked in the repo description). No install.

1. Paste your hex colors, separated by commas, spaces, or new lines (or click one of the two example buttons).
2. Click **Check palette** to see each color simulated for protanopia, deuteranopia, and tritanopia.
3. Read the verdict. If it fails, each failing pair is named along with which colorblind type it fails for.
4. Copy or download the suggested safe palette's Power BI theme.json or Tableau color-palette snippet.

## Example output

Checking a firebrick red against a dark olive green, a real-world "traffic light" red/green pair, produces this verdict:

> Fails: 1 color pair becomes hard to tell apart for at least one colorblind type.
>
> #b22222 and #556b2f collapse for deuteranopia. These two look clearly different normally, but nearly the same to someone with deuteranopia (green-blind, the most common form, about 5% of men).

The spot check behind that verdict, run directly against the shipped simulation code:

- `#b22222` vs `#556b2f`: distinct in normal vision (distance 208.5), collapses under deuteranopia simulation (distance 40.7, below the 50 threshold).
- `#1f77b4` vs `#ff7f0e` (the suggested-safe blue/orange pair): stays clearly distinguishable in all three types (316.2 / 364.8 / 412.9), all well above the threshold.

## Run the tests

```bash
node test.js
```

45 assertions cover hex parsing, the ErrorAlert-style "collect every bad token" behavior, the colorblind simulation spot-checked against a known unsafe pair and a known safe pair, the safe-palette suggestion, and both file exports.

## How it works

- `palette.js` holds the pure logic: hex parsing, the colorblind simulation matrices, the pass/fail distance check, the suggested safe palette, and the Power BI / Tableau export builders. It runs in both the browser and Node, so the same logic that renders the page is the logic the tests check.
- The simulation uses the Machado, Oliveira & Fernandes (2009) dichromacy matrices, applied in linear RGB, the same model used by Chrome DevTools' vision-deficiency emulation.
- A pair is flagged as a colorblind-specific failure only if it is clearly distinct in normal vision but collapses under simulation; two colors that are already too close for anyone to tell apart are treated as a duplicate-color issue, not a colorblindness one.
- The suggested safe palette is the Okabe-Ito set (Okabe and Ito, 2008, "Color Universal Design"), the standard colorblind-safe qualitative palette, capped at its 8 colors.
- `app.js` is the DOM wiring. `index.html` and `styles.css` are the page.

## Tech notes

Zero dependencies, zero build step, static hosting. Your data never leaves the browser because there is no server to send it to.

## License

MIT, see [LICENSE](LICENSE).
