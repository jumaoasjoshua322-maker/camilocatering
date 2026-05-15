"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@/lib/use-form";
import { companySettingsSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  settings: {
    _id: string;
    name: string;
    tagline: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    socialLinks: { facebook?: string; instagram?: string };
  };
}

export function CompanySettingsForm({ settings }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { values, errors, handleChange, validate } = useForm({
    name: settings.name,
    tagline: settings.tagline,
    description: settings.description,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    facebook: settings.socialLinks?.facebook || "",
    instagram: settings.socialLinks?.instagram || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate(companySettingsSchema)) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        tagline: values.tagline,
        description: values.description,
        phone: values.phone,
        email: values.email,
        address: values.address,
        socialLinks: { facebook: values.facebook, instagram: values.instagram },
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Failed to save"); return; }
    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Settings saved successfully</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Company Name</Label>
                <Input value={values.name} onChange={handleChange("name")} error={errors.name} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tagline</Label>
                <Input value={values.tagline} onChange={handleChange("tagline")} placeholder="Premium Catering..." />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={values.description} onChange={handleChange("description")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input type="tel" value={values.phone} onChange={handleChange("phone")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={values.email} onChange={handleChange("email")} error={errors.email} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Address</Label>
              <Input value={values.address} onChange={handleChange("address")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Facebook URL</Label>
                <Input value={values.facebook} onChange={handleChange("facebook")} placeholder="https://facebook.com/..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Instagram URL</Label>
                <Input value={values.instagram} onChange={handleChange("instagram")} placeholder="https://instagram.com/..." />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-fit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
