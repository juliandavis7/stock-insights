import { Navbar } from "~/components/homepage/navbar";
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
  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Earnings Calls
          </h1>
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-lg text-muted-foreground">
              Earnings call transcript functionality will be implemented here
            </p>
          </div>
        </div>
      </main>
    </>
  );
}