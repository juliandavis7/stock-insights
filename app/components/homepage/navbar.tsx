import { UserButton } from "@clerk/react-router";
import { Menu, X } from "lucide-react";
import React, { useCallback } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const menuItems = [
  { name: "Search", href: "/search" },
  { name: "Compare", href: "/compare" },
  { name: "Projections", href: "/projections" },
  { name: "Financials", href: "/financials" },
  { name: "Charts", href: "/charts" },
];

type MenuItem = {
  name: string;
  href: string;
};

export const Navbar = ({
  loaderData,
}: {
  loaderData?: { isSignedIn: boolean; hasActiveSubscription: boolean };
}) => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback(() => {
    setMenuState(false); // Close mobile menu
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-99 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-2 font-semibold text-xl"
                prefetch="viewport"
              >
                <img src="/rsk.png" alt="RSK Logo" className="h-12 w-12" />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item: MenuItem, index) => {
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <li key={index}>
                      <Link
                        to={item.href}
                        className={cn(
                          "hover:text-foreground block duration-150 transition-colors",
                          isActive ? "text-[#1F2937] font-semibold" : "text-muted-foreground"
                        )}
                        prefetch="viewport"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item: MenuItem, index) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={index}>
                        <Link
                          to={item.href}
                          onClick={handleNavClick}
                          className={cn(
                            "hover:text-foreground block duration-150 transition-colors w-full text-left",
                            isActive ? "text-[#1F2937] font-semibold" : "text-muted-foreground"
                          )}
                          prefetch="viewport"
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {loaderData?.isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <UserButton />
                  </div>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link to="/sign-in" prefetch="viewport">
                        <span>Login</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled && "lg:hidden")}
                    >
                      <Link to="/sign-up" prefetch="viewport">
                        <span>Sign Up</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                    >
                      <Link to="/sign-up" prefetch="viewport">
                        <span>Start Free Trial</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
