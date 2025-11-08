import { Outlet } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";
import { redirect } from "react-router";
import type { Route } from "./+types/settings";
import { AppLayout } from "~/components/app-layout";
import { SettingsNav } from "~/components/settings/settings-nav";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  // Redirect to homepage if not authenticated
  if (!userId) {
    throw redirect("/");
  }

  // Get user details from Clerk
  const user = await createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  }).users.getUser(userId);

  return { user };
}

export default function SettingsLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AppLayout user={loaderData.user}>
      <main className="min-h-screen bg-page-background">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Secondary Navigation */}
              <SettingsNav />
              
              {/* Content Area */}
              <div className="flex-1 min-w-0">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

