## Instructions for Claude Code: Bento Box Home Page (home-v2.tsx)

Create a new home page route at `/home-v2` that implements the Bento Box layout. Keep the existing home page at `/` unchanged.

**File structure:**
- Create new file: `app/routes/home-v2.tsx` (copy from `app/routes/home.tsx` as starting point)
- Keep existing `app/routes/home.tsx` unchanged
- Reuse existing components where possible

**Bento Box Layout:**

```
[Hero section - same as current]
    ↓
[Stats bar - same as current]
    ↓
┌─────────────────────────────────────────┐
│  Grid container (max-width: 1400px)     │
│                                         │
│  ┌────────────┬────────────┐           │
│  │  Search    │  Compare   │  ← Row 1  │
│  │  (50%)     │  (50%)     │           │
│  └────────────┴────────────┘           │
│                                         │
│  ┌─────────────────────────┐           │
│  │  Projections (100%)     │  ← Row 2  │
│  │  Featured/Hero          │           │
│  └─────────────────────────┘           │
│                                         │
│  ┌────────────┬────────────┐           │
│  │ Financials │   Charts   │  ← Row 3  │
│  │  (50%)     │   (50%)    │           │
│  └────────────┴────────────┘           │
└─────────────────────────────────────────┘
    ↓
[Footer - same as current]
```

**Specific requirements:**

1. **Grid Layout:**
   - Container: max-width 1400px, centered
   - Gap between tiles: 24px
   - Row 1: 2 columns (Search, Compare)
   - Row 2: 1 column spanning full width (Projections)
   - Row 3: 2 columns (Financials, Charts)

2. **Tile Styling:**
   - Background: white
   - Border: 1px solid #e5e7eb
   - Border-radius: 12px
   - Padding: 32px
   - Box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05)
   - Hover: lift up 4px with stronger shadow

3. **Content per Tile:**
   - Feature name (h3, 24px, bold)
   - Headline (p, 18px, gray-600)
   - Screenshot (width: 100% of tile, maintain aspect ratio)
   - 2 bullets (14px, with checkmark icons)
   - CTA link (blue, with arrow icon)

4. **Screenshot Sizes:**
   - Search/Compare/Financials/Charts tiles: screenshot ~600px wide (50% of 1400px container minus gap)
   - Projections tile: screenshot ~1200px wide (full container width)

5. **Responsive:**
   - Desktop (>1024px): 3-row grid as described
   - Tablet (768-1024px): Stack all tiles vertically, full width
   - Mobile (<768px): Stack vertically, smaller padding (16px)

6. **Feature Order:**
   - Row 1 Left: Search
   - Row 1 Right: Compare
   - Row 2 Full: Projections (emphasized with different background color #f0f9ff light blue)
   - Row 3 Left: Financials
   - Row 3 Right: Charts

7. **Route Setup:**
   - New route accessible at `http://localhost:5173/home-v2`
   - Do NOT modify existing `/` or `home.tsx` route
   - Copy hero section, stats bar, and footer from existing home page
   - Only change the feature modules section to Bento Box layout

8. **Text Content:**
   Use the same shortened copy from the current home page:
   - Search: "Find Hidden Gems in Seconds"
   - Compare: "Stop Comparing Apples to Oranges"
   - Projections: "Model Your Own Financial Scenarios"
   - Financials: "History + Forecasts in One View"
   - Charts: "Visualize Financial Trends"

**Implementation notes:**
- Use CSS Grid for the layout (`display: grid`, `grid-template-columns`)
- Projections tile should have subtle visual emphasis (light blue background, slightly larger text)
- All tiles should have same height within their row
- Screenshots should be responsive images with `object-fit: contain`
- Add smooth transitions for hover effects (300ms ease)
- Ensure accessibility with proper heading hierarchy and alt text

Test by navigating to `/home-v2` - the original home page at `/` should remain completely unchanged.