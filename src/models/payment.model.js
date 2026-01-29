
import mongoose, { Schema } from "mongoose";


const paymentSchema = new Schema(
  {
        tenantid: {
      type: String,
      required: true,
    },
     title: {
      type: String,
           required: true,
    },
    bank: {
      type: String,
      required: true,

    },
    planType:{type: String,
           required: true,},
    screenshot: {
      type: String,
           required: true,
    },
    publicid:{type: String,
           required: true,

    },
    amount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUSPENDED","APPROVED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);
export const Payment = mongoose.model("Payment", paymentSchema);
