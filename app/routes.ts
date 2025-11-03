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
  route("subscription", "routes/subscription.tsx"),
  route("account/*", "routes/account.tsx"),
  route("success", "routes/success.tsx"),
  route("subscription-required", "routes/subscription-required.tsx"),
  // Catch-all route for unmatched URLs (handles Chrome DevTools requests)
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
