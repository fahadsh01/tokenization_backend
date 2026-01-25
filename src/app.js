import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import router from "./Routes/user.routes.js";
import admin from "./Routes/admin.routes.js";
import appointment from "./Routes/appionment.routes.js"
import payment from "./Routes/payments.routes .js";
import errorHandler from "./middlewares/errorHandler.js"

// routes declaration
app.use("/api/v1/users", router);
app.use("/api/v1/admin", admin);
app.use("/api/v1/appointment", appointment);
app.use("/api/v1/payment",payment);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API is running");
});


export default app;
