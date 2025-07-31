# Welcome to your Convex functions directory!

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

## Financial Metrics Sourcing

| Metric | Data Source | API Field / Calculation |
|--------|-------------|------------------------|
| **TTM PE** | ✅ AlphaVantage | `TrailingPE` |
| **Forward PE** | ✅ AlphaVantage | `ForwardPE` |
| **2 Year Forward PE** | 🧮 Analyst Estimates | Market Cap ÷ 2026 EPS estimate |
| **TTM EPS Growth** | 🧮 Analyst Estimates | (Most recent EPS - Previous EPS) / Previous EPS × 100 |
| **Current Yr EPS Growth** | 🧮 Analyst Estimates | (2025 EPS - 2024 EPS) / 2024 EPS × 100 |
| **Next Year EPS Growth** | 🧮 Analyst Estimates | (2026 EPS - 2025 EPS) / 2025 EPS × 100 |
| **TTM Rev Growth** | 🧮 Analyst Estimates | (Most recent Rev - Previous Rev) / Previous Rev × 100 |
| **Current Year Exp Rev Growth** | 🧮 Analyst Estimates | (2025 Rev - 2024 Rev) / 2024 Rev × 100 |
| **Next Year Rev Growth** | 🧮 Analyst Estimates | (2026 Rev - 2025 Rev) / 2025 Rev × 100 |
| **Gross Margin** | ✅ AlphaVantage | `GrossProfitTTM` ÷ `RevenueTTM` × 100 |
| **Net Margin** | ✅ AlphaVantage | `ProfitMargin` × 100 |
| **TTM P/S Ratio** | ✅ AlphaVantage | `PriceToSalesRatioTTM` |
| **Forward P/S Ratio** | 🧮 Analyst Estimates | Market Cap ÷ 2025 Revenue estimate |

**Summary:**
- **✅ AlphaVantage**: 6 metrics (46%)
- **🧮 Analyst Estimates**: 7 metrics (54%)

**API Calls Required:**
- AlphaVantage Company Overview API
- Financial Modeling Prep Analyst Estimates API

A query function that takes two arguments looks like:

```ts
// functions.js
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.functions.myQueryFunction, {
  first: 10,
  second: "hello",
});
```

A mutation function looks like:

```ts
// functions.js
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get(id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.functions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.
