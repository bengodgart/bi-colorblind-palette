---
type: Playbook
title: Run bi-colorblind-palette locally
description: 'How to open bi-colorblind-palette and run its tests on a dev machine.'
generated:
  by: claude-opus-5
  at: '2026-07-29T04:31:42+00:00'
status: stable
---

# Steps

1. Clone the repo: `git clone https://github.com/bengodgart/bi-colorblind-palette.git`
2. Open `index.html` in any browser. No install.
3. Paste hex colours separated by commas, spaces or new lines, or click one of the two
   example buttons, then click **Check palette**.

## Available scripts

* `node test.js` runs the test suite, 45 assertions.

There is no package manager step. The repo has zero dependencies.

## Common failures

* A pair that looks obviously different on screen can still fail. That is the point: the
  verdict is computed on the simulated colours, not the ones you see.
* Colours already too close to tell apart in normal vision are reported as a duplicate
  colour, not a colourblindness failure. That is deliberate, not a missed detection.

## Deploying

It is a static page, so GitHub Pages hosts it for $0. `publish-guide.html` in the repo has
the click path.
