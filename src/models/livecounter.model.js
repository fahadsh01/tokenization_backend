import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema({
  tenant_id: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  currentToken: { type: Number, default: 0 },
});

counterSchema.index({ tenant_id: 1, date: 1 }, { unique: true });

export const Counter = mongoose.model("Counter", counterSchema);
