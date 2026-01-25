import { Router } from "express";
import { authmeJWT } from "../middlewares/authme.js";
import {
  createPayment,
  
} from "../controllers/payment.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const  payment= Router();
payment
  .route("/createPayment")
  .post(
  upload.single("screenshot"),
  authmeJWT,
  createPayment
);


export default payment;
