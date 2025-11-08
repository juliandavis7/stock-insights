import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { BrandNameAndLogo } from "~/components/logos";
import { cn } from "~/lib/utils";
import { BRAND_NAME } from "~/config/brand";

const menuItems = [
  { name: "Home", href: "#top" },
  { name: "Features", href: "#features" },
  { name: "FAQ", href: "#faq" },
];

export function MarketingNav() {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback((href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
    setMenuState(false);
  }, []);

  return (
    <header>
      <nav data-state={menuState && "active"} className="fixed z-50 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <BrandNameAndLogo size="small" />
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            {/* Center Navigation - Desktop */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <div
                      onClick={() => handleNavClick(item.href)}
                      className="hover:cursor-pointer text-gray-900 block duration-150 transition-colors hover:text-[#2463EB] font-medium"
                    >
                      <span>{item.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Auth Buttons */}
            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              {/* Mobile Navigation */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleNavClick(item.href)}
                        className="text-gray-900 hover:cursor-pointer block duration-150 transition-colors w-full text-left hover:text-[#2463EB] font-medium"
                      >
                        <span>{item.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Auth Buttons */}
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link to="/sign-in">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                >
                  <Link to="/sign-up">
                    <span>Get {BRAND_NAME} free</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

