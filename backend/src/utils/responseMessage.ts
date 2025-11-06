// src/utils/responseMessage.ts

export const responseMessage = {
  created: (entity: string) => `${entity} added successfully`,
  updated: (entity: string) => `${entity} updated successfully`,
  deleted: (entity: string) => `${entity} deleted successfully`,
  fetched: (entity: string) => `${entity} fetched successfully`,
  notFound: (entity: string) => `${entity} not found`,
  alreadyExists: (entity: string) => `${entity} already exists`,
  error: (entity: string) => `Error while processing ${entity}`,
};
