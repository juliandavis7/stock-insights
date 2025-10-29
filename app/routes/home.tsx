import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { Navbar } from "~/components/homepage/navbar";
import { FeatureModule } from "~/components/FeatureModule";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { featureModules } from "~/constants/homeModules";
import { useEffect } from "react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  const title = "Stock Insights - Financial Analysis Platform";
  const description = "A comprehensive stock analysis platform with real-time data and projections.";

  return [
    { title },
    { name: "description", content: description },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (userId) {
    // Get real user details from Clerk
    const user = await createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    }).users.getUser(userId);
  }
  
  return {
    isSignedIn: !!userId,
    hasActiveSubscription: !!userId, // Simplified for development
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { getAuthToken, isSignedIn } = useAuthenticatedFetch();

  useEffect(() => {
    if (isSignedIn) {
      getAuthToken();
    }
  }, [isSignedIn, getAuthToken]);

  return (
    <>
      <Navbar loaderData={loaderData} />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Stock Insights
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Analyze Your Next Investment with Professional-Grade Financial Analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/search"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Get Started
            </a>
            <a
              href="/compare"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              View Features
            </a>
          </div>
        </div>
      </section>

      {/* Feature Modules Section */}
      <main className="bg-white">
        {featureModules.map((module, index) => (
          <FeatureModule
            key={module.id}
            module={module}
            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
          />
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Analyzing?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of investors making data-driven decisions
          </p>
          <a
            href="/search"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Try Stock Insights Today
          </a>
        </div>
      </footer>
    </>
  );
}
