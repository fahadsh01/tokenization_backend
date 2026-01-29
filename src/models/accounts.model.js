import mongoose, { Schema } from "mongoose";

const accountsSchema = new Schema(
  {
    bank: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Accounts = mongoose.model("Accounts", accountsSchema);
