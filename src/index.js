import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dbConnect from "./db/db.js";

dotenv.config({ path: "./env" });

const allowedSocketOrigins = process.env.SOCKET_CORS_ORIGIN
  .split(",")
  .map(o => o.trim());

let io;

dbConnect().then(() => {
  const server = http.createServer(app);

  io = new Server(server, {
    transports: ["websocket", "polling"], // IMPORTANT
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, origin);

        if (allowedSocketOrigins.includes(origin)) {
          callback(null, origin); // MUST return single origin
        } else {
          callback(new Error("Socket CORS blocked"));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("join-hospital", (tenantId) => {
      socket.join(`hospital:${tenantId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  server.listen(process.env.PORT || 5000, () => {
    console.log("🚀 Server running");
  });
});


export { io };
