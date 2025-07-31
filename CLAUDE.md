# Project Development Requirements

## Current Features

### Feature: Stock Metrics
**Status:** In Development

#### Overview
Build a stock metrics display component that fetches and renders key financial data with benchmark comparisons.

#### Backend Requirements
- Create API endpoint to fetch stock metrics data
- Handle API response and error states appropriately
- Implement caching/refresh logic as needed

#### Frontend Requirements

**Header Display**
Show stock price and market cap prominently at the top:
STOCK PRICE: $76.72 | MKT.CAP 79.02B

**Metrics Table**
Display remaining metrics in a 3-column table:
- **Metric**: Financial metric name
- **Value**: Formatted metric value  
- **Benchmark Range**: Comparative context

**Sample Table Format:**
| Metric | Value | Benchmark Range |
|--------|-------|----------------|
| **TTM PE** | 17.80 | Many stocks trade at 20-28 |
| **Forward PE** | 17.13 | Many stocks trade at 18-26 |
| **2 Year Forward PE** | 15.97 | Many stocks trade at 16-24 |
| **TTM EPS Growth** | 15.37% | Many stocks trade at 8-12% |
| **Current Yr Exp EPS Growth** | 7.60% | Many stocks trade at 8-12% |
| **Next Year EPS Growth** | 12.64% | Many stocks trade at 8-12% |
| **TTM Rev Growth** | 8.66% | Many stocks trade at 4.5-6.5% |
| **Current Yr Exp Rev Growth** | 8.67% | Many stocks trade at 4.5-6.5% |
| **Next Year Rev Growth** | 8.95% | Many stocks trade at 4.5-6.5% |
| **Gross Margin** | 40.23% | Many stocks trade at 40-48% |
| **Net Margin** | 14.31% | Many stocks trade at 8-10% |
| **TTM P/S Ratio** | 2.55 | Many stocks trade at 1.8-2.6 |
| **Forward P/S Ratio** | 2.54 | Many stocks trade at 1.8-2.6 |

#### Data Formatting Rules
- **Currency**: Use $ symbol with appropriate decimals
- **Large numbers**: Format with B (billions), M (millions) 
- **Percentages**: Show % symbol with 2 decimal places
- **Ratios**: Display with 2 decimal places

#### Technical Requirements
- Responsive table design
- Loading states during API calls
- Graceful handling of missing/null values
- Error messaging for failed requests

---

## Upcoming Features
*Add future features here*

## Completed Features  
*Move completed features here*