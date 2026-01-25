import { Router } from "express";
import {
 createappointment,
getAppointment,advanceToken,getLiveToken,publicLiveToken
} from "../controllers/appointments.controllers.js";
import { verifyjwt } from "../middlewares/auth.js";
import {authmeJWT} from "../middlewares/authme.js"
const appointment = Router();
appointment.route("/createappointment").post(
 verifyjwt,createappointment
); 
 appointment.route("/getAppointment").get(
 authmeJWT,getAppointment
); 
appointment.route("/liveToken").get(authmeJWT, getLiveToken)

appointment.route("/advanceToken").post(
  authmeJWT,advanceToken
); 
appointment.route("/:tenantId/publicLiveToken").get(publicLiveToken)

export default appointment;
