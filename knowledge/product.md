---
type: Product
title: bi-colorblind-palette
description: 'Simulate your dashboard colours for the three common types of colourblindness, get a pass or fail verdict naming the exact pairs that fail, and export a fixed palette straight into Power BI or Tableau.'
domain: Data & Analytics
users: 'BI developers picking chart colours in Power BI or Tableau, who reach for red and green by default.'
lifecycle: shipped
live_url: https://bengodgart.github.io/bi-colorblind-palette/
pricing: 'Free. MIT licensed, no accounts.'
generated:
  by: claude-opus-5
  at: '2026-07-29T04:31:42+00:00'
status: stable
resource: https://github.com/bengodgart/bi-colorblind-palette.git
---

# bi-colorblind-palette

Simulate your dashboard colours for the three common types of colourblindness, get a pass or
fail verdict naming the exact pairs that fail, and export a fixed palette straight into
Power BI or Tableau.

## Who it is for

BI developers picking chart colours in Power BI or Tableau, who reach for red and green by
default.

## What problem it solves

About 1 in 12 men has some form of red-green colourblindness. A dashboard that leans on red
and green to mean bad and good is unreadable for a chunk of its audience, and that palette
is exactly the one BI developers reach for first.

General colourblind simulators exist and will show you the problem, but none of them hand
you a file you can drop into your BI tool. This does both: the simulation and a verdict that
names each failing pair and which type it fails for, then a ready-to-use Power BI
`theme.json` or Tableau palette snippet for the fix.

A pair is flagged as a colourblindness failure only when it is clearly distinct in normal
vision but collapses under simulation. Two colours already too close for anyone to tell
apart are reported as a duplicate-colour issue instead, which keeps the verdict honest.

## Current state

Shipped and public on GitHub Pages. The simulation uses the Machado, Oliveira and Fernandes
(2009) dichromacy matrices applied in linear RGB, the same model as the Chrome DevTools
vision-deficiency emulation. The suggested safe palette is the Okabe-Ito set (2008, Color
Universal Design), capped at its 8 colours.
