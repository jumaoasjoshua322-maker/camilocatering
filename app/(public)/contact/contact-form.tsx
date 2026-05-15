"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Mock submission - in production, send to API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSuccess(true);
    setLoading(false);
    setFormData({ name: "", email: "", phone: "", message: "" });

    setTimeout(() => setSuccess(false), 5000);
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-6 py-8 text-center dark:bg-green-950 dark:border-green-800">
        <p className="text-green-700 dark:text-green-400 font-medium mb-2">
          Message sent successfully!
        </p>
        <p className="text-sm text-green-600 dark:text-green-500">
          We'll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={5}
          required
          placeholder="Tell us about your event..."
          value={formData.message}
          onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
        />
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto">
        Send Message
      </Button>
    </form>
  );
}
