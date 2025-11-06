// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3002/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // must be true so browser sends backend cookie
});

export default api;




// src/lib/api.ts
// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3002/api",
//   headers: { "Content-Type": "application/json" },
//   withCredentials: true, // This is critical - sends cookies with every request
// });

// // ✅ Request interceptor - extract token from cookie and add to Authorization header
// api.interceptors.request.use(
//   (config) => {
//     // Read token from cookie
//     const token = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("token="))
//       ?.split("=")[1];

//     // If token exists in cookie, attach it to Authorization header
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // ✅ Response interceptor - handle 401 errors (token expired/invalid)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // If we get 401 Unauthorized, redirect to login
//     if (error.response?.status === 401) {
//       // Clear the cookie
//       document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
//       // Redirect to login if not already there
//       if (window.location.pathname !== "/login") {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;






// intercepor

// // axios is a library which is used to make http reqs like get,post,put,dlt etc to the backend api.
// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3002/api",
//   // I’m sending data in JSON format
//   headers: { "Content-Type": "application/json" },
//   withCredentials: true, // adds cookies automatically, with every req.
// });

// // api.interceptors.request.use((config) => config);

// export default api;
