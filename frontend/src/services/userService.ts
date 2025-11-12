import api from "../lib/api";
import type { User } from "../types/User";

export const getUsers = async (
  search?: string,
  column?: string,
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
): Promise<{
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  let url = `/users?page=${page}&limit=${limit}`;
  
  if (search && column) {
    url += `&search=${encodeURIComponent(search)}&column=${column}`;
  }
  
  if (sortBy) {
    url += `&sortBy=${encodeURIComponent(sortBy)}`;
  }
  
  if (sortOrder) {
    url += `&sortOrder=${sortOrder}`;
  }
  
  const res = await api.get(url, { withCredentials: true });
  return res.data;
};

// Get user by ID
export const getUserById = async (id: number): Promise<User> => {
  const res = await api.get(`/users/${id}`, { withCredentials: true });
  return res.data;
};

// Create new user
export const createUser = async (user: Partial<User>) => {
  const res = await api.post("/users", user, { withCredentials: true });
  return res.data;
};

// Update existing user
export const updateUser = async (id: number, user: Partial<User>) => {
  const res = await api.put(`/users/${id}`, user, { withCredentials: true });
  return res.data;
};

// Delete user
export const deleteUser = async (id: number) => {
  const res = await api.delete(`/users/${id}`, { withCredentials: true });
  return res.data;
};

// Toggle active / inactive
export const toggleUserStatus = async (
  id: number,
  status: "active" | "inactive"
) => {
  const res = await api.put(
    `/users/${id}/status`,
    { status },
    { withCredentials: true }
  );
  return res.data;
};


