// Catch-all route for unmatched URLs (like Chrome DevTools requests)
import type { Route } from "./+types/$";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  
  // Handle Chrome DevTools requests silently
  if (url.pathname.includes('.well-known') || 
      url.pathname.includes('devtools') ||
      url.pathname.includes('chrome-extension')) {
    return new Response(null, { status: 404 });
  }
  
  // For other 404s, you might want to show a proper 404 page
  throw new Response(JSON.stringify({ message: "Page not found" }), { 
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}

export default function CatchAll() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}
