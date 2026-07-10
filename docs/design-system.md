# Spreadsheet Design System

This app uses an app-local design system, not a separate component package. The
source of truth is the CSS token set in `src/app/App.css`, with spreadsheet-specific
surfaces consuming those tokens from `src/widgets/sheet-grid/grid.css` and
`src/app/overlays.css`.

## Principles

- Preserve the current spreadsheet feel: dense, quiet, utility-first, and built
  for repeated scanning.
- Reuse existing styling before adding new component-specific values.
- Minimize decorative lines, borders, shadows, and ornament. Add visual
  separation only when it improves reading or interaction accuracy.
- Keep controls compact. Prefer the existing spacing, type, radius, and state
  tokens over new one-off CSS literals.
- Keep grid behavior variables local when they are functional, such as formula
  reference colors or selection overlays.

## Token Source

`src/app/App.css` defines the shared token categories:

| Category | Prefix examples | Purpose |
|---|---|---|
| Typography | `--sheet-font-*` | UI font families, type sizes, line height, and weights |
| Color | `--sheet-color-*` | Text, muted text, surfaces, borders, semantic states, and accent colors |
| Interaction state | `--sheet-state-*` | Selection fills, hover fills, focus overlays, and modal scrim |
| Shadow | `--sheet-shadow-*` | Existing menu, popover, panel, and dialog elevation |
| Radius | `--sheet-radius-*` | Control, tab, panel, keyboard token, and round control radii |
| Spacing | `--sheet-space-*` | Compact 2px to 24px spacing scale used by chrome and overlays |
| Size | `--sheet-size-*` | Small control sizes and grid cell minimum height |

## Surface Map

| Surface | Tokenized styles | Notes |
|---|---|---|
| App shell | `--sheet-color-surface-muted`, `--sheet-color-text`, `--sheet-font-ui` | Sets the base spreadsheet canvas and UI type. |
| Toolbar and formula bar | `--sheet-color-surface`, `--sheet-color-border`, `--sheet-color-accent`, `--sheet-radius-control`, `--sheet-space-*` | Keep toolbar controls compact and aligned with the formula input. |
| Grid chrome | `--sheet-color-surface`, `--sheet-color-surface-muted`, `--sheet-color-border-subtle`, `--sheet-color-accent-muted` | Row and column headers should stay understated; active states use the accent family. |
| Cell interaction states | `--sheet-color-accent`, `--sheet-state-accent-selected`, `--sheet-state-accent-outline`, `--sheet-state-accent-preview` | Selection, focus, merged cells, freeze dividers, and previews use the same accent system. |
| Formula affordances | `--formula-ref-color`, `--formula-ref-bg`, plus semantic seed tokens | Formula reference colors remain functional CSS variables so each range can carry its own color. |
| Menus and popovers | `--sheet-color-surface`, `--sheet-color-border`, `--sheet-color-hover`, `--sheet-shadow-menu`, `--sheet-shadow-popover` | Context menus and overflow menus share the same quiet surface treatment. |
| Tabs and status bar | `--sheet-color-surface-muted`, `--sheet-color-hover`, `--sheet-color-selected`, `--sheet-color-muted` | Sheet tabs and footer status should read as spreadsheet chrome, not as separate cards. |
| Dialog shells | `--sheet-state-scrim`, `--sheet-color-surface`, `--sheet-radius-panel`, `--sheet-shadow-dialog` | Dialogs use the existing panel radius and elevation; avoid extra borders unless needed for clarity. |

## Usage Rules

- Use an existing token when a new UI value matches an established surface,
  state, or spacing role.
- Add a token only when the value is shared or semantic. Keep one-off geometry,
  such as a fill handle size or note-corner triangle, local to the component.
- Do not introduce a new palette for a feature panel. Start with the spreadsheet
  surface, muted text, border, hover, selected, and accent tokens.
- Do not add decorative section cards, gradient backgrounds, or ornamental
  dividers. The app should remain a working spreadsheet first.
- For focus, selection, and active states, prefer the existing accent tokens
  before inventing new state colors.
- Preserve the functional formula reference variables in grid CSS. They are part
  of formula editing behavior, not general brand tokens.

## Verification

For docs-only or CSS-token changes, run:

```sh
git diff --check
pnpm exec tsc --noEmit --pretty false
```

Browser rendering is still useful for UI changes, but local file dependencies
must resolve before using it as a merge gate.
