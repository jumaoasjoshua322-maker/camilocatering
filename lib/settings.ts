import { connectDB } from "@/lib/db";
import CompanySettings from "@/models/CompanySettings";
import type {
  AboutContent,
  ContactContent,
  CompanySettingsDocument,
} from "@/models/CompanySettings";

export interface PublicSettings {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  logo?: string;
  heroImage?: string;
  socialLinks: { facebook?: string; instagram?: string };
  about: Required<Omit<AboutContent, "values" | "storyParagraphs">> & {
    storyParagraphs: string[];
    values: { title: string; description: string }[];
  };
  contact: Required<ContactContent>;
}

const DEFAULT_ABOUT: PublicSettings["about"] = {
  heroTitle: "About Camilo's Catering",
  heroSubtitle:
    "Since 2009, we've been serving Metro Manila with premium catering services that turn ordinary events into extraordinary memories. Our passion for food and commitment to excellence has made us one of the most trusted names in the industry.",
  heroImage: "",
  storyImage: "",
  storyParagraphs: [
    "Camilo's Catering was founded by Chef Camilo Rodriguez, a culinary graduate from the prestigious Culinary Institute of America. After years of working in five-star hotels and restaurants, Chef Camilo saw an opportunity to bring restaurant-quality food to private events.",
    "What started as a small operation catering intimate gatherings has grown into a full-service catering company serving hundreds of events each year. Our team has expanded, but our core values remain the same: quality ingredients, exceptional service, and attention to detail.",
    "Today, we're proud to serve weddings, corporate events, birthdays, and celebrations of all kinds. Every event is an opportunity to showcase our passion for food and hospitality.",
  ],
  values: [
    { title: "Quality First", description: "We source only the freshest ingredients and prepare every dish with care and precision." },
    { title: "15+ Years Experience", description: "Over a decade of excellence in catering for weddings, corporate events, and celebrations." },
    { title: "Professional Team", description: "Our dedicated staff ensures seamless service from planning to execution." },
    { title: "Customer Focused", description: "Your satisfaction is our priority. We work closely with you to bring your vision to life." },
  ],
  ctaTitle: "Ready to Work With Us?",
  ctaText: "Let's discuss your event and create a custom catering experience that exceeds your expectations.",
};

const DEFAULT_CONTACT: PublicSettings["contact"] = {
  headline: "Get In Touch",
  subheadline:
    "Have questions about our services? Want to discuss your event? We'd love to hear from you.",
  businessHours: "Mon-Sat: 9AM-6PM",
  mapEmbedUrl: "",
};

const DEFAULTS: PublicSettings = {
  name: "Camilo's Catering",
  tagline: "Premium Catering for Every Occasion",
  description: "",
  phone: "",
  email: "",
  address: "",
  logo: undefined,
  heroImage: undefined,
  socialLinks: {},
  about: DEFAULT_ABOUT,
  contact: DEFAULT_CONTACT,
};

function pick<T>(value: T | undefined | null | "", fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value as T;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  await connectDB();
  const doc = (await CompanySettings.findOne().lean()) as
    | (CompanySettingsDocument & { _id: unknown })
    | null;
  if (!doc) return DEFAULTS;

  const about = doc.about ?? {};
  const contact = doc.contact ?? {};

  const storyParagraphs =
    Array.isArray(about.storyParagraphs) && about.storyParagraphs.length > 0
      ? about.storyParagraphs.filter((p) => typeof p === "string" && p.trim() !== "")
      : DEFAULT_ABOUT.storyParagraphs;

  const values =
    Array.isArray(about.values) && about.values.length > 0
      ? about.values
          .map((v) => ({ title: v?.title ?? "", description: v?.description ?? "" }))
          .filter((v) => v.title.trim() !== "" || v.description.trim() !== "")
      : DEFAULT_ABOUT.values;

  return {
    name: pick(doc.name, DEFAULTS.name),
    tagline: pick(doc.tagline, DEFAULTS.tagline),
    description: pick(doc.description, DEFAULTS.description),
    phone: pick(doc.phone, DEFAULTS.phone),
    email: pick(doc.email, DEFAULTS.email),
    address: pick(doc.address, DEFAULTS.address),
    logo: pick(doc.logo, DEFAULTS.logo),
    heroImage: pick(doc.heroImage, DEFAULTS.heroImage),
    socialLinks: {
      facebook: pick(doc.socialLinks?.facebook, undefined),
      instagram: pick(doc.socialLinks?.instagram, undefined),
    },
    about: {
      heroTitle: pick(about.heroTitle, DEFAULT_ABOUT.heroTitle),
      heroSubtitle: pick(about.heroSubtitle, DEFAULT_ABOUT.heroSubtitle),
      heroImage: pick(about.heroImage, DEFAULT_ABOUT.heroImage),
      storyImage: pick(about.storyImage, DEFAULT_ABOUT.storyImage),
      storyParagraphs,
      values: values.length > 0 ? values : DEFAULT_ABOUT.values,
      ctaTitle: pick(about.ctaTitle, DEFAULT_ABOUT.ctaTitle),
      ctaText: pick(about.ctaText, DEFAULT_ABOUT.ctaText),
    },
    contact: {
      headline: pick(contact.headline, DEFAULT_CONTACT.headline),
      subheadline: pick(contact.subheadline, DEFAULT_CONTACT.subheadline),
      businessHours: pick(contact.businessHours, DEFAULT_CONTACT.businessHours),
      mapEmbedUrl: pick(contact.mapEmbedUrl, DEFAULT_CONTACT.mapEmbedUrl),
    },
  };
}
