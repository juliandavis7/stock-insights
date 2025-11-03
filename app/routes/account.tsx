import { UserProfile } from "@clerk/react-router";
import { Wallet } from "lucide-react";
import { Navbar } from "~/components/homepage/navbar";
import { BillingTab } from "~/components/account/BillingTab";
import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import type { Route } from "./+types/account";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }
  
  return {
    isSignedIn: true,
    hasActiveSubscription: true,
    userId
  };
}

export default function AccountPage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Navbar loaderData={loaderData} />
      <main className="min-h-screen pt-20 pb-12 px-4 bg-page-background flex items-center justify-center">
        <UserProfile>
          <UserProfile.Page 
            label="Billing" 
            labelIcon={<Wallet size={16} />}
            url="billing"
          >
            <BillingTab />
          </UserProfile.Page>
        </UserProfile>
      </main>
    </>
  );
}

