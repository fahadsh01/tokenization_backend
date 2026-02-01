import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apierrors.js";
import asynchandler from "../utils/asynchandler.js";
export const authmeJWT = asynchandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }

  req.user = {
    _id: decoded.userId,
    role: decoded.role,
    tenantId: decoded.tenantId,
    status: decoded.status,
    settings: decoded.settings
  };
  console.log(req.user)
  next();
});

