import { Navbar } from "~/components/homepage/navbar";
import { useGlobalTicker } from "~/store/stockStore";
import type { Route } from "./+types/earnings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Earnings Calls - Stock Insights" },
    { name: "description", content: "Access earnings call transcripts" },
  ];
}

export async function loader() {
  return {
    isSignedIn: false,
    hasActiveSubscription: false,
  };
}

export default function Earnings({ loaderData }: Route.ComponentProps) {
  const globalTicker = useGlobalTicker();
  
  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            {globalTicker.currentTicker ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Earnings Calls for {globalTicker.currentTicker}</h2>
                <p className="text-lg text-muted-foreground">
                  Earnings call transcript functionality will be implemented here
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">Earnings Calls</h2>
                <p className="text-lg text-muted-foreground">
                  Please search for a stock ticker to view earnings call data
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}