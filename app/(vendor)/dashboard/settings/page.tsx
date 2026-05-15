import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import CompanySettings from "@/models/CompanySettings";
import { CompanySettingsForm } from "./company-settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  await connectDB();
  let settings = await CompanySettings.findOne().lean();

  if (!settings) {
    settings = await CompanySettings.create({
      name: "Camilo's Catering",
      tagline: "Premium Catering for Every Occasion",
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage company information</p>
      </div>
      <CompanySettingsForm
        settings={{
          _id: settings._id.toString(),
          name: settings.name || "",
          tagline: settings.tagline || "",
          description: settings.description || "",
          phone: settings.phone || "",
          email: settings.email || "",
          address: settings.address || "",
          socialLinks: settings.socialLinks || {},
        }}
      />
    </div>
  );
}
