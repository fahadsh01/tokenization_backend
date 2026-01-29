import { Router } from "express";
import { authmeJWT } from "../middlewares/authme.js";
import {
  createPayment,
 PaymentApproval,getPayments,getTnantPayments,addAccount,getAccount,deleteAccount,RejectPayment
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
payment.route("/getPayments").get(authmeJWT,getPayments)
payment.route("/getmyPayments").get(authmeJWT,getTnantPayments)
payment.route("/PaymentApproval").post(authmeJWT,PaymentApproval)
payment.route("/addAccount").post(authmeJWT,addAccount)
payment.route("/getAccount").get(authmeJWT,getAccount)
payment.route("/rejectPayment").post(authmeJWT,RejectPayment)

payment
  .route("/deleteAccount/:id")
  .delete(authmeJWT,deleteAccount);
export default payment; 