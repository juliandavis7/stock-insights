import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useRouteLoaderData } from "react-router";
import { Mail, User } from "lucide-react";

export default function AccountSettings() {
  // Get user data from parent layout
  const layoutData = useRouteLoaderData("routes/settings") as { user: any } | undefined;
  const user = layoutData?.user;

  const userFullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
  const userInitials =
    (user?.firstName?.charAt(0) || "").toUpperCase() +
    (user?.lastName?.charAt(0) || "").toUpperCase();
  const userProfile = user?.imageUrl || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Account</h2>
        <p className="text-muted-foreground">
          Manage your account information and connected services.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your profile information is used across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userProfile} alt={userFullName} />
              <AvatarFallback className="text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                Update photo
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                JPG, PNG or GIF. Max size of 2MB.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  defaultValue={user?.firstName || ""}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  defaultValue={user?.lastName || ""}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <Button className="w-fit">Save changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Email addresses</CardTitle>
          <CardDescription>
            Manage the email addresses associated with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{userEmail}</p>
                <p className="text-sm text-muted-foreground">Primary email</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Add email address
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected accounts</CardTitle>
          <CardDescription>
            Third-party services connected to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.externalAccounts && user.externalAccounts.length > 0 ? (
            user.externalAccounts.map((account: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {account.provider?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium capitalize">{account.provider || "OAuth"}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.emailAddress || "Connected"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Disconnect
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No connected accounts
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

