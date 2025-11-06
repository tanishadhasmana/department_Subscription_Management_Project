// src/types/express.d.ts
import { Request } from "express";

export interface CustomRequest extends Request {
  user?: {
    id: number;
    department_name: string;   // required
    email?: string;
    first_name?: string;
    last_name?: string;
    permissions?: string[];
    role?: string;             // optional if you still need role
  };
}





// // src/types/express/index.d.ts
// import "express";

// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: number;
//         role: string;
//         email?: string;
//         firstName?: string;
//         lastName?: string;
//       };
//     }
//   }
// }

// export {};
