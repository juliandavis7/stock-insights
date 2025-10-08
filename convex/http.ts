import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { MetricsService } from "./lib/services/metrics_service";
import { DataFetcher } from "./lib/services/data_fetcher";

const http = httpRouter();

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "convex-backend" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }),
});

// Comprehensive metrics endpoint (Method 1C with GAAP adjustments)
http.route({
  path: "/stock-metrics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const ticker = url.searchParams.get("ticker");

      // Validate required parameters
      if (!ticker) {
        return new Response(JSON.stringify({
          error: "Missing required parameter: ticker",
          message: "Please provide a stock ticker symbol (e.g., ?ticker=CRM)"
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }

      console.log(`🚀 API: Starting metrics request for ticker: ${ticker}`);

      // Initialize data fetcher with caching
      const dataFetcher = new DataFetcher(ctx);
      
      // Check for cached metrics first
      const cachedMetrics = await dataFetcher.getCachedMetrics(ticker);
      if (cachedMetrics) {
        console.log(`💾 API: Returning cached metrics for ${ticker}`);
        return new Response(JSON.stringify(cachedMetrics), {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }

      // Initialize metrics service
      console.log(`🔧 API: Initializing MetricsService for ${ticker}`);
      const metricsService = new MetricsService();
      
      // Calculate comprehensive metrics with Method 1C
      console.log(`🔍 API: Calculating fresh metrics for ${ticker} using Method 1C`);
      console.log(`🔍 API: About to call metricsService.getMetrics(${ticker.toUpperCase()})`);
      
      const metrics = await metricsService.getMetrics(ticker.toUpperCase());
      
      console.log(`🔍 API: Received metrics from MetricsService for ${ticker}:`, JSON.stringify(metrics, null, 2));
      console.log(`🔍 API: Metrics type:`, typeof metrics);
      console.log(`🔍 API: Metrics keys:`, Object.keys(metrics || {}));

      // Log individual metric values for debugging
      if (metrics) {
        console.log(`📊 API: Individual metrics for ${ticker}:`);
        console.log(`  - current_year_eps_growth: ${metrics.current_year_eps_growth} (${typeof metrics.current_year_eps_growth})`);
        console.log(`  - next_year_eps_growth: ${metrics.next_year_eps_growth} (${typeof metrics.next_year_eps_growth})`);
        console.log(`  - ttm_pe: ${metrics.ttm_pe} (${typeof metrics.ttm_pe})`);
        console.log(`  - forward_pe: ${metrics.forward_pe} (${typeof metrics.forward_pe})`);
        console.log(`  - price: ${metrics.price} (${typeof metrics.price})`);
        console.log(`  - market_cap: ${metrics.market_cap} (${typeof metrics.market_cap})`);
      } else {
        console.log(`❌ API: metrics is null or undefined for ${ticker}`);
      }

      // Cache the results
      console.log(`💾 API: Caching metrics for ${ticker}`);
      await dataFetcher.cacheMetrics(ticker, metrics, "method_1c");

      return new Response(JSON.stringify(metrics), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });

    } catch (error) {
      console.error("❌ API: Error in metrics endpoint:", error);
      
      const url = new URL(request.url);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: "Failed to calculate stock metrics",
        details: error instanceof Error ? error.message : "Unknown error",
        ticker: url.searchParams.get("ticker")?.toUpperCase()
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
  }),
});

// CORS preflight for stock-metrics endpoint
http.route({
  path: "/stock-metrics",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

console.log("HTTP routes configured");

export default http;