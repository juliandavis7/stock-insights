import { Navbar } from "~/components/homepage/navbar";
import { useGlobalTicker } from "~/store/stockStore";
import type { Route } from "./+types/filings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SEC Filings - Stock Insights" },
    { name: "description", content: "Access SEC filing documents" },
  ];
}

export async function loader() {
  return {
    isSignedIn: false,
    hasActiveSubscription: false,
  };
}

export default function Filings({ loaderData }: Route.ComponentProps) {
  const globalTicker = useGlobalTicker();
  
  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            {globalTicker.currentTicker ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">SEC Filings for {globalTicker.currentTicker}</h2>
                <p className="text-lg text-muted-foreground">
                  SEC filings functionality will be implemented here
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">SEC Filings</h2>
                <p className="text-lg text-muted-foreground">
                  Please search for a stock ticker to view SEC filing data
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}