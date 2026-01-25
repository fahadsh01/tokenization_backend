import { Router } from "express";
import {
  loginUser,
  logoutUser,
  register,
  refreshAccessToken,
} from "../controllers/register.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyjwt } from "../middlewares/auth.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  register
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyjwt, logoutUser);
router.route("/refresh-Token").post(refreshAccessToken);
export default router;
