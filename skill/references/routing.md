# Routing Reference

React Router 7 file-based routing configuration and patterns.

## React Router 7 Configuration

**File**: `app/routes.ts`

```tsx
import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("compare", "routes/compare.tsx"),
  route("charts", "routes/charts.tsx"),
  route("projections", "routes/projections.tsx"),
  route("financials", "routes/financials.tsx"),
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("success", "routes/success.tsx"),
  route("subscription-required", "routes/subscription-required.tsx"),
  // Catch-all route for unmatched URLs
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
```

## Route List

| Path | File | Purpose | Protected |
|------|------|---------|-----------|
| `/` | `routes/home.tsx` | Landing page | No |
| `/search` | `routes/search.tsx` | Stock metrics search | Yes |
| `/compare` | `routes/compare.tsx` | Multi-stock comparison | Yes |
| `/charts` | `routes/charts.tsx` | Financial charts | Yes |
| `/projections` | `routes/projections.tsx` | Stock price projections | Yes |
| `/financials` | `routes/financials.tsx` | Financial statements | Yes |
| `/pricing` | `routes/pricing.tsx` | Subscription pricing | No |
| `/sign-in/*` | `routes/sign-in.tsx` | Clerk sign in | No |
| `/sign-up/*` | `routes/sign-up.tsx` | Clerk sign up | No |
| `/success` | `routes/success.tsx` | Payment success | Yes |
| `/subscription-required` | `routes/subscription-required.tsx` | Paywall page | Yes |
| `/*` | `routes/$.tsx` | 404 catch-all | No |

## Root Layout

**File**: `app/root.tsx`

```tsx
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { ClerkProvider } from "@clerk/react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/root";
import "./app.css";
import { Analytics } from "@vercel/analytics/react";

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args);
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Analytics />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider
      loaderData={loaderData}
      signUpFallbackRedirectUrl="/"
      signInFallbackRedirectUrl="/"
    >
      <Outlet />
    </ClerkProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
```

## Route Component Pattern

Each route file can export:
- **default function** - The component to render
- **loader** - Server-side data loading (optional)
- **action** - Form submission handler (optional)
- **ErrorBoundary** - Route-specific error UI (optional)
- **headers** - HTTP headers (optional)
- **meta** - Page metadata (optional)

### Basic Route Example

```tsx
import type { Route } from "./+types/my-route";

// Optional: Server-side data loading
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const ticker = url.searchParams.get("ticker");
  
  // Can fetch data here
  return { ticker };
}

// The component
export default function MyRoute({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>My Route</h1>
      <p>Ticker: {loaderData?.ticker}</p>
    </div>
  );
}

// Optional: Route-specific error boundary
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <div>Error: {error.message}</div>;
}
```

## Navigation

### Link Component

```tsx
import { Link } from "react-router";

<Link to="/charts">View Charts</Link>
<Link to="/search?ticker=AAPL">Search AAPL</Link>
```

### useNavigate Hook

```tsx
import { useNavigate } from "react-router";

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate("/charts");
  };
  
  return <button onClick={handleClick}>Go to Charts</button>;
}
```

### NavLink (Active Styling)

```tsx
import { NavLink } from "react-router";

<NavLink 
  to="/charts"
  className={({ isActive }) => 
    isActive ? "text-blue-600 font-bold" : "text-gray-600"
  }
>
  Charts
</NavLink>
```

## Protected Routes Pattern

Protected routes use Clerk's authentication hooks:

```tsx
import { useAuth } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function ProtectedRoute({ loaderData }: Route.ComponentProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
  }, [isLoaded, isSignedIn, navigate]);
  
  // Show loading while checking auth
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  // Don't render until signed in
  if (!isSignedIn) {
    return null;
  }
  
  return (
    <div>
      {/* Protected content */}
    </div>
  );
}
```

## URL Parameters

### Query Parameters

**Reading query params**:
```tsx
import { useSearchParams } from "react-router";

function MyRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ticker = searchParams.get("ticker");
  
  // Update query params
  const updateTicker = (newTicker: string) => {
    setSearchParams({ ticker: newTicker });
  };
  
  return <div>Ticker: {ticker}</div>;
}
```

**In loader**:
```tsx
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const ticker = url.searchParams.get("ticker") || "AAPL";
  
  return { ticker };
}
```

### Route Parameters

For dynamic routes like `/stock/:ticker`, add to `routes.ts`:

```tsx
route("stock/:ticker", "routes/stock.$ticker.tsx"),
```

**Reading route params**:
```tsx
export async function loader({ params }: Route.LoaderArgs) {
  const ticker = params.ticker; // From URL
  return { ticker };
}

export default function StockRoute({ loaderData }: Route.ComponentProps) {
  return <div>Stock: {loaderData.ticker}</div>;
}
```

## Nested Routes (Dashboard Example)

Not currently used in the main app, but here's the pattern:

```tsx
// routes.ts
layout("dashboard/layout.tsx", [
  route("dashboard", "dashboard/index.tsx"),
  route("dashboard/chat", "dashboard/chat.tsx"),
  route("dashboard/settings", "dashboard/settings.tsx"),
])
```

**Layout file** (`dashboard/layout.tsx`):
```tsx
import { Outlet } from "react-router";

export default function DashboardLayout() {
  return (
    <div className="dashboard">
      <nav>{/* Dashboard nav */}</nav>
      <main>
        <Outlet /> {/* Nested route renders here */}
      </main>
    </div>
  );
}
```

## Form Actions

For handling form submissions:

```tsx
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const ticker = formData.get("ticker");
  
  // Process form data
  // Make API calls
  
  return { success: true };
}

export default function FormRoute({ actionData }: Route.ComponentProps) {
  return (
    <form method="post">
      <input name="ticker" />
      <button type="submit">Submit</button>
      {actionData?.success && <p>Success!</p>}
    </form>
  );
}
```

## Redirects

### Server-side redirect (in loader)

```tsx
import { redirect } from "react-router";

export async function loader() {
  const isAuthenticated = false; // Check auth
  
  if (!isAuthenticated) {
    return redirect("/sign-in");
  }
  
  return { data: "..." };
}
```

### Client-side redirect

```tsx
import { Navigate } from "react-router";

function MyRoute() {
  const isAuthenticated = false;
  
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return <div>Protected content</div>;
}
```

## Meta Tags (SEO)

```tsx
import type { Route } from "./+types/my-route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Stock Charts - Stock Insights" },
    { name: "description", content: "View interactive stock charts" },
    { property: "og:title", content: "Stock Charts" },
    { property: "og:description", content: "Interactive financial charts" },
  ];
}

export default function MyRoute() {
  return <div>Content</div>;
}
```

## Loading States

React Router 7 provides navigation state:

```tsx
import { useNavigation } from "react-router";

function Layout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      <Outlet />
    </div>
  );
}
```

## Route-Specific Headers

```tsx
export function headers() {
  return {
    "Cache-Control": "public, max-age=3600",
  };
}
```

## Common Patterns

### Page with Search Param Ticker

```tsx
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useStockActions, useChartsState } from "~/store/stockStore";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";

export default function ChartsRoute() {
  const [searchParams] = useSearchParams();
  const ticker = searchParams.get("ticker") || "AAPL";
  
  const chartsState = useChartsState();
  const actions = useStockActions();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  useEffect(() => {
    actions.fetchCharts(ticker, 'quarterly', authenticatedFetch);
  }, [ticker]);
  
  return (
    <div>
      {chartsState.loading && <p>Loading...</p>}
      {chartsState.data && <p>Charts for {ticker}</p>}
    </div>
  );
}
```

### Page with Global Ticker

```tsx
import { useGlobalTicker, useStockActions } from "~/store/stockStore";
import { useEffect } from "react";

export default function SomeRoute() {
  const globalTicker = useGlobalTicker();
  const actions = useStockActions();
  
  useEffect(() => {
    if (globalTicker.currentTicker) {
      // Load data for global ticker
      actions.fetchCharts(globalTicker.currentTicker);
    }
  }, [globalTicker.currentTicker]);
  
  return <div>Ticker: {globalTicker.currentTicker}</div>;
}
```

## Adding a New Route

1. **Create route file**: `app/routes/my-route.tsx`
2. **Add to routes.ts**: `route("my-route", "routes/my-route.tsx")`
3. **Implement component**:
   ```tsx
   export default function MyRoute() {
     return <div>My Route</div>;
   }
   ```
4. **Add navigation link**:
   ```tsx
   <Link to="/my-route">My Route</Link>
   ```

## Best Practices

1. **Use loaders for server-side data** - Fetch data before rendering
2. **Handle loading states** - Show spinners/skeletons during navigation
3. **Protect sensitive routes** - Check authentication in useEffect
4. **Use query params for filters** - Keep URL shareable (e.g., `?ticker=AAPL`)
5. **Set global ticker on navigation** - `actions.setGlobalTicker()`
6. **Use ErrorBoundary** - Catch and display route-specific errors
7. **Add meta tags** - Improve SEO for public pages
8. **Leverage caching** - Store actions cache API responses
9. **Use TypeScript types** - Import from `./+types/route-name`
10. **Keep routes focused** - Each route should have a single responsibility

