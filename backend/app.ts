import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import db from "./src/connection"

// CRITICAL: Set timezone BEFORE importing cron jobs
process.env.TZ = 'Asia/Kolkata';

import dashboardRoute from "./src/routes/dashboardRoute";
import userRoute from "./src/routes/userRoutes";
import subscriptionRoute from "./src/routes/subscriptionRoutes";
import departmentRoute from "./src/routes/departmentRoutes";
import passwordRoute from "./src/routes/passwordRoutes";
import currencyRoute from "./src/routes/currencyRoutes";

import { startSubscriptionReminderCron } from "./src/crons/subscriptionReminderCron";
import { startSubscriptionStatusUpdateCron } from "./src/crons/subscriptionStatusUpdateCron";
import { testEmailConnection } from "./src/utils/mailer";
import { startCurrencyUpdateCron } from "./src/crons/updateCurrencyRatesCron";

dotenv.config();

const app: Application = express();

/* ---------------------------
    Core Middleware Setup
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
      "Cookie",
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------------------------
    Rate Limiter
---------------------------- */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later.",
});

/* ---------------------------
    Health Check
---------------------------- */
app.get("/", (req: Request, res: Response) => {
  res.send("Department Subscription Backend Running");
});

/* ---------------------------
    Mount Routes
---------------------------- */
app.use("/api/currency", currencyRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/users", userRoute);
app.use("/api/departments", departmentRoute);
app.use("/api/subscriptions", subscriptionRoute);
app.use("/api/password", passwordRoute);

/* ---------------------------
    Start Server & Initialize Cron
---------------------------- */
const PORT = process.env.PORT || 3002;

(async () => {
  const result = await db.raw("SELECT DATABASE() as db");
  console.log(" BACKEND IS USING DATABASE:", result[0][0].db);
})();

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(` Timezone: ${process.env.TZ || 'system default'}`);
  console.log(` Server time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`);

  console.log(" Testing email connection...");
  const emailReady = await testEmailConnection();

  if (emailReady) {
    console.log(" Email system ready\n");
    startSubscriptionReminderCron();
  } else {
    console.log("  Email system not ready. Please check your .env configuration.\n");
  }

  console.log("\n Starting currency update cron...");
  startCurrencyUpdateCron();

  console.log("\n Starting subscription status update cron...");
  startSubscriptionStatusUpdateCron();
  
  console.log("\n All cron jobs initialized successfully!\n");
});

export default app;





