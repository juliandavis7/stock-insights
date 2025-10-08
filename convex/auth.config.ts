// TEMPORARILY COMMENTED OUT TO FIX HTTP ENDPOINTS
// Missing VITE_CLERK_FRONTEND_API_URL was blocking HTTP routes
/*
export default {
    providers: [
      {
        domain: process.env.VITE_CLERK_FRONTEND_API_URL,
        applicationID: "convex",
      },
    ]
  };
*/

// Export empty config for now
export default {
  providers: []
};