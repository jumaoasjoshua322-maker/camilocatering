import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "./contact-form";
import { getPublicSettings } from "@/lib/settings";

export const metadata = { title: "Contact Us" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const { contact, phone, email, address, socialLinks } = settings;

  const items = [
    phone && {
      icon: Phone,
      label: "Phone",
      value: phone,
      href: `tel:${phone.replace(/\s+/g, "")}`,
    },
    email && {
      icon: Mail,
      label: "Email",
      value: email,
      href: `mailto:${email}`,
    },
    address && {
      icon: MapPin,
      label: "Address",
      value: address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    },
    contact.businessHours && {
      icon: Clock,
      label: "Business Hours",
      value: contact.businessHours,
      href: undefined,
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
          {contact.headline}
        </h1>
        <p className="text-neutral-500 max-w-2xl mx-auto whitespace-pre-line">
          {contact.subheadline}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="flex flex-col gap-4">
          {items.map(({ icon: Icon, label, value, href }) => (
            <Card key={label}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-500 mb-1">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="font-medium text-neutral-900 dark:text-white hover:text-amber-600 transition-colors break-words"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="font-medium text-neutral-900 dark:text-white">{value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(socialLinks.facebook || socialLinks.instagram) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    aria-label="Facebook"
                  >
                    <span className="text-sm font-semibold">f</span>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    aria-label="Instagram"
                  >
                    <span className="text-sm font-semibold">ig</span>
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>

          {contact.mapEmbedUrl && (
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-xl">
                <iframe
                  src={contact.mapEmbedUrl}
                  width="100%"
                  height="320"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block"
                  title="Map"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
