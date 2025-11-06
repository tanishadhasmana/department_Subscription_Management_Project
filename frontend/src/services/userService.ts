// src/services/userService.ts

// we make frontend services, to manage api calls

import api from "../lib/api";
import type { User } from "../types/User";

export const getUsers = async (
  // whatver the user type, and like search?user1 anything come in query params of call.
  search?: string,
  // name of col where search can apply,like fname, email etc
  column?: string,
  // for pagination like, which page of result can written,default 1.
  page: number = 1,
  // to avoid shwoing 1000 of result, so default 10 result/page
  limit: number = 10,
  // name of fld to sort by like fname, mail etc
  sortBy?: string,
  sortOrder?: "asc" | "desc"
  // fucn returning promise, resolving to obj, with users, total users,total pages, 
): Promise<{
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  // creating basic url
  let url = `/users?page=${page}&limit=${limit}`;
  // search means what we types and col is db field, like we type john it is search and field is name.
  if (search && column) {
    
    url += `&search=${encodeURIComponent(search)}&column=${column}`;

  }
  // if in url sort by is provided, then only it soet the col If sortBy = "email", so url /users?page=1&limit=10&sortBy=email
  if (sortBy) {
    url += `&sortBy=${encodeURIComponent(sortBy)}`;
  }
  // only add sort order if provided like ascending, descending, /users?page=1&limit=10&sortOrder=desc
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

//  Update existing user
export const updateUser = async (id: number, user: Partial<User>) => {
  const res = await api.put(`/users/${id}`, user, { withCredentials: true });
  return res.data;
};

// exporting all users to CSV
export const exportUsersCSV = async () => {
  const res = await api.get("/users/export", {
    responseType: "blob", // because it’s a CSV file, means type of binary large obj, instead of JSON, or text.
    withCredentials: true,
  });
  return res;
};

// Delete user
export const deleteUser = async (id: number) => {
  const res = await api.delete(`/users/${id}`, { withCredentials: true });
  return res.data;
};

// Toggle active / inactive
export const toggleUserStatus = async (id: number, status: "active" | "inactive") => {
  const res = await api.put(`/users/${id}/status`, { status }, { withCredentials: true });
  return res.data;
};



