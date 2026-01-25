import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    tenant_id: {
      type: String,
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
      enum: ["WAITING", "IN_PROGRESS", "DONE"],
      default: "WAITING",
    },
  },
  { timestamps: true }
);
appointmentSchema.index({ tenantId: 1, createdAt: 1 });
appointmentSchema.index({ tenantId: 1, status: 1, createdAt: 1 });
appointmentSchema.index({ tenantId: 1, tokenNumber: 1 })
export const Appointment = mongoose.model("Appointment", appointmentSchema);
