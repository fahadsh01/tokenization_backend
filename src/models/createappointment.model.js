import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    tenant_id: {
      type: String,
      required: true,
      index: true,
    },
 time:{String},
    appointmentDatePK: {
      type: String, // "YYYY-MM-DD" Pakistan date
      required: true,
      index: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    whatsapp: {
      type: String,
      required: true,
    },

    tokenNumber: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["WAITING", "IN_PROGRESS", "DONE","SKIPED"],
      default: "WAITING",
    },
     payment: {
      amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["UNPAID", "PAID"],
        default: "UNPAID",
      },
      paidAt: {
        type: String,
      },
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ tenant_id: 1, appointmentDatePK: 1 });
appointmentSchema.index({ tenant_id: 1, status: 1, appointmentDatePK: 1 });
appointmentSchema.index({ tenant_id: 1, tokenNumber: 1 });
export const Appointment = mongoose.model("Appointment", appointmentSchema);
