"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField } from "@/components/ui/image-upload";
import { SettingsPreviewPane } from "./settings-preview-pane";

interface ValueItem {
  title: string;
  description: string;
}

export interface SettingsFormState {
  _id: string;
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  heroImage: string;
  facebook: string;
  instagram: string;
  about: {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    storyImage: string;
    storyParagraphs: string[];
    values: ValueItem[];
    ctaTitle: string;
    ctaText: string;
  };
  contact: {
    headline: string;
    subheadline: string;
    businessHours: string;
    mapEmbedUrl: string;
  };
  home: {
    whyChooseUs: {
      title: string;
      items: ValueItem[];
      images: string[]; // length always 4
    };
  };
}

interface Props {
  settings: SettingsFormState;
}

export function CompanySettingsForm({ settings }: Props) {
  const router = useRouter();
  const [state, setState] = useState<SettingsFormState>(settings);
  const [baseline, setBaseline] = useState<SettingsFormState>(settings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("company");
  // Bumped on successful save to cache-bust the live preview iframe.
  // Initial value is 0 (not Date.now()) so SSR and client agree on the
  // initial src — otherwise we hit a hydration mismatch.
  const [savedAt, setSavedAt] = useState<number>(0);

  const isDirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(baseline),
    [state, baseline]
  );

  // Warn the admin if they try to leave with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function update<K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) {
    setState((s) => ({ ...s, [field]: value }));
  }

  function updateAbout<K extends keyof SettingsFormState["about"]>(
    field: K,
    value: SettingsFormState["about"][K]
  ) {
    setState((s) => ({ ...s, about: { ...s.about, [field]: value } }));
  }

  function updateContact<K extends keyof SettingsFormState["contact"]>(
    field: K,
    value: SettingsFormState["contact"][K]
  ) {
    setState((s) => ({ ...s, contact: { ...s.contact, [field]: value } }));
  }

  function setWhyTitle(value: string) {
    setState((s) => ({
      ...s,
      home: { ...s.home, whyChooseUs: { ...s.home.whyChooseUs, title: value } },
    }));
  }

  function setWhyItem(i: number, patch: Partial<ValueItem>) {
    setState((s) => {
      const next = [...s.home.whyChooseUs.items];
      next[i] = { ...next[i], ...patch };
      return {
        ...s,
        home: { ...s.home, whyChooseUs: { ...s.home.whyChooseUs, items: next } },
      };
    });
  }

  function addWhyItem() {
    setState((s) => ({
      ...s,
      home: {
        ...s.home,
        whyChooseUs: {
          ...s.home.whyChooseUs,
          items: [...s.home.whyChooseUs.items, { title: "", description: "" }],
        },
      },
    }));
  }

  function removeWhyItem(i: number) {
    setState((s) => ({
      ...s,
      home: {
        ...s.home,
        whyChooseUs: {
          ...s.home.whyChooseUs,
          items: s.home.whyChooseUs.items.filter((_, idx) => idx !== i),
        },
      },
    }));
  }

  function setWhyImage(i: number, url: string) {
    setState((s) => {
      const next = [...s.home.whyChooseUs.images];
      next[i] = url;
      return {
        ...s,
        home: { ...s.home, whyChooseUs: { ...s.home.whyChooseUs, images: next } },
      };
    });
  }

  function setParagraph(i: number, value: string) {
    setState((s) => {
      const next = [...s.about.storyParagraphs];
      next[i] = value;
      return { ...s, about: { ...s.about, storyParagraphs: next } };
    });
  }

  function addParagraph() {
    setState((s) => ({
      ...s,
      about: { ...s.about, storyParagraphs: [...s.about.storyParagraphs, ""] },
    }));
  }

  function removeParagraph(i: number) {
    setState((s) => ({
      ...s,
      about: {
        ...s.about,
        storyParagraphs: s.about.storyParagraphs.filter((_, idx) => idx !== i),
      },
    }));
  }

  function setValueItem(i: number, patch: Partial<ValueItem>) {
    setState((s) => {
      const next = [...s.about.values];
      next[i] = { ...next[i], ...patch };
      return { ...s, about: { ...s.about, values: next } };
    });
  }

  function addValueItem() {
    setState((s) => ({
      ...s,
      about: { ...s.about, values: [...s.about.values, { title: "", description: "" }] },
    }));
  }

  function removeValueItem(i: number) {
    setState((s) => ({
      ...s,
      about: { ...s.about, values: s.about.values.filter((_, idx) => idx !== i) },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const payload = {
      name: state.name,
      tagline: state.tagline,
      description: state.description,
      phone: state.phone,
      email: state.email,
      address: state.address,
      logo: state.logo,
      heroImage: state.heroImage,
      socialLinks: { facebook: state.facebook, instagram: state.instagram },
      about: {
        heroTitle: state.about.heroTitle,
        heroSubtitle: state.about.heroSubtitle,
        heroImage: state.about.heroImage,
        storyImage: state.about.storyImage,
        storyParagraphs: state.about.storyParagraphs.filter((p) => p.trim() !== ""),
        values: state.about.values.filter(
          (v) => v.title.trim() !== "" || v.description.trim() !== ""
        ),
        ctaTitle: state.about.ctaTitle,
        ctaText: state.about.ctaText,
      },
      contact: {
        headline: state.contact.headline,
        subheadline: state.contact.subheadline,
        businessHours: state.contact.businessHours,
        mapEmbedUrl: state.contact.mapEmbedUrl,
      },
      home: {
        whyChooseUs: {
          title: state.home.whyChooseUs.title,
          items: state.home.whyChooseUs.items.filter(
            (v) => v.title.trim() !== "" || v.description.trim() !== ""
          ),
          images: state.home.whyChooseUs.images,
        },
      },
    };

    try {
      const res = await fetch("/api/company/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setSuccess(true);
      setBaseline(state);
      setSavedAt(Date.now());
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 flex flex-col gap-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="sr-only" role="status" aria-live="polite">
          Settings saved successfully
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="about">About Page</TabsTrigger>
          <TabsTrigger value="contact">Contact Page</TabsTrigger>
          <TabsTrigger value="home">Homepage</TabsTrigger>
        </TabsList>

        {/* COMPANY */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company Name">
                  <Input value={state.name} onChange={(e) => update("name", e.target.value)} />
                </Field>
                <Field label="Tagline">
                  <Input value={state.tagline} onChange={(e) => update("tagline", e.target.value)} />
                </Field>
              </div>
              <Field label="Description">
                <Textarea rows={3} value={state.description} onChange={(e) => update("description", e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone">
                  <Input value={state.phone} onChange={(e) => update("phone", e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={state.email} onChange={(e) => update("email", e.target.value)} />
                </Field>
              </div>
              <Field label="Address">
                <Input value={state.address} onChange={(e) => update("address", e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Facebook URL">
                  <Input value={state.facebook} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/..." />
                </Field>
                <Field label="Instagram URL">
                  <Input value={state.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/..." />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadField
                label="Logo"
                aspect="square"
                hint="Square logo, used in nav. JPG/PNG/WebP up to 5 MB"
                recommended="Recommended 256×256, square. Shown in the navbar at 36px and in the footer."
                value={state.logo}
                onChange={(url) => update("logo", url)}
              />
              <ImageUploadField
                label="Site Hero Image"
                aspect="video"
                hint="Used as a homepage banner. Wide image works best"
                recommended="Recommended 1920×1080 or wider, landscape. Will be cropped on tall screens."
                value={state.heroImage}
                onChange={(url) => update("heroImage", url)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABOUT */}
        <TabsContent value="about">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Field label="Hero Title">
                  <Input value={state.about.heroTitle} onChange={(e) => updateAbout("heroTitle", e.target.value)} />
                </Field>
                <Field label="Hero Subtitle">
                  <Textarea rows={3} value={state.about.heroSubtitle} onChange={(e) => updateAbout("heroSubtitle", e.target.value)} />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Our Story</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <ImageUploadField
                  label="Story Image"
                  aspect="video"
                  recommended="Recommended 1280×720, landscape. Shown next to your story text."
                  value={state.about.storyImage}
                  onChange={(url) => updateAbout("storyImage", url)}
                />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Story Paragraphs</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addParagraph}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  {state.about.storyParagraphs.length === 0 && (
                    <p className="text-xs text-neutral-400">No paragraphs yet. Click Add to write one.</p>
                  )}
                  {state.about.storyParagraphs.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 mt-3 text-neutral-300 flex-shrink-0" />
                      <Textarea
                        rows={3}
                        value={p}
                        onChange={(e) => setParagraph(i, e.target.value)}
                        placeholder={`Paragraph ${i + 1}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeParagraph(i)}
                        aria-label="Remove paragraph"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What Sets Us Apart</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500">Up to 12 items, displayed in a grid.</p>
                  <Button type="button" size="sm" variant="outline" onClick={addValueItem} disabled={state.about.values.length >= 12}>
                    <Plus className="h-4 w-4" /> Add Value
                  </Button>
                </div>
                {state.about.values.length === 0 && (
                  <p className="text-xs text-neutral-400">No items yet.</p>
                )}
                {state.about.values.map((v, i) => (
                  <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500">Value #{i + 1}</span>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeValueItem(i)} aria-label="Remove value">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <Field label="Title">
                      <Input value={v.title} onChange={(e) => setValueItem(i, { title: e.target.value })} />
                    </Field>
                    <Field label="Description">
                      <Textarea rows={2} value={v.description} onChange={(e) => setValueItem(i, { description: e.target.value })} />
                    </Field>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call To Action</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Field label="CTA Title">
                  <Input value={state.about.ctaTitle} onChange={(e) => updateAbout("ctaTitle", e.target.value)} />
                </Field>
                <Field label="CTA Text">
                  <Textarea rows={2} value={state.about.ctaText} onChange={(e) => updateAbout("ctaText", e.target.value)} />
                </Field>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONTACT */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Page</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field label="Headline">
                <Input value={state.contact.headline} onChange={(e) => updateContact("headline", e.target.value)} />
              </Field>
              <Field label="Subheadline">
                <Textarea rows={3} value={state.contact.subheadline} onChange={(e) => updateContact("subheadline", e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business Hours">
                  <Input value={state.contact.businessHours} onChange={(e) => updateContact("businessHours", e.target.value)} placeholder="Mon-Sat: 9AM-6PM" />
                </Field>
                <Field label="Map Embed URL">
                  <Input
                    value={state.contact.mapEmbedUrl}
                    onChange={(e) => updateContact("mapEmbedUrl", e.target.value)}
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                </Field>
              </div>
              <p className="text-xs text-neutral-400">
                On Google Maps choose Share → Embed a map → copy the <code>src</code> URL only.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HOMEPAGE */}
        <TabsContent value="home">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us</CardTitle>
                <p className="text-xs text-neutral-400 mt-1">
                  Section on the homepage with bullet points and a 2×2 image grid.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Field label="Section Title">
                  <Input
                    value={state.home.whyChooseUs.title}
                    onChange={(e) => setWhyTitle(e.target.value)}
                    placeholder="Why Choose Camilo's Catering?"
                  />
                </Field>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Bullet Points</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addWhyItem}
                      disabled={state.home.whyChooseUs.items.length >= 8}
                    >
                      <Plus className="h-4 w-4" /> Add Item
                    </Button>
                  </div>
                  {state.home.whyChooseUs.items.length === 0 && (
                    <p className="text-xs text-neutral-400">No items yet.</p>
                  )}
                  {state.home.whyChooseUs.items.map((v, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500">Item #{i + 1}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeWhyItem(i)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Field label="Title">
                        <Input
                          value={v.title}
                          onChange={(e) => setWhyItem(i, { title: e.target.value })}
                        />
                      </Field>
                      <Field label="Description">
                        <Textarea
                          rows={2}
                          value={v.description}
                          onChange={(e) => setWhyItem(i, { description: e.target.value })}
                        />
                      </Field>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <Label>Image Grid (2×2)</Label>
                  <p className="text-xs text-neutral-400">
                    Empty slots fall back to the default icon tiles. Recommended: square or
                    landscape photos.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {state.home.whyChooseUs.images.map((src, i) => (
                      <ImageUploadField
                        key={i}
                        label={`Tile ${i + 1}`}
                        aspect="square"
                        recommended="Recommended 800×800, square. Each tile fills one corner of the 2×2 grid."
                        value={src}
                        onChange={(url) => setWhyImage(i, url)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 -mx-4 sm:mx-0 z-10 pt-4 pb-2 bg-gradient-to-t from-neutral-50 via-neutral-50 to-transparent dark:from-neutral-950 dark:via-neutral-950">
        <div
          className={`flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3 shadow-md dark:bg-neutral-900 transition-colors ${
            isDirty
              ? "border-amber-300 ring-1 ring-amber-200 dark:border-amber-700 dark:ring-amber-900/40"
              : "border-neutral-200 dark:border-neutral-800"
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {isDirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Unsaved changes
                </span>
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  All saved
                </span>
              </>
            ) : (
              <span className="text-neutral-500">No changes yet</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setState(baseline)}
                disabled={loading}
              >
                Discard
              </Button>
            )}
            <Button type="submit" loading={loading} disabled={!isDirty || loading}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* Live preview (lg+ only) */}
      <div className="lg:col-span-5">
        <SettingsPreviewPane tab={activeTab} savedAt={savedAt} />
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
