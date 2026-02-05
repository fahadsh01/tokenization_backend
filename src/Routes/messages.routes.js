import { Router } from "express";
import {
   createMessage,fetchMessage,deleteMessage
} from "../controllers/message.contnroller.js";
import { authmeJWT} from "../middlewares/authme.js"
const message = Router();

 message.route("/publish-message").post(authmeJWT,createMessage);
 message.route("/fetchMessage").get(authmeJWT, fetchMessage);
 message.route("/:id/deleteMessage").delete(authmeJWT, deleteMessage);

export default message;
