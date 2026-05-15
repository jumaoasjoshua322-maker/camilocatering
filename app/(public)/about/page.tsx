import { ChefHat, Award, Users, Heart } from "lucide-react";

export const metadata = { title: "About Us" };

const values = [
  {
    icon: ChefHat,
    title: "Quality First",
    description: "We source only the freshest ingredients and prepare every dish with care and precision.",
  },
  {
    icon: Award,
    title: "15+ Years Experience",
    description: "Over a decade of excellence in catering for weddings, corporate events, and celebrations.",
  },
  {
    icon: Users,
    title: "Professional Team",
    description: "Our dedicated staff ensures seamless service from planning to execution.",
  },
  {
    icon: Heart,
    title: "Customer Focused",
    description: "Your satisfaction is our priority. We work closely with you to bring your vision to life.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
          About Camilo&apos;s Catering
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
          Since 2009, we've been serving Metro Manila with premium catering services that turn
          ordinary events into extraordinary memories. Our passion for food and commitment to
          excellence has made us one of the most trusted names in the industry.
        </p>
      </div>

      {/* Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
        <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 h-96 flex items-center justify-center">
          <ChefHat className="h-32 w-32 text-amber-600 opacity-40" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">Our Story</h2>
          <div className="flex flex-col gap-4 text-neutral-600 dark:text-neutral-400">
            <p>
              Camilo&apos;s Catering was founded by Chef Camilo Rodriguez, a culinary graduate from the
              prestigious Culinary Institute of America. After years of working in five-star hotels
              and restaurants, Chef Camilo saw an opportunity to bring restaurant-quality food to
              private events.
            </p>
            <p>
              What started as a small operation catering intimate gatherings has grown into a
              full-service catering company serving hundreds of events each year. Our team has
              expanded, but our core values remain the same: quality ingredients, exceptional
              service, and attention to detail.
            </p>
            <p>
              Today, we're proud to serve weddings, corporate events, birthdays, and celebrations
              of all kinds. Every event is an opportunity to showcase our passion for food and
              hospitality.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          What Sets Us Apart
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 mb-4">
                <Icon className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-neutral-950 to-amber-950 p-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Work With Us?</h2>
        <p className="text-neutral-300 mb-8 max-w-xl mx-auto">
          Let's discuss your event and create a custom catering experience that exceeds your expectations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/services"
            className="inline-flex items-center justify-center h-12 px-8 font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-400 transition-colors"
          >
            View Packages
          </a>
          <a
            href="/contact"
            className="inline-flex items-center justify-center h-12 px-8 font-medium rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
