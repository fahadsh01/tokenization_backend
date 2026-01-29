import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  .split(",")
  .map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, origin);

      if (allowedOrigins.includes(origin)) {
        // ✅ RETURN THE EXACT ORIGIN
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
