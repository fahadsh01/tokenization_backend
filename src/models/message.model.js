import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  tenant_id: { type: String, required: true },
  message: { type: String, required: true }, 
  type: { type: String, enum:["INFO","EMERGENCY","WARNING"], default: "INFO" },
});


export const Message = mongoose.model("Message", messageSchema);
