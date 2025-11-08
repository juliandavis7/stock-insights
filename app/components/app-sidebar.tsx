import { useClerk } from "@clerk/react-router";
import {
  Search,
  GitCompare,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import { BrandLogo } from "~/components/logos";

const navItems = [
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Compare",
    url: "/compare",
    icon: GitCompare,
  },
  {
    title: "Projections",
    url: "/projections",
    icon: TrendingUp,
  },
  {
    title: "Financials",
    url: "/financials",
    icon: DollarSign,
  },
  {
    title: "Charts",
    url: "/charts",
    icon: BarChart3,
  },
];

export function AppSidebar({ user }: { user: any }) {
  const location = useLocation();
  const { signOut } = useClerk();
  const { isMobile } = useSidebar();

  const userFullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
  const userInitials =
    (user?.firstName?.charAt(0) || "").toUpperCase() +
    (user?.lastName?.charAt(0) || "").toUpperCase();
  const userProfile = user?.imageUrl || "";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              to="/"
              className="flex items-center gap-2 px-2 py-2"
              prefetch="viewport"
            >
              <BrandLogo size="32px" scale={1} margin="0" />
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarTrigger className="w-full" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      asChild
                    >
                      <Link to={item.url} prefetch="intent">
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={userProfile} alt={userFullName} />
                      <AvatarFallback className="rounded-lg">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userFullName}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {userEmail}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={userProfile} alt={userFullName} />
                        <AvatarFallback className="rounded-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {userFullName}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {userEmail}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
      
      {!user && (
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/sign-in" className="w-full">
                <SidebarMenuButton size="lg" className="w-full">
                  <span>Sign In</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/sign-up" className="w-full">
                <SidebarMenuButton size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <span>Start Free Trial</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

