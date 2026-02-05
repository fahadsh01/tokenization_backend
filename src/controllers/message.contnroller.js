import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import {Message } from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const createMessage = asynchandler(async (req, res) => {
  const tenant_id = req.user.tenantId;
  if (!tenant_id) {
    throw new ApiError(401, "Unauthorized");
  }

  const { message, type } = req.body;

  if ([message, type].some(f => !f || f.trim() === "")) {
    throw new ApiError(400, "All the fields are required");
  }

  const msg = await Message.findOneAndUpdate(
    { tenant_id },
    { message, type },
    { new: true, upsert: true }
  );

  return res.status(200).json(
    new ApiResponse(200, msg, "Message created")
  );
});

const fetchMessage = asynchandler(async (req, res) => {
  const tenant_id = req.user.tenantId;
  if (!tenant_id) {
    throw new ApiError(401, "Unauthorized");
  }

  const msg = await Message.findOne({ tenant_id }).select("message");

  if (!msg) {
    throw new ApiError(404, "Message not found");
  }

  return res.status(200).json(
    new ApiResponse(200, msg, "Message fetched")
  );
});
const deleteMessage = asynchandler(async (req, res) => {
  const tenant_id = req.user.tenantId;
  if (!tenant_id) {
    throw new ApiError(401, "Unauthorized");
  }

const { id } = req.params;

const msg = await Message.findOneAndDelete({
  _id: id,
  tenant_id
});

  if (!msg) {
    throw new ApiError(404, "Message not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Message deleted")
  );
});
export {
 createMessage,fetchMessage,deleteMessage
};