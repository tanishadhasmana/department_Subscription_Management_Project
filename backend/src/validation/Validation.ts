// src/validation/validation.ts-- schemafile
import { z } from "zod";

export const subscriptionSchema = z.object({
  subsc_name: z.string().min(2).max(100),
  subsc_type: z.enum(["Monthly", "Yearly", "Lifetime"]),
  subsc_price: z.coerce.number().nonnegative(), // 👈 auto convert "199" -> 199
  subsc_currency: z.string().min(1),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
 subc_url: z
  .string()
  .max(200, "Max 200 characters allowed")
  .url("Enter a valid URL starting with http:// or https://") // ✅ url before optional
  .optional(),
  renew_date: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .optional(),
  portal_detail: z.string().min(1),
  payment_method: z.string().min(1),
  department_id: z.coerce.number().int().positive().optional(), // 👈 auto convert
  subsc_status: z.enum(["Active", "Inactive", "active", "inactive"]).optional(),
});

export const updateSubscriptionSchema = subscriptionSchema.partial();

export const schemas = {
  subscriptionSchema,
  updateSubscriptionSchema,
};

