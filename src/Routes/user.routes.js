import { Router } from "express";
import {
  register,
   forgetPassword, tenants ,getUserProfile,getUserSettings,changeSettings,changewaplang

} from "../controllers/register.controllers.js";

import {
  authMe,
} from "../controllers/admin.controller.js";
import { verifyjwt } from "../middlewares/auth.js";
import {authmeJWT} from "../middlewares/authme.js"
const router = Router();
router.route("/register").post(
 authmeJWT, register
); 
 router.route("/getAllTnets").get(authmeJWT,tenants);
router.route("/authme").get(authmeJWT, authMe);
router.route("/getUserProfile").get(authmeJWT, getUserProfile);
router.route("/forgetPassword").post(verifyjwt,  forgetPassword);
router.route("/settings").get(authmeJWT, getUserSettings);
router.route("/change-settings").put(authmeJWT, changeSettings);
router.route("/change-whatsapp-language").put(authmeJWT, changewaplang);

export default router;
