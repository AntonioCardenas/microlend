# LendingChain — Design System & Rules

## Brand Identity
- **Name:** LendingChain
- **Atmosphere:** Sovereign, institutional, disciplined fintech. Built with the aesthetic of high-assurance cross-border financial infrastructure (Stripe, Mercury, Wise, Brex).
- **Voice:** Calm, grounded, precise, non-speculative. Factual numbers, strict stewardship, zero hype.

## Color Tokens (Fintech Deep Blue & Indigo)
- **Canvas Base:** `#080c16` (Deep Sovereign Blue-Black)
- **Surface Elevation 1 (Card/Panel):** `#0e1526` with `border: 1px solid #1e293b`
- **Surface Elevation 2 (Inputs/Inner):** `#090e1a` with `border: 1px solid #172554`
- **Primary Brand Accent (Indigo):** `#4f46e5` (Hover: `#4338ca`, Active: `#3730a3`)
- **Deep Blue Accent:** `#1e40af` / `#1d4ed8`
- **Success / On-Chain Verified (Emerald Slate):** `#059669` / `#10b981`
- **Text Primary:** `#f8fafc` (High Contrast)
- **Text Secondary:** `#94a3b8` (Balanced Legibility)
- **Text Muted:** `#64748b`

## Strict Constraints & Anti-Patterns
1. **NO PURPLE / VIOLET:** Completely excluded. All accents use disciplined Indigo or Deep Blue.
2. **NO GRADIENTS:** Solid, structured, architectural color only. Buttons, text, and panels use solid fills.
3. **NEVER USE EMOJIS:** All visual representations must use authored SVGs or Phosphor icons. Country flags are replaced with ISO alpha-2 country badges (`MA`, `GT`, `GH`, `KE`, `VN`, `JO`).
4. **PHOSPHOR ICONS:** All icons must be from `@phosphor-icons/react` with consistent stroke weight (regular or bold).
5. **TYPOGRAPHY:**
   - Headings: `Syne` (weights 600, 700, 800)
   - Body & Controls: `DM Sans` (weights 400, 500, 600)
   - Financial & On-Chain Data: `JetBrains Mono` with `tabular-nums`
6. **NO GRAY ON COLOR:** Text on buttons or badges must have a contrast ratio of ≥4.5:1.
7. **NO UNCALIBRATED BOUNCE EASING:** Exponential deceleration (`cubic-bezier(0.16, 1, 0.3, 1)`).
