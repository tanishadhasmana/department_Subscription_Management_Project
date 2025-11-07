// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3002/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // must be true so browser sends backend cookie
});

export default api;

