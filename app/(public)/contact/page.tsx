import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata = { title: "Contact Us" };

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "+63 917 123 4567",
    href: "tel:+639171234567",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@camilocatering.com",
    href: "mailto:hello@camilocatering.com",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "123 Catering Street, Makati City, Metro Manila",
    href: "https://maps.google.com",
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Mon-Sat: 9AM-6PM",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">Get In Touch</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto">
          Have questions about our services? Want to discuss your event? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="flex flex-col gap-4">
          {contactInfo.map(({ icon: Icon, label, value, href }) => (
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
                      className="font-medium text-neutral-900 dark:text-white hover:text-amber-600 transition-colors"
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Follow Us</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <a
                href="https://facebook.com/camilocatering"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span className="text-sm font-semibold">f</span>
              </a>
              <a
                href="https://instagram.com/camilocatering"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span className="text-sm font-semibold">ig</span>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
