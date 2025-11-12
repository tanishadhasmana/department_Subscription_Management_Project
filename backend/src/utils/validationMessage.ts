// src/utils/validationMessage.ts
export const validationMessage = {
  required: (field: string) => `${field} is required`,
  invalid: (field: string) => `Invalid ${field}`,
  invalidEmail: "Invalid email format",
  invalidPhone: "Invalid phone number format",
  minLength: (field: string, length: number) =>
    `${field} must be at least ${length} characters long`,
  maxLength: (field: string, length: number) =>
    `${field} must not exceed ${length} characters`,
  mustBeNumber: (field: string) => `${field} must be a number`,
  invalidStatus: "Status must be either Active or Inactive",
  notFound: (entity: string) => `${entity} not found`,
  alreadyExists: (entity: string) => `${entity} already exists`,

  // Field-specific shortcuts (use these to keep controllers clean)
  fields: {
    subsc_name: "Subscription name",
    subsc_type: "Subscription type",
    subsc_price: "Subscription price",
    subsc_currency: "Currency",
    subsc_status: "Status",
    department_id: "Department",
    purchase_date: "Purchase date",
    renew_date: "Renew date",
    portal_detail: "Portal details",
    payment_method: "Payment method",
  },

  // Helpers
  minPrice: (min: number) => `Price must be at least ${min}`,
};
export type ValidationMessage = typeof validationMessage;




