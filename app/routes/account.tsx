import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import type { Route } from "./+types/account";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }
  
  // Redirect to new settings page
  throw redirect("/settings/account");
}

export default function AccountPage() {
  // This component should never render as the loader always redirects
  return null;
}

