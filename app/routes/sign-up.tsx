import { getAuth } from "@clerk/react-router/ssr.server";
import { SignUp } from "@clerk/react-router";
import { redirect } from "react-router";
import type { Route } from "./+types/sign-up";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  // If already signed in, go to app
  if (userId) {
    throw redirect("/search");
  }
  
  return null;
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-background">
      <SignUp 
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/search"
      />
    </div>
  );
}
