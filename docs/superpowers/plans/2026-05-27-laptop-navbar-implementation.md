# Laptop Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the navbar to a compact horizontal row on laptop screens (>720px) to save vertical space.

**Architecture:** Use CSS Media Queries to switch the `AppNavbar` from a stacked mobile layout to a single-row horizontal layout. Unify branding, navigation, and user actions.

**Tech Stack:** Next.js, React, Lucide React, Tailwind CSS / Vanilla CSS (globals.css).

---

### Task 1: Update Global Styles for Laptop Navbar

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add responsive navbar styles to globals.css**

Update the `@media (min-width: 721px)` block to include the horizontal row layout and sticky positioning.

```css
/* app/globals.css */

/* ... around line 2137 ... */
@media (min-width: 721px) {
  .app-navbar {
    position: sticky;
    top: 22px; /* Match medapp-shell padding */
    z-index: 100;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 24px;
    backdrop-filter: blur(8px);
  }

  .medapp-shell > .app-navbar {
    margin-bottom: 22px;
  }

  .app-navbar-header {
    display: flex;
    align-items: center;
    padding: 0 !important;
    background: transparent !important;
  }

  .app-navbar-brand {
    gap: 10px;
  }

  .app-navbar-brand strong {
    font-size: 1.2rem;
  }

  .app-navbar-brand span:not(.app-navbar-logo) {
    font-size: 0.65rem;
    margin-left: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .app-navbar-nav {
    display: flex !important;
    grid-template-columns: none !important;
    align-items: center !important;
    gap: 28px !important;
    min-height: auto !important;
    padding: 0 !important;
    border-bottom: none !important;
  }

  .app-navbar-nav-item {
    flex-direction: row !important;
    min-height: 64px !important;
    gap: 8px !important;
    font-size: 0.85rem !important;
    padding: 0 4px !important;
    border-bottom: 3px solid transparent;
  }

  .app-navbar-nav-item.is-active {
    border-bottom-color: #087749;
  }

  .app-navbar-nav-item.is-active::after {
    display: none; /* Remove mobile-style indicator */
  }

  .app-navbar-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}
```

- [ ] **Step 2: Commit global styles**

```bash
git add app/globals.css
git commit -m "style: add horizontal navbar layout for laptops"
```

---

### Task 2: Refactor AppNavbar Component

**Files:**
- Modify: `components/AppNavbar/AppNavbar.tsx`

- [ ] **Step 1: Remove HeartPulse icon and adjust branding**

Remove the `HeartPulse` icon and simplify the branding structure.

```tsx
// components/AppNavbar/AppNavbar.tsx

// Remove HeartPulse from imports if unused elsewhere
// ...

export function AppNavbar({ active, displayName, email, isAdmin = false }: AppNavbarProps) {
  return (
    <div className="app-navbar">
      <header className="nauka-mobile-header app-navbar-header">
        <Link href="/" className="nauka-mobile-brand app-navbar-brand" aria-label="MedApp Anatomy Studio">
          {/* REMOVE HeartPulse logo span */}
          <div>
            <strong>MedApp</strong>
            <span>Anatomy Studio</span>
          </div>
        </Link>
        
        {/* ... */}
```

- [ ] **Step 2: Update navItems to be consistent**

Ensure `profil` is handled correctly in the loop if needed, although it's already in `navItems`.

- [ ] **Step 3: Add conditional rendering for user menu in laptop view**

Ensure the `app-navbar-actions` block correctly displays the bell and user menu in the unified row.

- [ ] **Step 4: Commit component changes**

```bash
git add components/AppNavbar/AppNavbar.tsx
git commit -m "feat: refactor AppNavbar to support horizontal layout and remove heart icon"
```

---

### Task 3: Adjust AppShell for Laptop Layout

**Files:**
- Modify: `components/AppShell/AppShell.tsx`

- [ ] **Step 1: Hide legacy topbar on laptops when new navbar is active**

The `app-legacy-topbar` should probably be hidden if the new `AppNavbar` takes over.

```tsx
// components/AppShell/AppShell.tsx

// Ensure .app-legacy-topbar is hidden via CSS or conditional rendering
```

Actually, `globals.css` already has:
```css
.app-legacy-topbar,
.quiz-legacy-header,
.nauka-legacy-header,
.nauka-mobile-page > .nauka-mobile-header,
.nauka-mobile-page > .nauka-mobile-nav {
  display: none !important;
}
```
So we just need to ensure `AppShell` doesn't have overlapping elements.

- [ ] **Step 2: Verify sticky behavior**

Run the app (if possible) or verify that `medapp-grid` doesn't overlap with the sticky navbar.

- [ ] **Step 3: Commit shell adjustments**

```bash
git add components/AppShell/AppShell.tsx
git commit -m "refactor: sync AppShell with new horizontal navbar"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Visual check of the navbar**

Verify:
1. No heart icon.
2. Icons present in nav items.
3. Row layout on wide screens.
4. Correct colors (Dark Green for active, Muted for others).
5. Sticky behavior works.

- [ ] **Step 2: Final Commit**

```bash
git commit --allow-empty -m "chore: laptop navbar refactor complete"
```
