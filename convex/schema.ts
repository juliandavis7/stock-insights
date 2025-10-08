import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
  
  subscriptions: defineTable({
    userId: v.optional(v.string()),
    polarId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    status: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    amount: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    customerCancellationReason: v.optional(v.string()),
    customerCancellationComment: v.optional(v.string()),
    metadata: v.optional(v.any()),
    customFieldData: v.optional(v.any()),
    customerId: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("polarId", ["polarId"]),
    
  webhookEvents: defineTable({
    type: v.string(),
    polarEventId: v.string(),
    createdAt: v.string(),
    modifiedAt: v.string(),
    data: v.any(),
  })
    .index("type", ["type"])
    .index("polarEventId", ["polarEventId"]),

  // Financial data caching and storage
  stockMetrics: defineTable({
    ticker: v.string(),
    data: v.any(), // Complete metrics response with Method 1C calculations
    lastUpdated: v.number(),
    source: v.string(), // "fmp" or "mock"
    calculationMethod: v.optional(v.string()), // "method_1c" for tracking
  }).index("by_ticker", ["ticker"])
    .index("by_ticker_updated", ["ticker", "lastUpdated"]),
  
  // Cache raw financial data to reduce API calls
  financialData: defineTable({
    ticker: v.string(),
    dataType: v.string(), // "quarterly_income", "analyst_estimates_quarterly", "analyst_estimates_annual", "company_profile"
    data: v.any(), // Raw API response data
    lastUpdated: v.number(),
    source: v.string(), // "fmp_api", "mock", "yfinance"
  }).index("by_ticker_type", ["ticker", "dataType"])
    .index("by_ticker_type_updated", ["ticker", "dataType", "lastUpdated"]),
  
  // Store financial projections
  projections: defineTable({
    ticker: v.string(),
    userId: v.optional(v.string()),
    inputs: v.any(), // User projection inputs (growth rates, PE ratios, etc.)
    results: v.any(), // Calculated projection results
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ticker", ["ticker"])
    .index("by_user_ticker", ["userId", "ticker"])
    .index("by_created", ["createdAt"]),
  
  // Cache chart data for performance
  chartData: defineTable({
    ticker: v.string(),
    chartType: v.string(), // "basic", "enhanced", "comparison"
    timeframe: v.string(), // "1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "10y", "ytd", "max"
    data: v.any(), // Chart data points
    lastUpdated: v.number(),
    source: v.string(), // "yfinance", "fmp"
  }).index("by_ticker_type_timeframe", ["ticker", "chartType", "timeframe"])
    .index("by_ticker_updated", ["ticker", "lastUpdated"]),
  
  // Store calculation logs for debugging Method 1C
  calculationLogs: defineTable({
    ticker: v.string(),
    calculationType: v.string(), // "current_year_eps_growth", "next_year_eps_growth", "method_1c_debug"
    logData: v.any(), // Detailed calculation steps and intermediate values
    timestamp: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  }).index("by_ticker_type", ["ticker", "calculationType"])
    .index("by_timestamp", ["timestamp"]),
});
