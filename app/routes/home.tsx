import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { Navbar } from "~/components/homepage/navbar";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
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
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Hello, World!
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome to Stock Insights
          </p>
        </div>
      </main>
    </>
  );
}
