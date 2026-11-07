---
name: STRIDE
description: Plan Better. Move Forward. High-craft tactile productivity command center.
colors:
  primary: "#111111"
  neutral-bg: "#F1F1F3"
  surface: "#F7F7F9"
  card: "#FFFFFF"
  dark-bg: "#0F0F11"
  dark-surface: "#18181B"
  secondary: "#77777D"
  accent-green: "#10B981"
  accent-amber: "#F59E0B"
  accent-red: "#EF4444"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "#262626"
  card-tactile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System

## Overview

STRIDE embodies a calm, high-craft, tactile editorial aesthetic. Designed for intense focus sessions, the interface avoids loud neon halos, gratuitous gradients, and feature-bloat clutter. Instead, it prioritizes optical clarity, balanced typography, subtle depth layers, and responsive micro-interactions.

## Colors & Single Source of Truth

All colors are controlled in one central location in `frontend/src/index.css` via CSS Custom Properties with RGB channel tuples for Tailwind opacity support (`text-primary/80`, `bg-card/90`).

### Central Theme Tokens (`frontend/src/index.css`)
- **Canvas / App Ground (`--color-bg-app`)**:
  - Light: `241 241 243` (`#F1F1F3`)
  - Dark: `15 15 17` (`#0F0F11`)
- **Surface (`--color-bg-surface`)**:
  - Light: `247 247 249` (`#F7F7F9`)
  - Dark: `24 24 27` (`#18181B`)
- **Cards & Elevated Elements (`--color-bg-card`)**:
  - Light: `255 255 255` (`#FFFFFF`)
  - Dark: `24 24 27` (`#18181B` / `#1C1C20`)
- **Text Primary (`--color-text-primary`)**:
  - Light: `17 17 17` (`#111111` - Deep Ink Black)
  - Dark: `244 244 246` (`#F4F4F6` - Crisp High-Contrast White)
- **Text Secondary (`--color-text-secondary`)**:
  - Light: `119 119 125` (`#77777D`)
  - Dark: `148 148 156` (`#94949C`)
- **Borders (`--border-subtle` & `--border-strong`)**:
  - Light: `rgba(0, 0, 0, 0.06)` / `rgba(0, 0, 0, 0.12)`
  - Dark: `rgba(255, 255, 255, 0.08)` / `rgba(255, 255, 255, 0.16)`
- **Accent & Primary Action (`--color-accent-primary` & `--color-accent-fg`)**:
  - Light: `17 17 17` with white text `255 255 255`
  - Dark: `255 255 255` with dark text `17 17 17`
- **Status Accents**:
  - Emerald (`#10B981`): Complete, active session, synchronized state.
  - Amber (`#F59E0B`): Streaks, high priority, in-progress timers.
  - Red (`#EF4444`): Urgent priority tags, alerts.

### How to Edit the Color System
To customize any color across the entire application:
1. Open `frontend/src/index.css`.
2. Edit the desired RGB channel tuple under `:root` (for light mode) or `html.dark` (for dark mode).
3. The change instantly propagates across all components, cards, inputs, and text without requiring edits to individual JSX/TSX files.

## Typography

- **Font Family**: Inter, paired with clean tabular numbers for timers and streaks.
- **Hierarchy**:
  - Hero Display: 48px–72px, font-extrabold, tight line-height (1.08), tracking -0.03em.
  - Section Headlines: 30px–48px, font-extrabold, tracking -0.02em.
  - Body Copy: 14px–16px, font-normal, line-height 1.6.
  - Micro Labels / Monospace: 10px–12px, font-mono, tracking-wider.

## Layout

- **Grid & Containers**: Max container width `max-w-7xl` with responsive padding (`px-4 sm:px-6 lg:px-8`).
- **Rhythm**: Generous vertical breathing room between sections (`py-20 md:py-28`) balanced by tight, compact spacing within functional component groups.

## Elevation & Depth

- **Tactile Shadows**: Multi-stop soft ambient shadows (`0 4px 12px rgba(0, 0, 0, 0.05)`).
- **Borders**: Micro-precision 1px borders (`rgba(0, 0, 0, 0.06)` in light mode, `rgba(255, 255, 255, 0.08)` in dark mode).
- **No Harsh Blocks**: Avoid zero-blur neobrutalist block shadows or zero-offset color halos.

## Shapes

- **Corner Radii**:
  - Buttons & Inputs: `12px` (`rounded-xl`).
  - Cards & Small Widgets: `16px` (`rounded-2xl`).
  - Hero Mockup & Large Callouts: `24px` (`rounded-3xl`).

## Components

- **Navigation Bar**: Sticky, glass-morphism backdrop blur (`bg-[#F1F1F3]/85 backdrop-blur-md`), brand monogram, section anchors, theme toggle, and dynamic auth state.
- **Interactive Showcase Frame**: Multi-tab live preview (Tasks, Pomodoro Timer, Habit Streak Heatmap, Milestone Progress) with real clickable states.
- **Buttons**:
  - Primary: High-contrast ink / paper with bold weight and tactile hover opacity.
  - Secondary: Crisp bordered container with subtle background hover lift.
- **FAQ Accordion**: Single-expand disclosure cards with smooth chevron transitions.

## Do's and Don'ts

### Do
- Maintain high-contrast ratios (>= 4.5:1 for body copy).
- Theme browser surfaces (selection color, custom scrollbars, focus rings).
- Use authentic Lucide icons with consistent stroke widths.
- Ensure light and dark themes look equally polished and native.

### Don't
- Don't use text gradient fills.
- Don't use redundant kicker or eyebrow labels above self-evident headings.
- Don't construct generic three-card icon-heading-paragraph grids.
- Don't use simulated progress circles in place of real interactive state.
