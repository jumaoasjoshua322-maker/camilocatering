import Image from "next/image";
import { ChefHat, Award, Users, Heart, Sparkles } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";

export const metadata = { title: "About Us" };
export const dynamic = "force-dynamic";

const VALUE_ICONS = [ChefHat, Award, Users, Heart, Sparkles];

export default async function AboutPage() {
  const settings = await getPublicSettings();
  const { about } = settings;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 dark:text-white mb-6">
          {about.heroTitle}
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
          {about.heroSubtitle}
        </p>
      </div>

      {/* Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 h-96 flex items-center justify-center overflow-hidden relative">
          {about.storyImage ? (
            <Image
              src={about.storyImage}
              alt="Our story"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <ChefHat className="h-24 w-24 text-neutral-300 dark:text-neutral-600" />
          )}
        </div>
        <div>
          <h2 className="font-display text-3xl text-neutral-900 dark:text-white mb-4">Our Story</h2>
          <div className="flex flex-col gap-4 text-neutral-600 dark:text-neutral-400">
            {about.storyParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-20">
        <h2 className="font-display text-3xl text-neutral-900 dark:text-white text-center mb-12">
          What Sets Us Apart
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {about.values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <div
                key={`${v.title}-${i}`}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-4">
                  <Icon className="h-6 w-6 text-amber-700" />
                </div>
                <h3 className="font-display text-lg text-neutral-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{v.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-neutral-950 p-12 text-center relative overflow-hidden">
        {about.heroImage && (
          <>
            <Image
              src={about.heroImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/40" />
          </>
        )}
        <div className="relative">
          <h2 className="font-display text-3xl text-white mb-4">{about.ctaTitle}</h2>
          <p className="text-neutral-200 mb-8 max-w-xl mx-auto whitespace-pre-line">
            {about.ctaText}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/services"
              className="inline-flex items-center justify-center h-12 px-6 text-sm font-medium rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors"
            >
              View packages
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center h-12 px-6 text-sm font-medium rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
