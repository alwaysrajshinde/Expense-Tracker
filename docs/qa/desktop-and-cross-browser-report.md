# Desktop & Cross-Browser Regression Report — Personal Expense Tracker

**Author:** Senior QA Automation Engineer & Platform Compatibility Specialist  
**Application:** Personal Expense Tracker  
**Document Version:** 2.4.0-PROD  
**Date:** November 2026  

---

## 1. Executive Summary
While mobile-first architecture is the primary platform priority, the Personal Expense Tracker also serves desktop users via responsive progressive web app (PWA) layouts. This audit evaluates desktop presentation (1280x800 and 1920x1080), cross-browser compatibility across Chromium, WebKit (Safari), and Firefox engines, and Windows desktop header integration.

---

## 2. Cross-Browser & Desktop Test Matrix

| Platform / Engine | Resolution | Primary Focus | Results | Status |
|---|---|---|---|---|
| **Chromium Desktop** | 1280 x 800 | Multi-column grid, side-by-side charts, modal centering | All views responsive, cards align in 2-column & 4-column grids | **PASSED** |
| **Chromium Desktop (FHD)** | 1920 x 1080 | Max container width constraint (`max-w-7xl`), zero over-stretching | Layout contained comfortably with balanced margins | **PASSED** |
| **WebKit (Safari Engine)** | 390 x 844 | iOS touch events, SVG circle dash rendering, safe area insets | SVG donut renders smoothly, bottom navbar adheres to safe area | **PASSED** |
| **Firefox Engine** | 1280 x 800 | CSS backdrop-filter blur, custom scrollbar, input date pickers | Glassmorphism blur renders cleanly; custom dropdown cards active | **PASSED** |
| **Windows Desktop Frame** | 1280 x 800 | `WindowsHeader.jsx` integration, minimize/maximize buttons | Clean desktop header styling; notifications moved inside profile | **PASSED** |

---

## 3. Desktop UX & Layout Observations

### A. Side-by-Side Analytics Grid
On viewports >= 1024px (desktop), the Reports Overview page transitions into a clean two-column grid:
- **Left Column:** Category Donut Chart with normalized 360° closed ring and interactive legend.
- **Right Column:** Monthly Spending Trend 6-month continuous bar chart with spend highlight pills.

### B. Windows Frame & Header Integration
- Standalone notification bell was cleanly removed from `WindowsHeader.jsx`.
- Unread notification indicator is now housed on the user profile avatar in both desktop and mobile header bars.
- Eliminates visual clutter while retaining full access to notification history.

---

## 4. Conclusion
The application demonstrates strong desktop usability and cross-engine rendering consistency across Chromium, WebKit, and Firefox engines.
