# Cursor Instructions: Home Page Feature Modules (home-modules.md)

## Overview
Create simplified feature preview modules for the RSK stock analysis home page in `app/routes/home.tsx`. Each module showcases one of the five core features using actual screenshots from the application with a clean, navigation-style layout.

## Feature Modules Section

Create five distinct, full-width sections with alternating layouts (image-left/content-right, then flip). Each module presents a screenshot of the actual feature alongside descriptive content.

### Common Module Structure

Each module should include:
- **Header:** Navigation-style section label (Search, Compare, Projections, Financials, Charts)
- **Headline:** Clear, benefit-focused title
- **Description:** 1-2 sentence explanation of the feature's value
- **Feature Bullets:** 2 key capabilities (checkmark + text)
- **CTA Link:** "Explore [Feature] →" with hover effect
- **Screenshot:** Actual image of the feature in use with browser tab cropping

**Layout Pattern:**
- Desktop: Two-column grid (50/50 split), alternating image position
- Tablet: Single column, image above content
- Mobile: Stacked, image first

---

## Module 1: Stock Search

**Header:** "Search"

**Headline:** "Find Any Stock Instantly"

**Description:** 
"Access the metrics that matter – built for investors, by investors."

**Image:** Screenshot of the Search page showing stock with metrics displayed
- Position: Right side on desktop
- Alt text: "Stock search interface showing financial metrics for analysis"
- Browser tab cropping: CSS objectPosition '0 -140px' to hide top 140px

**Feature Bullets:**
- ✓ 10+ key financial indicators: P/E ratios, margins, growth rates, and more
- ✓ Industry benchmarking with contextual ranges

**CTA Link:** "Explore Search →"

---

## Module 2: Multi-Stock Comparison

**Header:** "Compare"

**Headline:** "Compare Stocks Side-by-Side"

**Description:** 
"Quickly see how stocks stack up side-by-side."

**Image:** Screenshot of the Compare page showing multiple stocks comparison
- Position: Left side on desktop
- Alt text: "Stock comparison table showing multiple stocks with performance metrics"
- Browser tab cropping: CSS objectPosition '0 -140px' to hide top 140px

**Feature Bullets:**
- ✓ Compare up to 3 stocks across key financial indicators
- ✓ Industry benchmarking with contextual ranges

**CTA Link:** "Start Comparing →"

---

## Module 3: Financial Projections

**Header:** "Projections"

**Headline:** "Model Your Own Financial Scenarios"

**Description:** 
"Create custom 5-year projections with your assumptions."

**Image:** Screenshot of the Projections page showing scenario modeling
- Position: Right side on desktop
- Alt text: "Financial projections calculator showing scenario modeling interface"
- Browser tab cropping: CSS objectPosition '0 -140px' to hide top 140px

**Feature Bullets:**
- ✓ Input revenue growth, net income growth, and PE ratios to project stock price and CAGR
- ✓ Build bear, base, and bull case scenarios

**CTA Link:** "Build Projections →"

---

## Module 4: Historical Financials

**Header:** "Financials"

**Headline:** "Financial History & Future Estimates"

**Description:** 
"Understand the company's financial trajectory at a glance."

**Image:** Screenshot of the Financials page showing historical data
- Position: Left side on desktop
- Alt text: "Historical financials table showing performance data and estimates"
- Browser tab cropping: CSS objectPosition '0 -140px' to hide top 140px

**Feature Bullets:**
- ✓ Year-over-year growth rates for every metric
- ✓ Combine historical data with analyst estimates for deeper insights

**CTA Link:** "View Financials →"

---

## Module 5: Interactive Charts

**Header:** "Charts"

**Headline:** "Visualize Financial Trends"

**Description:** 
"Recognize trends visually."

**Image:** Screenshot of the Charts page showing revenue trends
- Position: Right side on desktop
- Alt text: "Interactive charts showing historical and projected financial trends"
- Browser tab cropping: CSS objectPosition '0 -140px' to hide top 140px

**Feature Bullets:**
- ✓ View revenue, margin %, EPS, free cash flow, operating cash flow, and operating income charts
- ✓ Toggle between quarterly and TTM views

**CTA Link:** "Explore Charts →"

---

## Design Guidelines

### Color Palette
- **Primary Blue:** #2563eb (Search badge, buttons, links)
- **Secondary Orange:** #f97316 (Compare badge)
- **Purple:** #a855f7 (Projections badge)
- **Success Green:** #22c55e (Financials badge)
- **Teal:** #14b8a6 (Charts badge)
- **Gray Scale:** Background (#f9fafb), Cards (#ffffff), Text (#111827), Secondary text (#6b7280)

### Typography
- **Headings:** Bold, clear hierarchy
- **Body:** Readable, professional
- **Feature bullets:** Checkmark icon + concise text

### Component Structure

```typescript
// Reusable FeatureModule component
interface FeatureModule {
  id: string;
  header: string; // Navigation-style header (Search, Compare, etc.)
  headline: string;
  description: string;
  features: string[]; // Limited to 2 bullet points
  ctaText: string;
  ctaLink: string;
  image: {
    src: string;
    alt: string;
  };
  imagePosition: 'left' | 'right';
}
```

### Responsive Behavior
- **Desktop (1024px+):** Two-column layout, image and content side-by-side
- **Tablet (640-1024px):** Single column, image above content
- **Mobile (<640px):** Stacked, optimized for touch

### Animations & Interactions
- **Fade-in scroll animations:** Modules fade in with translate-y animation when entering viewport
- **Intersection Observer:** Triggers animation when 10% of module is visible with 100px bottom margin
- Hover effects on CTA links (underline, color shift)
- Smooth transitions between states
- Image hover: subtle scale or shadow effect

---

## Technical Implementation

### Tech Stack
- **Framework:** React with TypeScript (Remix)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React (for checkmarks, arrows)
- **Animations:** Framer Motion for scroll effects, CSS for simple transitions
- **Images:** Optimized WebP format with lazy loading

### Component Files Created
```
app/
├── routes/
│   └── home.tsx              # Main home page route
├── components/
│   ├── FeatureModule.tsx     # Reusable module component with scroll animations
│   └── FeatureList.tsx       # Bulleted feature list (2 items max)
└── constants/
    └── homeModules.ts        # Simplified module content data
```

**Note:** Badge.tsx component removed - headers now styled as navigation elements

### Module Data Structure

```typescript
// constants/homeModules.ts
export const featureModules: FeatureModule[] = [
  {
    id: 'search',
    header: 'Search',
    headline: 'Find Any Stock Instantly',
    description: 'Access the metrics that matter – built for investors, by investors.',
    features: [
      '10+ key financial indicators: P/E ratios, margins, growth rates, and more',
      'Industry benchmarking with contextual ranges'
    ],
    ctaText: 'Explore Search',
    ctaLink: '/search',
    image: {
      src: '/images/features/search.png',
      alt: 'Stock search interface showing financial metrics for analysis'
    },
    imagePosition: 'right'
  },
  {
    id: 'compare',
    header: 'Compare',
    headline: 'Compare Stocks Side-by-Side',
    description: 'Quickly see how stocks stack up side-by-side.',
    features: [
      'Compare up to 3 stocks across key financial indicators',
      'Industry benchmarking with contextual ranges'
    ],
    ctaText: 'Start Comparing',
    ctaLink: '/compare',
    image: {
      src: '/images/features/compare.png',
      alt: 'Stock comparison table showing multiple stocks with performance metrics'
    },
    imagePosition: 'left'
  },
  {
    id: 'projections',
    header: 'Projections',
    headline: 'Model Your Own Financial Scenarios',
    description: 'Create custom 5-year projections with your assumptions.',
    features: [
      'Input revenue growth, net income growth, and PE ratios to project stock price and CAGR',
      'Build bear, base, and bull case scenarios'
    ],
    ctaText: 'Build Projections',
    ctaLink: '/projections',
    image: {
      src: '/images/features/projections.png',
      alt: 'Financial projections calculator showing scenario modeling interface'
    },
    imagePosition: 'right'
  },
  {
    id: 'financials',
    header: 'Financials',
    headline: 'Financial History & Future Estimates',
    description: 'Understand the company\'s financial trajectory at a glance.',
    features: [
      'Year-over-year growth rates for every metric',
      'Combine historical data with analyst estimates for deeper insights'
    ],
    ctaText: 'View Financials',
    ctaLink: '/financials',
    image: {
      src: '/images/features/financials.png',
      alt: 'Historical financials table showing performance data and estimates'
    },
    imagePosition: 'left'
  },
  {
    id: 'charts',
    header: 'Charts',
    headline: 'Visualize Financial Trends',
    description: 'Recognize trends visually.',
    features: [
      'View revenue, margin %, EPS, free cash flow, operating cash flow, and operating income charts',
      'Toggle between quarterly and TTM views'
    ],
    ctaText: 'Explore Charts',
    ctaLink: '/charts',
    image: {
      src: '/images/features/charts.png',
      alt: 'Interactive charts showing historical and projected financial trends'
    },
    imagePosition: 'right'
  }
];
```

### Image Requirements
- **Format:** WebP with PNG fallback
- **Dimensions:** Minimum 800px wide for desktop displays
- **Optimization:** Compressed for web, lazy loaded
- **Naming Convention:** `[feature-name]-preview.png/webp`
- **Location:** `public/images/features/`

### Accessibility
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for all images
- Keyboard navigation support
- ARIA labels where appropriate
- Color contrast compliance (WCAG 2.1 AA)

---

## Implementation Steps

1. **Create Module Data**
   - Define all five modules in `constants/homeModules.ts`
   - Include all content, images, and configuration

2. **Build FeatureModule Component**
   - Create reusable component with props interface
   - Implement alternating layout logic
   - Add responsive styling with Tailwind
   - Include animation effects

3. **Add Images**
   - Export screenshots from actual feature pages
   - Optimize images for web
   - Place in `public/images/features/` directory
   - Create WebP versions

4. **Implement in Home Route**
   - Import module data and components
   - Map through modules array
   - Render FeatureModule components
   - Test responsive behavior

5. **Polish & Test**
   - Add scroll animations
   - Test on multiple screen sizes
   - Verify image loading and lazy load
   - Check accessibility compliance

---

## Success Criteria

Feature modules are complete when:
- ✅ All 5 modules render with correct content and images
- ✅ Alternating layout works correctly on desktop
- ✅ Responsive design functions on mobile and tablet
- ✅ Images load efficiently with lazy loading
- ✅ Scroll animations enhance user experience
- ✅ CTA links are properly styled and functional
- ✅ Accessibility requirements are met
- ✅ No console errors or broken images