import { ApiError } from "../utils/apierrors.js";
import asynchandler from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyjwt = asynchandler(async (req, _, next) => {
  try {
    const Token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    if (!Token) {
      throw new ApiError(401, " Unauthorized request");
    }
    const decodedinfo = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET);
        console.log(decodedinfo)
    console.log("the user name is ", decodedinfo );

    const user = await User.findById(decodedinfo?.userId).select(" fullname status role tenantid waplang ");
    if (!user) {
      throw new ApiError(401, " invalid acccess token ");
    }
        console.log(user)

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || " invalid access token ");
  }
});
