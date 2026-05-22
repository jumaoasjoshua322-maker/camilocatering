import { Navbar } from "@/components/shared/navbar";
import { SiteFooter } from "@/components/shared/site-footer";
import { DemoBanner } from "@/components/shared/demo-banner";
import { getPublicSettings } from "@/lib/settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      <DemoBanner variant="homepage" />
      <Navbar logoUrl={settings.logo} brandName={settings.name} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
