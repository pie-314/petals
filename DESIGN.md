# Design System

## Stack
- framework: vanilla-js
- styling: vanilla-css
- components: custom-html
- animation: css-transition-transform
- icons: inline-svg

## Tokens
- brand: #00e5ff (Electric Cyan)
- bg-base: #07090e (Obsidian)
- text-primary: #f4f6fa (Ice White)
- radius: 16px
- shadow: layered-glow

## Decisions
- 2026-06-20 — init: vanilla-js/css detected. Custom polygraph console theme applied.
- 2026-06-20 — add: side drawer detail view for Anakin Agentic Search telemetry.
- 2026-06-20 — theme: refactored styling for high-fidelity dark-pro theme matching visual-fidelity and motion presets. Added skeleton-shimmers, ECG waves, and spring panel animations.

## Components
- [public/index.html](file:///mnt/data/programming/petals/public/index.html) — Main application page containing:
  - `ribbon-wrapper`: Top scrolling tape ticker showing divergence deltas.
  - `control-card`: Tactile dial category tabs and manual refresh command.
  - `board-table`: Node telemetry board rendering inline custom Tension Cord SVGs and skeleton shimmers.
  - `anomaly-card`: Neon-accented warning cards detailing extreme social and market outliers with ECG waves.
  - `diagnostics-card`: Monospace scrolling console reporting real-time system logs.
  - `explain-drawer`: Sliding spring panel displaying Anakin Agentic Search summaries.

