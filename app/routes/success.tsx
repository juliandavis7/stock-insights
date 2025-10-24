// import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
// import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function Success() {
  const { isSignedIn } = useAuth();
  // TODO: Re-enable when Convex is properly configured
  // const subscription = useQuery(api.subscriptions.fetchUserSubscription);
  // const upsertUser = useMutation(api.users.upsertUser);

  // TODO: Re-enable when Convex is properly configured
  // Ensure user is created/updated when they land on success page
  // useEffect(() => {
  //   if (isSignedIn) {
  //     upsertUser();
  //   }
  // }, [isSignedIn, upsertUser]);

  if (!isSignedIn) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              Please sign in to view your subscription details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  // TODO: Re-enable when Convex is properly configured
  // For now, show a placeholder message
  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-4">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader className="pb-6">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Welcome!
          </CardTitle>
          <CardDescription className="text-lg">
            Your account has been set up successfully.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6 text-left">
            <h3 className="font-semibold text-lg mb-4">Account Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">Free Tier</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What's Next?</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Button asChild className="w-full">
                <Link to="/projections">
                  Go to Projections
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              You're all set! Start exploring the financial insights and projections available to you.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}