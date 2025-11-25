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

  // User messages
  user: {
    createSuccess: "User created successfully",
    updateSuccess: "User updated successfully",
    deleteSuccess: "User deleted successfully",
    notFound: "User not found",
    fetchSuccess: "Users fetched successfully",
    countFetched: "Users count fetched successfully",
    invalidId: "Invalid user ID",
  },

  // Subscription messages
  subscription: {
    createSuccess: "Subscription created successfully",
    updateSuccess: "Subscription updated successfully",
    deleteSuccess: "Subscription deleted successfully",
    notFound: "Subscription not found",
    fetchSuccess: "Subscriptions fetched successfully",
    countFetched: "Subscription count fetched successfully",
    exportSuccess: "Subscriptions exported successfully",
    invalidId: "Invalid subscription ID",
  },

  // Auth messages
  auth: {
    loginSuccess: "Login successful",
    logoutSuccess: "Logged out successfully",
    resetLinkSent: "Reset link sent to your email",
    passwordUpdated: "Password updated successfully",
    otpSent: "OTP sent to your email",
    otpResent: "New OTP sent successfully",
    otpRequired: "User ID and OTP are required",
    verificationFailed: "Verification failed",
    otpFailed: "Failed to resend OTP",
    notAuthenticated: "Not authenticated",
  },

  // Dashboard messages
  dashboard: {
    metricsFetched: "Dashboard metrics fetched successfully",
  },

  // Department messages
  department: {
    fetchSuccess: "Departments fetched successfully",
  },

  // Email messages
  email: {
    configured: "Email server is configured correctly!",
    connectionFailed: "Email server connection failed. Check your .env settings.",
    checkTriggered: "Email check triggered successfully. Check console for details.",
  },
};
export type ResponseMessage = typeof responseMessage;

