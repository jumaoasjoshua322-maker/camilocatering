import Link from "next/link";
import Image from "next/image";
import { ChefHat, Star, Users, Calendar, Heart, Building2, Cake } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const services = [
  {
    icon: Heart,
    title: "Wedding Packages",
    description: "Complete wedding catering with elegant setups, full-course meals, and dedicated coordinators.",
    href: "/services?category=WEDDING",
    accent: "text-rose-700",
  },
  {
    icon: Building2,
    title: "Corporate Events",
    description: "Professional catering for meetings, seminars, product launches, and company celebrations.",
    href: "/services?category=CORPORATE",
    accent: "text-blue-700",
  },
  {
    icon: Cake,
    title: "Birthday & Social",
    description: "Festive catering packages for birthdays, reunions, anniversaries, and special gatherings.",
    href: "/services?category=BIRTHDAY",
    accent: "text-purple-700",
  },
  {
    icon: ChefHat,
    title: "Custom Catering",
    description: "Tailored menus and setups for any occasion. Tell us your vision and we'll make it happen.",
    href: "/contact",
    accent: "text-amber-800",
  },
];

const stats = [
  { label: "Events Catered", value: "2,000+" },
  { label: "Years of Experience", value: "15+" },
  { label: "Happy Clients", value: "1,800+" },
  { label: "Average Rating", value: "4.9 ★" },
];

const testimonials = [
  {
    name: "Maria Santos",
    event: "Wedding Reception",
    text: "Camilo's Catering made our wedding absolutely perfect. The food was exquisite and the service was flawless from start to finish.",
  },
  {
    name: "Jose Reyes",
    event: "Corporate Gala",
    text: "We've used Camilo for our annual company events for 5 years. Consistently excellent quality and professionalism.",
  },
  {
    name: "Ana Dela Cruz",
    event: "Debut Celebration",
    text: "Every detail was taken care of. Our guests couldn't stop complimenting the food. Highly recommended!",
  },
];

export default async function HomePage() {
  const settings = await getPublicSettings();
  const why = settings.home.whyChooseUs;
  const heroImage = settings.heroImage;

  return (
    <>
      {/* Hero */}
      <section className="relative h-[80vh] min-h-[560px] overflow-hidden bg-neutral-950">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

        <div className="relative h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 flex items-end">
          <div className="max-w-2xl text-white">
            <p className="text-xs sm:text-sm uppercase tracking-[0.22em] text-amber-300 mb-4">
              Premium Catering · Since 2009
            </p>
            <h1 className="font-display text-4xl sm:text-6xl leading-[1.05] mb-5">
              {settings.tagline || "Unforgettable food. Effortless events."}
            </h1>
            {settings.description && (
              <p className="text-base sm:text-lg text-neutral-200 mb-8 max-w-xl leading-relaxed">
                {settings.description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/services"
                className="inline-flex items-center justify-center h-12 px-6 text-sm font-medium rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-sm"
              >
                View packages
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-12 px-6 text-sm font-medium rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                Get a quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-amber-900 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map(({ label, value }) => (
              <div key={label}>
                <div className="font-display text-3xl sm:text-4xl font-semibold text-white mb-1 tabular-nums">
                  {value}
                </div>
                <div className="text-amber-100 text-xs sm:text-sm uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 sm:py-24 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              From intimate gatherings to grand celebrations, we have the perfect package for every occasion.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map(({ icon: Icon, title, description, href, accent }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 hover:border-neutral-300 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-neutral-100 dark:bg-neutral-800 mb-4">
                  <Icon className={`h-5 w-5 ${accent}`} />
                </div>
                <h3 className="font-display text-lg text-neutral-900 dark:text-white mb-2 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 sm:py-24 bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white mb-6">
                {why.title}
              </h2>
              <div className="flex flex-col gap-5">
                {why.items.map(({ title, description }) => (
                  <div key={title} className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{title}</p>
                      <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/services"
                className="inline-flex items-center justify-center h-11 px-5 mt-8 text-sm font-medium rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors"
              >
                Explore packages
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[0, 1, 2, 3].map((i) => {
                const src = why.images[i];
                const FallbackIcon = [ChefHat, Users, Calendar, Star][i];
                return (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FallbackIcon className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-24 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white mb-4">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(({ name, event, text }) => (
              <figure
                key={name}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <blockquote className="text-neutral-700 dark:text-neutral-300 text-[0.95rem] leading-relaxed">
                  &ldquo;{text}&rdquo;
                </blockquote>
                <figcaption className="mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">{name}</p>
                  <p className="text-xs text-neutral-500">{event}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-neutral-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Ready to plan your event?
          </h2>
          <p className="text-neutral-300 mb-8 text-base sm:text-lg leading-relaxed">
            Browse our packages and book your date today. Our team is ready to make your event extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center h-12 px-6 text-sm font-medium rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors"
            >
              View packages
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center h-12 px-6 text-sm font-medium rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
