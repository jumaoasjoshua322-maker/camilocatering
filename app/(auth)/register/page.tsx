"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "@/lib/use-form";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { values, errors, handleChange, setValue, validate } = useForm({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "VENDOR_ADMIN",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = validate(registerSchema);
    if (!result) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    router.push(values.role === "VENDOR_ADMIN" ? "/dashboard" : "/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Join Camilo&apos;s Catering today</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            {(["CUSTOMER", "VENDOR_ADMIN"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue("role", r)}
                className={cn(
                  "rounded-lg border-2 p-3 text-sm font-medium transition-all text-left",
                  values.role === r
                    ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400"
                )}
              >
                <div className="font-semibold">{r === "CUSTOMER" ? "Customer" : "Vendor"}</div>
                <div className="text-xs mt-0.5 opacity-70">
                  {r === "CUSTOMER" ? "Book catering events" : "List your business"}
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{values.role === "VENDOR_ADMIN" ? "Business Name" : "Full Name"}</Label>
            <Input
              id="name"
              placeholder={values.role === "VENDOR_ADMIN" ? "Camilo's Kitchen" : "Juan dela Cruz"}
              value={values.name}
              onChange={handleChange("name")}
              error={errors.name}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={handleChange("email")}
              error={errors.email}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 12 chars, uppercase and number"
              value={values.password}
              onChange={handleChange("password")}
              error={errors.password}
            />
          </div>
          <Button type="submit" loading={loading} className="w-full mt-2">
            Create Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
