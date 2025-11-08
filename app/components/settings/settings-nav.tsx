import { Link, useLocation } from "react-router";
import { User, CreditCard, Settings as SettingsIcon } from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
  {
    title: "General",
    url: "/settings",
    icon: SettingsIcon,
  },
  {
    title: "Account",
    url: "/settings/account",
    icon: User,
  },
  {
    title: "Billing",
    url: "/settings/billing",
    icon: CreditCard,
  },
];

export function SettingsNav() {
  const location = useLocation();

  return (
    <nav className="w-full lg:w-64 flex-shrink-0">
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

