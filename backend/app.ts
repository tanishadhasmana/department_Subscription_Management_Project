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

dotenv.config();

const app: Application = express();


/* ---------------------------
   🧱 Core Middleware Setup
---------------------------- */
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend origin
    credentials: true, // allow cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

app.use(express.json()); 

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------------------------
   🧱 Static Files - after helmet
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
   🧱 Mount Routes (AFTER middlewares)
---------------------------- */
app.use("/api/dashboard", dashboardRoute);
app.use("/api/users", userRoute);
app.use("/api/subscriptions", subscriptionRoute);

/* ---------------------------
   🚀 Start Server
---------------------------- */
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});




// app.ts
// //  express is used to build web server, helps to handle req, and send response, Application is type to represent express app, req is for incoming req,res is for incoming res, if removed everyhting work just, type check err come.
// import express, { Application, Request, Response } from "express";
// // cross origin resource sharing, these decides which frontend origin are allowed to make req, to our backend.
// import cors from "cors";
// // used to load environment variable, from .env file.
// import dotenv from "dotenv";
// // for limiting many reqs comming from one client.
// import rateLimit from "express-rate-limit";
// // middleware to add several security http header.
// import helmet from "helmet";
// //a nodejs module for handling and resolving file paths.
// import path from "path";
// // imports middleware to parse cookies from incoming http reqs.
// import cookieParser from "cookie-parser";


// import dashboardRoute from "./src/routes/dashboardRoute";
// import userRoute from "./src/routes/userRoutes";
// import subscriptionRoute from "./src/routes/subscriptionRoutes"

//  // just a instance of react application.
// const app: Application = express();

// // Import route modules
//  app.use("/dashboard", dashboardRoute); 
//  app.use("/users", userRoute); 
//  app.use("/subscriptions", subscriptionRoute);
 
// // to load .env file variable.
// dotenv.config();
 

 
// /* ---------------------------
//    🧱 Core Middleware Setup
// ---------------------------- */
 
// // Parse cookies FIRST, to every req.
// app.use(cookieParser());
 
// //  CORS
// app.use(
//   cors({
//     // origin which frontend url allowed to make req,
//     origin: "http://localhost:5173",
//     // allows everytime to add cooki, or authntication headers to be sent.
//     credentials: true,
//     // allowed http methods
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     // allow req header, important for API whcih sends token or json
//     allowedHeaders: [
//       "Content-Type",
//       "Accept",
//       "Authorization",
//       "X-Requested-With",
//     ],
//   })
// );
 
// // JSON body parsing, then json body is accessible, through req.body.
// app.use(express.json());
// //  security header, to allow serving static files(like images)
// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" }, 
//   })
// );
 
// /* ---------------------------
//    🧱 Static Files - after helmet
// ---------------------------- */

// // your_project_folder/assets/images/logo.png
// app.use(
//   "/assets/images",
//   express.static(path.resolve(__dirname, "assets/images"))
// );
 
// /* ---------------------------
//    🧱 Rate Limiter
// ---------------------------- */
 
// const authLimiter = rateLimit({
//   // define rate limiting, 60 * 1000 = 60,000 milliseconds = 1 min, means cnt req over 1 min period.
//   windowMs: 60 * 1000,
//   // sets maximum no. of req allowed per IP, in 1 min window.
//   max: 10,
//   message: "Too many requests, please try again later.",
// });
 
// /* ---------------------------
//    🧱 Health Check
// ---------------------------- */
// app.get("/", (req: Request, res: Response) => {
//   res.send("Department Subscription Backend Running");
// });
 
// /* ---------------------------
//    🧱 Mount Routes
// ---------------------------- */


 
// /* ---------------------------
//    🚀 Start Server
// ---------------------------- */
// const PORT = process.env.PORT || 3002;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
 
// });