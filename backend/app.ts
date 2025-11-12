// app.ts
import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import cookieParser from "cookie-parser";

import dashboardRoute from "./src/routes/dashboardRoute";
import userRoute from "./src/routes/userRoutes";
import subscriptionRoute from "./src/routes/subscriptionRoutes";
import departmentRoute from "./src/routes/departmentRoutes";

// ✅ Import cron job starter
import { startSubscriptionReminderCron } from "./src/crons/subscriptionReminderCron";
import { testEmailConnection } from "./src/utils/mailer";

dotenv.config();

const app: Application = express();

/* ---------------------------
   🧱 Core Middleware Setup
---------------------------- */
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Requested-With",
      "Cookie"
    ],
    exposedHeaders: ["Set-Cookie"]
  })
);

app.use(express.json()); 

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------------------------
   🧱 Static Files
---------------------------- */
app.use(
  "/assets/images",
  express.static(path.resolve(__dirname, "assets/images"))
);

/* ---------------------------
   🧱 Rate Limiter
---------------------------- */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later.",
});

/* ---------------------------
   🧱 Health Check
---------------------------- */
app.get("/", (req: Request, res: Response) => {
  res.send("Department Subscription Backend Running");
});

/* ---------------------------
   🧱 Mount Routes
---------------------------- */
app.use("/api/dashboard", dashboardRoute);
app.use("/api/users", userRoute);
app.use("/api/departments", departmentRoute);
app.use("/api/subscriptions", subscriptionRoute);

/* ---------------------------
   🚀 Start Server & Initialize Cron
---------------------------- */
const PORT = process.env.PORT || 3002;

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  
  // ✅ Test email connection on startup
  console.log("\n📧 Testing email connection...");
  const emailReady = await testEmailConnection();
  
  if (emailReady) {
    console.log("✅ Email system ready\n");
    
    // ✅ Start the subscription reminder cron job
    startSubscriptionReminderCron();
  } else {
    console.log("⚠️  Email system not ready. Please check your .env configuration.\n");
  }
});

