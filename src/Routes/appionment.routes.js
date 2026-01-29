import { Router } from "express";
import {
 createappointment,
getAppointment,advanceToken,getLiveToken,publicLiveToken
} from "../controllers/appointments.controllers.js";
import { verifyjwt } from "../middlewares/auth.js";
import {authmeJWT} from "../middlewares/authme.js"
import {subscriptionGuard} from "../middlewares/subscriptionGuard.js"

const appointment = Router();
appointment.route("/createappointment").post(
 verifyjwt,subscriptionGuard,createappointment
); 
 appointment.route("/getAppointment").get(
 authmeJWT,subscriptionGuard,getAppointment
); 
appointment.route("/liveToken").get(authmeJWT,subscriptionGuard, getLiveToken)

appointment.route("/advanceToken").post(
  authmeJWT,subscriptionGuard,advanceToken
); 
appointment.route("/:tenantId/publicLiveToken").get(publicLiveToken)

export default appointment;
