---
version: alpha
name: Copycat
description: Compact dark desktop clipboard history for Windows.
colors:
  background: "#101a2b"
  surface: "#151e2e"
  border: "#242f45"
  text: "#eef1f6"
  muted: "#93a0b4"
  action: "#45a1f9"
  primary: "#45a1f9"
  file: "#6ad799"
  favorite: "#e8b339"
  danger: "#e05d5d"
typography:
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
rounded:
  control: "9px"
  navigation: "10px"
omitted:
  - section: spacing
    reason: "Existing component CSS owns the compact desktop spacing."
components:
  navigation: {}
  card: {}
  dialog: {}
---

# Copycat Design System

## Overview

Copycat is a fast Windows clipboard workbench: a narrow navigation rail and a dense card area, not a full document manager. The dark blue surfaces and restrained semantic accents are established in `src/renderer/index.css`; this file records those decisions rather than generating CSS. Russian is the default interface language; English can be selected in settings. User content and category names are never translated. Release notes are English.

## Colors

The `:root` custom properties in `src/renderer/index.css` are canonical. Blue marks copied text and safe actions; green marks file and image objects; gold marks favorites; red marks destructive actions. Muted text remains legible against the dark surfaces.
Object-opening buttons share the `--open-bg`, `--open-hover`, and `--open-text` tokens in card and detail views.

## Typography

The runtime body uses the system UI stack. Controls and card labels remain compact; full filenames and paths must remain reachable when truncated.

## Layout

The sidebar is a continuous hit surface: neighboring rows have no dead cursor gaps. Card scrolling belongs to the main pane. The first-run window is 1000×619; saved user bounds override it. Dialogs fit inside the viewport and keep actions reachable. A hidden window retains its active search, view, and draft; the sidebar's two expansion states reset to saved preferences when the window returns.

## Elevation & Depth

Borders and nearby dark surfaces establish hierarchy. Overlays carry the strongest elevation; navigation rows should not gain decorative shadows.

## Shapes

Navigation rows use the established 10px radius; fields and controls use about 9px. Icons are simple strokes, sized for compact desktop controls.
The application logo comes from `resources/small/small.png`; the sidebar keeps its rounded `sidebar-logo` corners. Windows installer and shortcuts use the matching `small.ico`.

## Components

Creation offers text or an object reference where the section permits it. File subgroup creation locks the target type. Object selection uses the system picker and stores a path, not a duplicate. Favorite and category choices are visible before saving. Destructive history cleanup keeps favorites and categories excluded by default.

## Do's and Don'ts

- Do keep hit targets continuous without increasing row height.
- Do preserve source files when saving object references.
- Don't let visual type selection differ from the saved item kind.
- Don't introduce decorative motion into dense navigation.
