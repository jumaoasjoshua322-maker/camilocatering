import Link from "next/link";
import { ChefHat, Star, Users, Calendar, Heart, Building2, Cake } from "lucide-react";

const services = [
  {
    icon: Heart,
    title: "Wedding Packages",
    description: "Complete wedding catering with elegant setups, full-course meals, and dedicated coordinators.",
    href: "/services?category=WEDDING",
    color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20",
  },
  {
    icon: Building2,
    title: "Corporate Events",
    description: "Professional catering for meetings, seminars, product launches, and company celebrations.",
    href: "/services?category=CORPORATE",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
  },
  {
    icon: Cake,
    title: "Birthday & Social",
    description: "Festive catering packages for birthdays, reunions, anniversaries, and special gatherings.",
    href: "/services?category=BIRTHDAY",
    color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
  },
  {
    icon: ChefHat,
    title: "Custom Catering",
    description: "Tailored menus and setups for any occasion. Tell us your vision and we'll make it happen.",
    href: "/contact",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
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
    text: "Camilo Catering made our wedding absolutely perfect. The food was exquisite and the service was flawless from start to finish.",
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

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #c8861e 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 mb-8">
            <Star className="h-3.5 w-3.5 fill-amber-400" /> Premium Catering Services Since 2009
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold text-white leading-tight mb-6">
            Camilo
            <span className="block text-amber-400">Catering</span>
          </h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Exceptional food, impeccable service, and unforgettable experiences
            for weddings, corporate events, and every celebration in between.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/25"
            >
              View Our Packages
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-amber-600 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map(({ label, value }) => (
              <div key={label}>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{value}</div>
                <div className="text-amber-100 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              From intimate gatherings to grand celebrations, we have the perfect package for every occasion.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(({ icon: Icon, title, description, href, color }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
                Why Choose Camilo Catering?
              </h2>
              <div className="flex flex-col gap-5">
                {[
                  { title: "15+ Years of Excellence", desc: "Trusted by thousands of families and businesses across Metro Manila." },
                  { title: "Farm-to-Table Ingredients", desc: "We source only the freshest local ingredients for every dish we prepare." },
                  { title: "Dedicated Event Coordinators", desc: "Your personal coordinator handles every detail so you can enjoy your event." },
                  { title: "Flexible Packages", desc: "Customizable menus and setups to fit your vision and budget." },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{title}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/services"
                className="inline-flex items-center justify-center h-12 px-6 mt-8 font-medium rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Explore Packages
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-amber-100 dark:bg-amber-900/20 h-48 flex items-center justify-center">
                <ChefHat className="h-16 w-16 text-amber-600 opacity-40" />
              </div>
              <div className="rounded-2xl bg-neutral-200 dark:bg-neutral-800 h-48 mt-8 flex items-center justify-center">
                <Users className="h-16 w-16 text-neutral-400 opacity-40" />
              </div>
              <div className="rounded-2xl bg-neutral-200 dark:bg-neutral-800 h-48 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-neutral-400 opacity-40" />
              </div>
              <div className="rounded-2xl bg-amber-600 h-48 -mt-8 flex items-center justify-center">
                <Star className="h-16 w-16 text-white opacity-40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, event, text }) => (
              <div key={name} className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-4">
                  &ldquo;{text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">{name}</p>
                  <p className="text-xs text-neutral-400">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-neutral-950 to-amber-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Plan Your Event?
          </h2>
          <p className="text-neutral-300 mb-8 text-lg">
            Browse our packages and book your date today. Our team is ready to make your event extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-400 transition-all"
            >
              View Packages
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
