import { MarketingNav } from "./marketing-nav";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page-background">
      <MarketingNav />
      <main className="pt-0">
        {children}
      </main>
    </div>
  );
}

