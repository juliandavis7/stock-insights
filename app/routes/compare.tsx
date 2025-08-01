import { Navbar } from "~/components/homepage/navbar";
import type { Route } from "./+types/compare";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Compare Stocks - Stock Insights" },
    { name: "description", content: "Compare multiple stocks side-by-side" },
  ];
}

export async function loader() {
  return {
    isSignedIn: false,
    hasActiveSubscription: false,
  };
}

export default function Compare({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Compare Stocks
          </h1>
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-lg text-muted-foreground">
              Stock comparison functionality will be implemented here
            </p>
          </div>
        </div>
      </main>
    </>
  );
}