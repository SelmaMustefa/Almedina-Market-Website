# Almedina Market — Full Website Update

A comprehensive update covering branding, content, authentication, responsiveness, and UI/UX improvements across the entire codebase.

## User Review Required

> [!IMPORTANT]
> **Branding change**: The current name "Almadina Grocery" will be replaced with **"Almedina Market"** everywhere. The `brand.ts` constants file already says "Almedina Market" but most components still use the old hardcoded name.

> [!IMPORTANT]
> **Saudi Arabia references removal**: All "Saudi Arabia", "Saudi Imports", "Saudi Arabian" tags and descriptions will be removed or replaced with generic "imported food" language. Product `origin` fields will be changed from "Saudi Arabia" to just the city/region, and the `isSaudiImport` field will be renamed to `isImported` throughout.

> [!WARNING]
> **Facebook & Twitter auth removal**: These social login buttons will be permanently removed from `AuthModal.tsx`. Only Google sign-in and email/password will remain.

## Open Questions

> [!IMPORTANT]
> **Logo image**: The file `src/assets/images/logo.png` already exists in the project. I will use this as the new logo everywhere. Is this the correct file?

> [!NOTE]
> **Product data**: The mock products currently reference Saudi-specific origins (e.g., "Riyadh, Saudi Arabia", "Jeddah, Saudi Arabia"). I will change these to just the city names or use more generic labels like "Imported" to match the "general imported food" branding. The product names themselves (Ajwa dates, Almarai milk, etc.) are actual product brands and will remain unchanged.

---

## Proposed Changes

### 1. Entry HTML & Meta

#### [MODIFY] [index.html](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/index.html)
- Change `<title>` from "Almadina Grocery - Authentic Saudi Arabian Imports" → **"Almedina Market — Premium Imported Food Products"**
- Add `<meta name="description">` tag with new branding

---

### 2. Brand Constants

#### [MODIFY] [brand.ts](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/constants/brand.ts)
- Already correct (`Almedina Market`). No changes needed.

---

### 3. Type Definitions

#### [MODIFY] [index.ts](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/types/index.ts)
- Rename `isSaudiImport: boolean` → `isImported: boolean`
- Update origin field comment

---

### 4. Mock Data

#### [MODIFY] [mockData.ts](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/data/mockData.ts)
- Replace `Almadina Grocery` → `Almedina Market` in store name and comments
- Remove "Saudi" from all category names/descriptions (e.g., "Dates & Saudi Sweets" → "Dates & Sweets")
- Remove "Saudi Arabia" from all product origins (e.g., "Riyadh, Saudi Arabia" → "Riyadh")
- Rename all `isSaudiImport` → `isImported`
- Remove "Saudi" from product names where it's just a descriptor (e.g., "Saudi Al Kabeer" → "Al Kabeer")
- Update FAQ answers to say "Almedina Market" instead of "Almadina Grocery"

---

### 5. Authentication

#### [MODIFY] [AuthModal.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/storefront/AuthModal.tsx)
- Remove `FacebookIcon` component and `TwitterIcon` component
- Remove the two `<SocialButton>` entries for Facebook and Twitter
- Keep only Google sign-in as the social option
- Update "Welcome back to Almadina" → "Welcome back to Almedina Market"

---

### 6. Header

#### [MODIFY] [Header.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/storefront/Header.tsx)
- Replace "Almadina Grocery" → "Almedina Market"
- Remove "Saudi Imports" badge tag
- Remove "Single-Vendor E-Commerce" subtitle → "Bethel, Addis Ababa"
- Replace old phone `+251 911 00 22 33` → `+251 9 55348181` and `tel:+251911002233` → `tel:+251955348181`
- Remove "Direct Imported Saudi Arabian Grocery & Foods" → "Premium Imported Food Products"
- Replace search placeholder from Saudi-specific to generic
- Replace Arabic logo div with actual `<Logo>` component image
- Add **hamburger menu** for mobile navigation (currently mobile only shows cart icon)

---

### 7. Hero Banner

#### [MODIFY] [HeroBanner.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/storefront/HeroBanner.tsx)
- Remove "Direct Saudi Imports" badge → "Premium Imported Foods"
- Rewrite h1: "Authentic Saudi Arabian Grocery..." → New engaging headline
- Rewrite description: Short, concise, engaging paragraph about Almedina Market offering imported food products
- Remove "Saudi" from badge texts

---

### 8. Product Card & Product Detail Modal

#### [MODIFY] [ProductCard.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/storefront/ProductCard.tsx)
- Change `isSaudiImport` → `isImported`
- Change "Saudi Import" badge text → "Imported"

#### [MODIFY] [ProductDetailModal.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/storefront/ProductDetailModal.tsx)
- Change `isSaudiImport` → `isImported`
- Change "Saudi Arabian Import" badge text → "Imported Product"

---

### 9. Main App (Footer, About, Contact, Catalog Section)

#### [MODIFY] [App.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/App.tsx)
- **Footer**: Replace "Almadina Grocery" → "Almedina Market", replace old phone number, update copyright
- **Footer description**: Remove "Saudi Arabian" references → "premium imported food products"
- **Catalog section**: Replace "Saudi Arabian Imports" heading → "All Products"
- Replace "No matching Saudi products found" → "No matching products found"
- **About section**: Rewrite to remove Saudi-only references, describe as general imported food
- **Contact modal**: Replace "Contact Almadina Store Owner" → "Contact Almedina Market"
- Replace old phone number `+251 911 00 22 33` → `+251 9 55348181`
- Replace Arabic logo div with `<Logo>` component in footer

---

### 10. Admin Components

#### [MODIFY] [AdminSidebar.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/admin/AdminSidebar.tsx)
- Replace "Almadina Grocery Admin" → "Almedina Market Admin"

#### [MODIFY] [ChapaPaymentSimulator.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/storefront/ChapaPaymentSimulator.tsx)
- Replace "Almadina Grocery (Bethel)" → "Almedina Market (Bethel)"

#### [MODIFY] [DesignSpecsView.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/common/DesignSpecsView.tsx)
- Replace "Almadina Grocery" → "Almedina Market"

---

### 11. Common Components

#### [MODIFY] [PlatformRoleBar.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/components/common/PlatformRoleBar.tsx)
- "ALMADINA" badge is fine (brand abbreviation) — no change needed

---

### 12. AppContext

#### [MODIFY] [AppContext.tsx](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/context/AppContext.tsx)
- Replace "Almadina" → "Almedina Market" in toast messages

---

### 13. Responsive Design & UI/UX (CSS + Component Updates)

#### [MODIFY] [index.css](file:///c:/Users/PC/Documents/Selma%20projects/internship%20project/almadina-market/src/index.css)
- Add responsive utility styles
- Add mobile hamburger menu animation styles
- Add smooth scroll behavior
- Add focus-visible styles for accessibility
- Add touch-friendly button sizing utilities

#### Header Responsive Overhaul
- Add hamburger menu icon (Menu/X toggle) for mobile
- Collapsible mobile navigation drawer with all nav items
- Stack search bar full-width on mobile
- Show all action buttons in mobile drawer

#### App.tsx Responsive Updates
- Footer grid: 4-col → 2-col on tablet → 1-col on mobile
- Modal widths constrained with proper padding on small screens
- All grids already have responsive classes but need verification

#### General responsive patterns across all components:
- Ensure all modals use `max-h-[90vh]` and proper overflow on mobile
- Buttons min-height 44px for touch targets
- No horizontal overflow anywhere
- Text truncation where needed

---

## Verification Plan

### Automated Tests
- `npm run lint` to verify TypeScript compilation after renaming `isSaudiImport` → `isImported`
- `npm run dev` to verify the app starts without errors

### Manual Verification
- Search entire codebase for remaining "Saudi" references
- Search for remaining "Almadina Grocery" references
- Search for old phone number `911 00 22 33`
- Verify logo displays correctly
- Test responsive layout at 320px, 375px, 768px, 1024px, 1440px
- Verify hamburger menu works on mobile
- Verify Facebook/Twitter auth buttons are removed
