# UI Consistency Instructions for Projections and Financials Pages

## Overview
Make visual consistency improvements between the Projections page and Financials page to prevent layout shifts and create a unified user experience when switching between tabs.

## Key Visual Consistency Requirements

### **1. Fixed Table Dimensions**
- **Same table width** for both Projections and Financials pages (prevent layout shifts)
- **Standardized column widths**:
  - Metric column: `200px` fixed width
  - Year columns: `120px` each, regardless of data presence
- **Same row heights** for all metric rows across both pages

### **2. Consistent Typography & Spacing**
- **Match font sizes** exactly between both pages
- **Same row padding/margins** for all metric rows
- **Same number formatting style** (currency symbols, decimal places, etc.)
- **Consistent text alignment**: left for metrics, right for numbers

### **3. Layout Structure Standardization**
- **Projections page**: Keep current flat structure (no section headers to avoid unnecessary height)
- **Financials page**: Keep current grouped sections with headers
- **Same table borders/backgrounds** across both pages
- **Consistent hover states** and interactive elements

### **4. Color Coding Rules**
- **Financials page**: Use green/red color coding for growth percentages (historical data)
- **Projections page**: Do NOT color code percentage year-over-year changes (since this is user input data, not historical performance)
- **Consistent text colors** for all other elements

### **5. Header Layout Consistency**
Both pages should use identical header format:
```
[TICKER NAME - Large, centered]
STOCK PRICE: $XXX.XX    MKT.CAP: $X.XXT    [Additional metrics as needed]
```

### **6. Table Structure**
- **Fixed table layout** (`table-layout: fixed`) to ensure consistent column widths
- **Same cell padding** and spacing across both pages
- **Consistent number formatting** and alignment
- **Same visual treatment** for metric names and values

## Implementation Priority

### **Phase 1: Critical Layout Fixes**
- Set fixed table dimensions (no more layout shifts between pages)
- Standardize column structure and widths
- Ensure consistent header layout across both pages

### **Phase 2: Visual Standardization**
- Match typography, spacing, and sizing exactly
- Apply consistent table styling (borders, backgrounds, hover states)
- Ensure number formatting is identical

### **Phase 3: Color Coding Implementation**
- Apply green/red growth indicators to Financials page only
- Keep Projections page growth percentages neutral colored
- Maintain consistent text colors for all other elements

## Expected Result
Users can switch between Projections and Financials tabs without experiencing:
- Layout shifts or table size changes
- Visual inconsistencies in styling
- Different interaction patterns
- Confusing color coding differences

The pages should feel like parts of the same unified interface while maintaining their distinct data presentation needs.