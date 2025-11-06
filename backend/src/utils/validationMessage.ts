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
};
