# Design Specification: Laptop Navbar Refactor

**Date:** 2026-05-27
**Topic:** Fixing Laptop Navbar Scaling
**Status:** Approved

## 1. Problem Statement
The current `AppNavbar` uses a mobile-first design (vertical stack of header and nav items) that persists on laptop-sized screens (>720px). This results in:
- Excessive vertical space usage (~150px).
- Visual clutter due to redundant brand/user elements.
- Poor scaling on professional laptop displays.

## 2. Proposed Solution
Transform the `AppNavbar` into a single horizontal row on screens wider than 720px. This row will unify the brand identity, navigation links, and user actions into a compact, professional header.

### 2.1 Layout Changes (>720px)
- **Unified Row:** One container with `display: flex; flex-direction: row; align-items: center; justify-content: space-between`.
- **Height:** Fixed height of `64px`.
- **Left Section:** Brand name ("MedApp Anatomy Studio") with refined typography. The `HeartPulse` icon will be removed as requested.
- **Center Section:** Navigation items (`Atlas`, `Explorer`, `Quiz`, `Nauka`, `Profil`) arranged horizontally with icons and labels.
- **Right Section:** Notification bell and user profile menu.

### 2.2 UI & Styling
- **Icons:** Use existing Lucide React icons (`House`, `Box`, `CircleQuestionMark`, `GraduationCap`, `UserRound`, `Bell`).
- **Stroke Width:** Maintain `strokeWidth={1.8}` for a light, professional look.
- **Color Palette:**
    - Active State: `#087749` (Dark Green) with a bottom border.
    - Default State: `#62584b` (Muted Ink).
    - Background: `rgba(251, 247, 238, 0.96)` with `backdrop-filter: blur(8px)`.
- **Sticky Positioning:** The navbar will be `position: sticky; top: 0; z-index: 100` to maximize usability.

## 3. Implementation Strategy
- **Responsive Design:** Use CSS media queries (`@media (min-width: 721px)`) to switch from mobile (stacked) to laptop (row) layout.
- **Component Refactor:** Update `AppNavbar.tsx` to handle the new horizontal layout.
- **Global Styles:** Add necessary utility classes or update `globals.css` to support the new dimensions and positioning.
- **AppShell Integration:** Ensure the `AppShell` correctly accounts for the new fixed height of the navbar to prevent content overlapping.

## 4. Success Criteria
- [ ] Navbar height on laptops is reduced to ~64px.
- [ ] All navigation links are visible and functional in a single row.
- [ ] UI colors and icons are consistent with the existing theme.
- [ ] The `HeartPulse` icon is removed from the laptop view.
- [ ] The navbar is sticky at the top of the viewport.
