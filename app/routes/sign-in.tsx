import { getAuth } from "@clerk/react-router/ssr.server";
import { SignIn } from "@clerk/react-router";
import { redirect } from "react-router";
import type { Route } from "./+types/sign-in";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  // If already signed in, redirect to auth-redirect to check subscription status
  if (userId) {
    throw redirect("/auth-redirect");
  }
  
  return null;
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-background">
      <SignIn 
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/auth-redirect"
      />
    </div>
  );
}
