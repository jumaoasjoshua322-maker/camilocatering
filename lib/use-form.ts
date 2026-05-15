"use client";

import { useState } from "react";
import type { ZodSchema } from "zod";

type Errors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Errors<T>>({});

  function handleChange(field: keyof T) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function setValue<K extends keyof T>(field: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(schema: ZodSchema<unknown>): boolean {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Errors<T> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof T;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  }

  function reset() {
    setValues(initial);
    setErrors({});
  }

  return { values, errors, handleChange, setValue, validate, reset, setValues };
}
