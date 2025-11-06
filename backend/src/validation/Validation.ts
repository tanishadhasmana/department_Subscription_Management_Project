// src/validation/validation.ts
import { z } from "zod";
import { validationMessage } from "../utils/validationMessage";

// ==========================
// User Validation Schema
// ==========================
export const userSchema = z.object({
  firstName: z
    .string()
    .min(2, validationMessage.required("First name"))
    .max(50, validationMessage.maxLength("First name", 50)),

  lastName: z
    .string()
    .min(2, validationMessage.required("Last name"))
    .max(50, validationMessage.maxLength("Last name", 50)),

  email: z
    .string()
    .email(validationMessage.invalidEmail),

  phone: z
    .string()
    .optional(),

  role: z
    .string()
    .min(2, validationMessage.required("Role")),

  status: z
    .enum(["Active", "Inactive"])
    .default("Active"),
});

// ==========================
// Subscription Validation Schema
// ==========================
export const subscriptionSchema = z.object({
  subName: z
    .string()
    .min(1, validationMessage.required("Subscription name"))
    .max(100, validationMessage.maxLength("Subscription name", 100)),

  subType: z
    .string()
    .min(1, validationMessage.required("Subscription type")),

  subStatus: z
    .enum(["Active", "Inactive"])
    .default("Active"),
});

// ==========================
// Export All Schemas Together
// ==========================
export const schemas = {
  userSchema,
  subscriptionSchema,
};
