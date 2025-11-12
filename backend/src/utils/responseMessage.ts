// src/utils/responseMessage.ts

export const responseMessage = {
  created: (entity: string) => `${entity} created successfully`,
  updated: (entity: string) => `${entity} updated successfully`,
  deleted: (entity: string) => `${entity} deleted successfully`,
  fetched: (entity: string) => `${entity} fetched successfully`,
  notFound: (entity: string) => `${entity} not found`,
  alreadyExists: (entity: string) => `${entity} already exists`,
  error: (entity: string) => `Error while processing ${entity}`,

  // Specific common responses
  unauthorized: "Not authorized",
  unauthorizedUser: (reason = "") =>
    `Unauthorized${reason ? `: ${reason}` : ""}`,
  invalidInput: (field?: string) =>
    field ? `Invalid input for ${field}` : "Invalid input",
  missingField: (field?: string) =>
    field ? `${field} is missing` : "Required field missing",

  // Helpful wrappers for controllers
  subscription: {
    createSuccess: "Subscription added successfully",
    updateSuccess: "Subscription updated successfully",
    deleteSuccess: "Subscription deleted successfully",
    notFound: "Subscription not found",
    fetchSuccess: "Subscriptions fetched successfully",
  },

  auth: {
    loginSuccess: "Login successful",
    logoutSuccess: "Logout successful",
    resetLinkSent: "Reset link sent to your email",
    passwordUpdated: "Password updated successfully",
  },
};
export type ResponseMessage = typeof responseMessage;

