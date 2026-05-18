import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import CompanySettings from "@/models/CompanySettings";
import { CompanySettingsForm, type SettingsFormState } from "./company-settings-form";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  await connectDB();
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({});
  }

  const initial: SettingsFormState = {
    _id: settings._id.toString(),
    name: settings.name || "",
    tagline: settings.tagline || "",
    description: settings.description || "",
    phone: settings.phone || "",
    email: settings.email || "",
    address: settings.address || "",
    logo: settings.logo || "",
    heroImage: settings.heroImage || "",
    facebook: settings.socialLinks?.facebook || "",
    instagram: settings.socialLinks?.instagram || "",
    about: {
      heroTitle: settings.about?.heroTitle || "",
      heroSubtitle: settings.about?.heroSubtitle || "",
      heroImage: settings.about?.heroImage || "",
      storyImage: settings.about?.storyImage || "",
      storyParagraphs: settings.about?.storyParagraphs || [],
      values: (settings.about?.values || []).map((v) => ({
        title: v.title || "",
        description: v.description || "",
      })),
      ctaTitle: settings.about?.ctaTitle || "",
      ctaText: settings.about?.ctaText || "",
    },
    contact: {
      headline: settings.contact?.headline || "",
      subheadline: settings.contact?.subheadline || "",
      businessHours: settings.contact?.businessHours || "",
      mapEmbedUrl: settings.contact?.mapEmbedUrl || "",
    },
    home: {
      whyChooseUs: {
        title: settings.home?.whyChooseUs?.title || "",
        items: (settings.home?.whyChooseUs?.items || []).map((v) => ({
          title: v.title || "",
          description: v.description || "",
        })),
        // Always 4 slots so the form layout is stable.
        images: Array.from(
          { length: 4 },
          (_, i) => settings.home?.whyChooseUs?.images?.[i] || ""
        ),
      },
    },
  };

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage company info and the public homepage / About / Contact pages.
          On wide screens, a live preview of the public site renders alongside.
        </p>
      </div>
      <CompanySettingsForm settings={initial} />
    </div>
  );
}
