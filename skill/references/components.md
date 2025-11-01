# Components Reference

Complete component hierarchy and interfaces for the Stock Insights UI.

## Component Tree Structure

```
app/
├── routes/                          # Page-level route components
│   ├── home.tsx                    # Landing page with features
│   ├── search.tsx                  # Stock metrics search
│   ├── compare.tsx                 # Multi-stock comparison
│   ├── charts.tsx                  # Financial charts page
│   ├── projections.tsx             # Stock price projections
│   ├── financials.tsx              # Financial statements
│   ├── pricing.tsx                 # Subscription pricing
│   ├── sign-in.tsx                 # Clerk authentication
│   ├── sign-up.tsx                 # Clerk registration
│   └── dashboard/                  # Dashboard layout
│       ├── layout.tsx              # Dashboard wrapper
│       ├── index.tsx               # Dashboard home
│       ├── chat.tsx                # AI chat interface
│       └── settings.tsx            # User settings
│
├── components/
│   ├── charts/                     # Chart components (Recharts wrappers)
│   │   ├── StockInput.tsx         # Stock ticker input form
│   │   ├── RevenueChart.tsx       # Quarterly revenue bar chart
│   │   ├── EPSChart.tsx           # Earnings per share bar chart
│   │   ├── MarginChart.tsx        # Profit margins line chart
│   │   ├── OperatingIncomeChart.tsx  # Operating income bar chart
│   │
│   ├── homepage/                   # Landing page sections
│   │   ├── navbar.tsx             # Main navigation
│   │   ├── content.tsx            # Hero section
│   │   ├── integrations.tsx       # Tech stack showcase
│   │   ├── pricing.tsx            # Pricing cards
│   │   ├── team.tsx               # Team section
│   │   └── footer.tsx             # Footer links
│   │
│   ├── dashboard/                  # Dashboard UI components
│   │   ├── site-header.tsx        # Dashboard header
│   │   ├── app-sidebar.tsx        # Sidebar navigation
│   │   ├── nav-main.tsx           # Main nav links
│   │   ├── nav-secondary.tsx      # Secondary nav
│   │   ├── nav-user.tsx           # User profile menu
│   │   ├── section-cards.tsx      # Dashboard cards
│   │   └── chart-area-interactive.tsx  # Interactive charts
│   │
│   ├── stock-search-header.tsx    # Stock search with info display
│   ├── subscription-status.tsx    # User subscription badge
│   ├── FeatureModule.tsx          # Feature card component
│   ├── FeatureList.tsx            # Features grid
│   ├── Badge.tsx                  # Custom badge component
│   ├── logo.tsx                   # App logo
│   │
│   ├── logos/                      # Tech logo components
│   │   ├── index.ts               # Exports all logos
│   │   ├── Polar.tsx
│   │   ├── ReactIcon.tsx
│   │   ├── ReactRouter.tsx
│   │   ├── TailwindIcon.tsx
│   │   └── Typescript.tsx
│   │
│   └── ui/                         # shadcn/ui base components
│       ├── button.tsx             # Button (Radix Slot)
│       ├── card.tsx               # Card with header/content
│       ├── input.tsx              # Text input
│       ├── label.tsx              # Form label
│       ├── select.tsx             # Select dropdown (Radix)
│       ├── table.tsx              # Table elements
│       ├── tabs.tsx               # Tabs (Radix)
│       ├── dialog.tsx             # Modal dialog (Radix)
│       ├── dropdown-menu.tsx      # Dropdown menu (Radix)
│       ├── chart.tsx              # Chart container wrapper
│       ├── tooltip.tsx            # Tooltip (Radix)
│       ├── avatar.tsx             # User avatar (Radix)
│       ├── badge.tsx              # Badge component
│       ├── checkbox.tsx           # Checkbox (Radix)
│       ├── separator.tsx          # Divider (Radix)
│       ├── sheet.tsx              # Slide-out panel (Radix)
│       ├── sidebar.tsx            # Sidebar layout
│       ├── skeleton.tsx           # Loading skeleton
│       ├── toggle.tsx             # Toggle button (Radix)
│       └── toggle-group.tsx       # Toggle group (Radix)
```

## Page Components (Routes)

### home.tsx
**Path**: `/`  
**Purpose**: Landing page with hero, features, pricing, and team sections.  
**Key Features**:
- Marketing homepage
- Feature showcase with images
- Pricing cards with Stripe integration
- Responsive navbar with authentication

### search.tsx
**Path**: `/search`  
**Purpose**: Search and view key stock metrics (PE ratios, growth rates, margins).  
**Key Features**:
- Stock symbol search with autocomplete
- Metrics display in organized tables
- Stock info header (price, market cap)
- Data fetched from `/metrics` endpoint

### compare.tsx
**Path**: `/compare`  
**Purpose**: Side-by-side comparison of up to 3 stocks.  
**Key Features**:
- Multi-ticker search (comma-separated)
- Comparative metrics table
- Highlights best/worst values
- Data fetched from `/metrics` for each ticker

### charts.tsx
**Path**: `/charts`  
**Purpose**: Interactive financial charts with quarterly/TTM toggle.  
**Key Features**:
- Revenue, EPS, margins, operating income, cash flow charts
- Quarterly vs TTM mode toggle
- Responsive Recharts visualizations
- Data fetched from `/charts` endpoint

**Loader**:
```tsx
export async function loader({ request }: Route.LoaderArgs) {
  // Can fetch initial data server-side
  return json({ initialTicker: "AAPL" });
}
```

### projections.tsx
**Path**: `/projections`  
**Purpose**: Calculate future stock price projections with custom inputs.  
**Key Features**:
- Three scenario calculator (base, bull, bear)
- Input revenue growth, net income growth, PE ratios
- Calculate projected stock prices and CAGR
- Interactive table with keyboard navigation
- Data from `/projections` endpoint

### financials.tsx
**Path**: `/financials`  
**Purpose**: View historical and estimated financial statements.  
**Key Features**:
- Historical income statement data
- Analyst estimates for future years
- Growth rate calculations
- Organized by sections (Revenue, Margins, Income, EPS)
- Data from `/financials` endpoint

## Chart Components

### StockInput
**File**: `app/components/charts/StockInput.tsx`  
**Purpose**: Reusable stock ticker input form with submit button.

**Props Interface**:
```tsx
interface StockInputProps {
  onSearch: (ticker: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

**Usage**:
```tsx
<StockInput 
  onSearch={handleSearch}
  loading={loading}
  error={errorMessage}
/>
```

**Key Features**:
- Uppercase ticker conversion
- Enter key submit
- Loading state
- Error display with icon
- Disabled when loading

---

### RevenueChart
**File**: `app/components/charts/RevenueChart.tsx`  
**Purpose**: Display quarterly revenue as bar chart.

**Props Interface**:
```tsx
interface ChartData {
  quarters: string[];
  revenue: number[];
  eps: number[];
  gross_margin: (number | null)[];
  net_margin: (number | null)[];
  operating_income: (number | null)[];
}

interface RevenueChartProps {
  data: ChartData;
}
```

**Usage**:
```tsx
const chartsState = useChartsState();
<RevenueChart data={chartsState.data} />
```

**Key Features**:
- Converts revenue to billions ($B)
- Golden amber color (#F59E0B)
- Responsive container (300px height)
- Formatted tooltip ($XX.XXB)
- Rounded top corners on bars

---

### EPSChart
**File**: `app/components/charts/EPSChart.tsx`  
**Purpose**: Display quarterly earnings per share as bar chart.

**Props Interface**:
```tsx
interface EPSChartProps {
  data: ChartData; // Same as RevenueChart
}
```

**Usage**:
```tsx
<EPSChart data={chartsState.data} />
```

**Key Features**:
- Same styling as RevenueChart
- Displays EPS with 2 decimal precision
- Tooltip shows $X.XX format
- Golden amber bars

---

### MarginChart
**File**: `app/components/charts/MarginChart.tsx`  
**Purpose**: Display profit margins (gross & net) as line chart.

**Props Interface**:
```tsx
interface MarginChartProps {
  data: ChartData; // Same structure
}
```

**Key Features**:
- Dual lines (gross margin, net margin)
- Percentage Y-axis (%)
- Different colors per line
- Handles null values gracefully

---

### OperatingIncomeChart
**File**: `app/components/charts/OperatingIncomeChart.tsx`  
**Purpose**: Display quarterly operating income as bar chart.

**Key Features**:
- Converts to billions like revenue
- Same golden amber color
- Consistent with other bar charts

## Header Components

### StockSearchHeader
**File**: `app/components/stock-search-header.tsx`  
**Purpose**: Combined search input and stock info display header.

**Props Interface**:
```tsx
interface StockSearchHeaderProps {
  stockSymbol: string;
  onStockSymbolChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
  ticker?: string;
  stockPrice?: number | null;
  marketCap?: number | null;
  sharesOutstanding?: number | null;
  showSharesOutstanding?: boolean;
  formatCurrency: (value: number | null | undefined) => string;
  formatNumber: (value: number | null | undefined) => string;
}
```

**Usage**:
```tsx
<StockSearchHeader
  stockSymbol={ticker}
  onStockSymbolChange={setTicker}
  onSearch={handleSearch}
  loading={loading}
  ticker={stockInfo.data?.ticker}
  stockPrice={stockInfo.data?.price}
  marketCap={stockInfo.data?.market_cap}
  formatCurrency={formatCurrency}
  formatNumber={formatNumber}
/>
```

**Key Features**:
- Search input with search icon button
- Stock info display (price, market cap, shares)
- Conditional shares outstanding display
- Centered layout
- Responsive design

---

### SubscriptionStatus
**File**: `app/components/subscription-status.tsx`  
**Purpose**: Display user's subscription tier badge.

**Key Features**:
- Checks Clerk user metadata
- Shows "Free" or "Premium" badge
- Used in dashboard header

## Homepage Components

### Navbar
**File**: `app/components/homepage/navbar.tsx`  
**Purpose**: Main navigation with authentication buttons.

**Key Features**:
- Logo with link to home
- Auth buttons (Sign In / Sign Up / Dashboard)
- Mobile responsive menu
- Clerk integration

---

### Content (Hero)
**File**: `app/components/homepage/content.tsx`  
**Purpose**: Hero section with headline and CTA.

**Key Features**:
- Large headline text
- Description paragraph
- Call-to-action buttons
- Background gradient

---

### Integrations
**File**: `app/components/homepage/integrations.tsx`  
**Purpose**: Showcase tech stack with logos.

**Key Features**:
- Grid of tech logos
- React, TypeScript, Tailwind, etc.
- Responsive grid layout

---

### Pricing
**File**: `app/components/homepage/pricing.tsx`  
**Purpose**: Pricing cards with feature lists.

**Key Features**:
- Free and Premium tiers
- Feature comparison list
- CTA buttons
- Stripe checkout integration

## Feature Components

### FeatureModule
**File**: `app/components/FeatureModule.tsx`  
**Purpose**: Individual feature card with image and description.

**Props Interface**:
```tsx
interface FeatureModuleProps {
  title: string;
  description: string;
  path: string;
  imgSrc?: string;
  imgAlt?: string;
}
```

**Usage**:
```tsx
<FeatureModule
  title="Charts"
  description="View revenue, margins, EPS charts"
  path="/charts"
  imgSrc="/images/features/charts.png"
  imgAlt="Charts feature"
/>
```

**Key Features**:
- Clickable card linking to feature page
- Optional image display
- Hover effects
- Responsive layout

---

### FeatureList
**File**: `app/components/FeatureList.tsx`  
**Purpose**: Grid of feature cards from constants.

**Key Features**:
- Maps over `homeModules` constant
- Responsive grid (2-3 columns)
- Uses FeatureModule components

## UI Components (shadcn/ui)

### Button
**File**: `app/components/ui/button.tsx`  
**Purpose**: Base button component with variants.

**Variants**:
- `default` - Primary blue button
- `destructive` - Red danger button
- `outline` - Border only
- `secondary` - Gray background
- `ghost` - No background
- `link` - Text link style

**Sizes**:
- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square icon button

**Usage**:
```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

---

### Card
**File**: `app/components/ui/card.tsx`  
**Purpose**: Container card with header, title, description, content, and footer.

**Components**:
- `Card` - Outer container
- `CardHeader` - Top section
- `CardTitle` - Title text
- `CardDescription` - Subtitle text
- `CardContent` - Main content area
- `CardFooter` - Bottom section

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

### Input
**File**: `app/components/ui/input.tsx`  
**Purpose**: Text input field.

**Usage**:
```tsx
<Input
  type="text"
  placeholder="Enter value"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="uppercase"
/>
```

---

### Table
**File**: `app/components/ui/table.tsx`  
**Purpose**: Semantic table components.

**Components**:
- `Table` - Table container
- `TableHeader` - `<thead>`
- `TableBody` - `<tbody>`
- `TableRow` - `<tr>`
- `TableHead` - `<th>`
- `TableCell` - `<td>`
- `TableCaption` - Caption

**Usage**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Metric</TableHead>
      <TableHead>Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>PE Ratio</TableCell>
      <TableCell>25.4</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Tabs
**File**: `app/components/ui/tabs.tsx`  
**Purpose**: Tabbed interface (Radix UI).

**Components**:
- `Tabs` - Container with value state
- `TabsList` - Tab buttons container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Panel content

**Usage**:
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Content 1
  </TabsContent>
  <TabsContent value="tab2">
    Content 2
  </TabsContent>
</Tabs>
```

---

### ChartContainer
**File**: `app/components/ui/chart.tsx`  
**Purpose**: Wrapper for Recharts with shadcn styling.

**Props**:
```tsx
interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
  };
}
```

**Usage**:
```tsx
const chartConfig = {
  revenue: { label: "Revenue", color: "#F59E0B" }
};

<ChartContainer config={chartConfig}>
  <ResponsiveContainer>
    <BarChart data={data}>
      {/* Chart components */}
    </BarChart>
  </ResponsiveContainer>
</ChartContainer>
```

## Data Flow Pattern

1. **Route Component** fetches data via Zustand actions:
   ```tsx
   const actions = useStockActions();
   await actions.fetchCharts('AAPL', 'quarterly', authenticatedFetch);
   ```

2. **Zustand Store** caches response and updates state:
   ```tsx
   const chartsState = useChartsState();
   // chartsState.data, chartsState.loading, chartsState.error
   ```

3. **Child Components** receive data via props:
   ```tsx
   <RevenueChart data={chartsState.data} />
   ```

4. **Chart Components** transform and render:
   ```tsx
   const chartData = data.quarters.map((q, i) => ({
     quarter: q,
     revenue: data.revenue[i]
   }));
   ```

## Common Patterns

### Loading States
```tsx
{loading ? (
  <Skeleton className="h-8 w-full" />
) : (
  <div>{content}</div>
)}
```

### Error Display
```tsx
{error && (
  <div className="flex items-center gap-2 text-red-600">
    <AlertCircle className="h-4 w-4" />
    {error}
  </div>
)}
```

### Conditional Rendering
```tsx
{data && <Component data={data} />}
{!data && <EmptyState />}
```

### Format Utilities
```tsx
// Currency
const formatCurrency = (value: number | null) => {
  if (!value) return "N/A";
  return `$${(value / 1e9).toFixed(2)}B`;
};

// Percentage
const formatPercentage = (value: number | null) => {
  if (value === null) return "N/A";
  return `${value.toFixed(2)}%`;
};
```

