import mongoose, { Model, Schema } from "mongoose";

/**
 * Define a Mongoose model in a way that survives Next's dev hot reload
 * without going stale.
 *
 * Production: reuses the cached model (fast, correct).
 * Development: re-registers the model whenever the source file is reloaded,
 * so schema changes (new fields, new subdocuments) are picked up immediately
 * instead of silently dropped on save.
 */
export function defineModel<T>(name: string, schema: Schema): Model<T> {
  if (process.env.NODE_ENV !== "production" && mongoose.models[name]) {
    mongoose.deleteModel(name);
  }
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}
