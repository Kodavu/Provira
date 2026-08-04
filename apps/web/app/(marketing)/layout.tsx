import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { LanguageOnboarding } from "@/components/i18n/language-onboarding";

// Shared chrome for the public marketing site: sticky nav + full footer around
// every page. Auth (/login, /signup) and the app (/overview…) live outside this
// group and keep their own layouts.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <LanguageOnboarding />
    </div>
  );
}
