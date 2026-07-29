---
type: Tech Stack
title: bi-colorblind-palette stack
description: 'Frameworks, storage and services bi-colorblind-palette runs on.'
runtime: Browser
framework: 'None. Plain HTML, CSS and JavaScript.'
build: 'None. Zero dependencies and zero build step.'
storage: 'None. No data leaves the page and there is no backend.'
hosting: GitHub Pages
tests: 'node test.js, 45 assertions'
generated:
  by: claude-opus-5
  at: '2026-07-29T04:24:12+00:00'
status: stable
---

# Stack

* **Runtime**: the browser. There is no server to send data to.
* **Framework**: none. Plain HTML, CSS and JavaScript.
* **Build**: none. Zero dependencies, zero build step, static hosting.
* **Files that carry the logic**: `palette.js` holds the pure logic, hex parsing, the
  colourblind simulation matrices, the pass or fail distance check, the suggested safe
  palette and the Power BI and Tableau export builders. `app.js` is the DOM wiring,
  `index.html` and `styles.css` are the page.
* **Hosting**: GitHub Pages.
* **Tests**: `node test.js`, 45 assertions covering hex parsing, the collect-every-bad-token
  error behaviour, the simulation spot-checked against a known unsafe and a known safe pair,
  the safe-palette suggestion and both file exports.

## Notes

`palette.js` runs in both the browser and Node, so the logic that renders the page is the
logic the tests check. The simulation model and the safe palette are both published academic
sources, cited in the README rather than invented.
