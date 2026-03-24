# The Design System: Editorial Elegance for Beauty & Wellness

## 1. Overview & Creative North Star: "The Digital Aesthetician"
This design system moves beyond the utility of a booking tool to become a high-end digital concierge. Our Creative North Star, **"The Digital Aesthetician,"** dictates a UI that feels as curated and precise as a luxury salon treatment. 

We reject the "templated" mobile look by embracing **Intentional Asymmetry** and **Tonal Depth**. While we strictly adhere to Apple’s Human Interface Guidelines (HIG) for functional patterns, our visual soul is driven by editorial layouts—think high-fashion digital magazines. We use white space not just as a separator, but as a luxury material. Through overlapping elements and sophisticated glassmorphism, we create an experience that feels fluid, premium, and deeply personal.

---

## 2. Colors: Tonal Sophistication
Our palette is rooted in the Rose Pink accent, but its power lies in how it interacts with neutral surfaces.

*   **Accent (Primary):** `#FF2D6B` (Rose Pink) - Used sparingly for high-intent actions.
*   **Surface Hierarchy:** 
    *   `surface-container-lowest` (#FFFFFF / #000000) for the primary canvas.
    *   `surface-container-low` (#F3F3F8 / #1C1C1E) for secondary content areas.
    *   `surface-container-highest` (#E2E2E7 / #2C2C2E) for elevated interactive elements.

**The "No-Line" Rule:** 
To maintain a high-end aesthetic, strictly prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. A `surface-container-low` section sitting on a `surface` background creates a natural, soft boundary that feels architectural rather than "constructed."

**The "Glass & Gradient" Rule:** 
Floating elements (navigation bars, action sheets) must utilize Apple’s `systemUltraThinMaterial` blur. For hero buttons or primary CTAs, use a subtle linear gradient from `primary` (#FF2D6B) to `primary_container` (#E40E5A) to provide a 3D "lit-from-within" glow that flat color cannot replicate.

---

## 3. Typography: Editorial Authority
We utilize the SF Pro family to create a clear, authoritative hierarchy that guides the user through the booking journey.

*   **Large Title (34pt Bold):** Used only for top-level landing views.
*   **Title 1-3 (28pt to 20pt):** These are our "Editorial Hooks." Use Title 1 for salon names and Title 3 for service categories.
*   **Headline (17pt Semibold):** The workhorse for section headers and primary button labels.
*   **Body (17pt Regular):** Optimized for readability in service descriptions.
*   **SF Mono (Prices/Times):** We use Mono for numerical data (e.g., "$120.00" or "14:30"). The fixed-width character set provides a technical, "receipt-like" precision that contrasts beautifully with the organic curves of SF Pro Display.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a feeling, not a drop shadow.

*   **The Layering Principle:** Stacking surface-container tiers is the primary method of hierarchy. Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a "soft lift" that feels native to iOS.
*   **Ambient Shadows:** For high-priority floating cards, use a "Bloom Shadow": 
    *   X: 0, Y: 10, Blur: 30.
    *   Opacity: 6% of the `on-surface` color.
    *   This mimics the way soft studio lighting hits a surface.
*   **The Ghost Border:** If a boundary is required for accessibility, use the `outline-variant` token at 15% opacity. Never use high-contrast, opaque borders.
*   **Glassmorphism:** Navigation bars and tab bars must always use backdrop-blur effects. This allows the vibrant colors of salon photography to bleed through the UI, making the app feel integrated with its content.

---

## 5. Components: Refined Primitives

*   **Buttons:**
    *   *Primary:* Rose Pink gradient, 12pt (md) radius, Headline Semibold text.
    *   *Secondary:* `surface-container-high` background with Primary colored text. No border.
*   **Cards & Lists:** 
    *   Follow the **Inset Grouped** style. 
    *   **Strict Rule:** No divider lines between list items. Use 12px (`3`) or 16px (`4`) vertical spacing to separate services. Let the typography and imagery do the heavy lifting.
*   **Chips (Categories/Filters):** 
    *   Use a 10pt (sm) squircle radius. Unselected states should be `surface-container-low`. Selected states use the Primary accent with white text.
*   **Inputs:** 
    *   12pt radius. Background: `surface-container-low`. Label: Secondary (60% opacity) positioned above the field. No bottom-line-only inputs.
*   **The "Booking Sheet":** 
    *   A bespoke component using a `systemThickMaterial` backdrop blur. It should partially obscure the salon's imagery, creating a layered, "looking-through-glass" effect during the checkout process.

---

## 6. Do’s and Don’ts

### Do
*   **Use Squircled Corners:** Always use the "Continuous" corner setting in design tools (14pt for cards) to match the Apple hardware.
*   **Embrace Materials:** Use `thinMaterial` for secondary overlays to maintain the "Depth" philosophy.
*   **Align to the 8pt Grid:** Ensure all spacing (8, 16, 24, 32) is mathematically consistent to provide a sense of rhythmic calm.

### Don't
*   **No Material FABs:** Floating Action Buttons have no place here. Primary actions belong in the bottom bar or as full-width sticky buttons.
*   **No Text on Raw Images:** Never place text directly over a photo. Always use a gradient scrim (bottom-up) or a material blur card.
*   **No 1px Lines:** Do not use lines to separate content sections. Use the `surface-container` background shifts to define "zones" of information.
*   **No Generic Icons:** Use SF Symbols/Ionicons exclusively in their "Line" or "Outline" weights. Never use filled icons unless they represent an active/selected state.