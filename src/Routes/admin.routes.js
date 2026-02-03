import { Router } from "express";
import {
  register,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/admin.controller.js";
import { authmeJWT} from "../middlewares/authme.js"
const admin = Router();
 admin.route("/register").post(
  register
);
 admin.route("/login").post(loginUser);
 admin.route("/logout").post(authmeJWT, logoutUser);
 admin.route("/refreshAccessToken").post(refreshAccessToken);
export default admin;
