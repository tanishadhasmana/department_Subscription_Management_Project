// src/pages/Users/AddUser.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById } from "../../services/userService";
import type { User, UserStatus } from "../../types/User";
import api from "../../lib/api";
import toast from "react-hot-toast";

// Department type
interface Department {
  id: number;
  deptName: string;
  deptStatus: string;
}

// Form data structure
interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  department_name: string;
  status: UserStatus;
}

const AddUser: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    defaultValues: { status: "active" },
    mode: "onChange",
  });

  // Prevent spaces in text inputs
  const handleNoSpaces = (e: React.ChangeEvent<HTMLInputElement>, field: keyof UserFormData) => {
    const value = e.target.value.replace(/\s+/g, "");
    setValue(field, value, { shouldValidate: true });
  };

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get<{ id: number; deptName: string; deptStatus: string }[]>("/departments", { withCredentials: true });
        const activeDepartments = res.data.filter((d) => d.deptStatus.toLowerCase() === "active");
        setDepartments(activeDepartments);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Failed to load departments");
      }
    };
    fetchDepartments();
  }, []);

  // Prefill form if editing
  useEffect(() => {
    if (!editing || !id || departments.length === 0) return;

    const fetchUser = async () => {
      try {
        const data: User = await getUserById(Number(id));
        setValue("first_name", data.first_name || "");
        setValue("last_name", data.last_name || "");
        setValue("email", data.email || "");
        setValue("phone_no", data.phone_no || "");
        setValue("department_name", data.department_name || "");
        setValue("status", data.status);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("Failed to load user data");
      }
    };

    fetchUser();
  }, [editing, id, departments, setValue]);

  // Submit form
  const onSubmit = async (data: UserFormData) => {
    try {
      if (editing && id) {
        await api.put(`/users/${id}`, data, { withCredentials: true });
        toast.success("User updated successfully");
      } else {
        await api.post("/users", data, { withCredentials: true });
        toast.success("User created successfully");
      }
      navigate("/users");
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error("Failed to save user");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("first_name", {
                required: "First name is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
                maxLength: { value: 20, message: "Maximum 20 characters" },
                pattern: { value: /^[A-Za-z]+$/, message: "Only alphabets allowed" },
              })}
              onChange={(e) => handleNoSpaces(e, "first_name")}
              className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${errors.first_name ? "border-red-500" : ""}`}
              placeholder="First Name"
            />
            {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("last_name", {
                required: "Last name is required",
                minLength: { value: 2, message: "Minimum 2 characters" },
                maxLength: { value: 20, message: "Maximum 20 characters" },
                pattern: { value: /^[A-Za-z]+$/, message: "Only alphabets allowed" },
              })}
              onChange={(e) => handleNoSpaces(e, "last_name")}
              className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${errors.last_name ? "border-red-500" : ""}`}
              placeholder="Last Name"
            />
            {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                maxLength: { value: 100, message: "Email cannot exceed 100 characters" },
                pattern: { value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: "Enter a valid email address" },
              })}
              className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${errors.email ? "border-red-500" : ""}`}
              placeholder="Email"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("phone_no", {
                required: "Phone number is required",
                pattern: {
                  value: /^\+91 \d{5} \d{5}$/,
                  message: "Enter valid number (+91 XXXXX XXXXX)",
                },
              })}
              placeholder="+91 99999 99999"
              className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${errors.phone_no ? "border-red-500" : ""}`}
            />
            {errors.phone_no && <p className="text-red-500 text-sm mt-1">{errors.phone_no.message}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              {...register("department_name", { required: "Department is required" })}
              className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${errors.department_name ? "border-red-500" : ""}`}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.deptName}>
                  {d.deptName}
                </option>
              ))}
            </select>
            {errors.department_name && <p className="text-red-500 text-sm mt-1">{errors.department_name.message}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status", { required: "Status is required" })}
              className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${errors.status ? "border-red-500" : ""}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {editing ? "Update User" : "Add User"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border px-6 py-2 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;




// src/pages/Users/AddUser.tsx
// import React, { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import Header from "../../components/Layout/Header";
// import { useNavigate, useParams } from "react-router-dom";
// import { getUserById } from "../../services/userService";
// import type { User, UserStatus } from "../../types/User";
// import api from "../../lib/api";
// import toast from "react-hot-toast";

// // Form data structure
// interface UserFormData {
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone_no: string;
//   department_name: string;
//   status: UserStatus;
// }

// const AddUser: React.FC = () => {
//   const { id } = useParams<{ id?: string }>();
//   const editing = Boolean(id);
//   const nav = useNavigate();

//   const [departments, setDepartments] = useState<{ id: number; deptName: string }[]>([]);

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors, isSubmitting },
//   } = useForm<UserFormData>({
//     defaultValues: { status: "active" },
//     mode: "onChange",
//   });

//   // Prevent spaces for text inputs
//   const handleNoSpaces = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     fieldName: keyof UserFormData
//   ) => {
//     const value = e.target.value.replace(/\s+/g, "");
//     setValue(fieldName, value, { shouldValidate: true });
//   };

//   // Fetch departments
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await api.get("/departments", { withCredentials: true });
//         const data = Array.isArray(res.data) ? res.data : res.data.departments || [];
//         const activeDepartments = data.filter((d: any) => d.deptStatus?.toLowerCase() === "active");
//         setDepartments(activeDepartments);
//       } catch (err) {
//         console.error("Failed to load departments:", err);
//         toast.error("Failed to fetch departments");
//       }
//     })();
//   }, []);

//   // Prefill form if editing
//   useEffect(() => {
//     if (!editing || !id || departments.length === 0) return;

//     const fetchUser = async () => {
//       try {
//         const data: User = await getUserById(Number(id));
//         setValue("first_name", data.first_name || "");
//         setValue("last_name", data.last_name || "");
//         setValue("email", data.email || "");
//         setValue("phone_no", data.phone_no || "");
//         setValue("department_name", data.department_name || "");
//         setValue("status", data.status);
//       } catch (error) {
//         console.error("Failed to fetch user:", error);
//         toast.error("Failed to load user data");
//       }
//     };

//     fetchUser();
//   }, [editing, id, departments, setValue]);

//   // Submit form
//   const onSubmit = async (data: UserFormData) => {
//     try {
//       const payload = { ...data };

//       if (editing && id) {
//         await api.put(`/users/${id}`, payload, { withCredentials: true });
//         toast.success("User updated successfully");
//       } else {
//         await api.post("/users", payload, { withCredentials: true });
//         toast.success("User created successfully");
//       }

//       nav("/users");
//     } catch (err: unknown) {
//       console.error("Save failed:", err);
//       toast.error("Failed to save user");
//     }
//   };

//   return (
//     <div>
//       <Header title={editing ? "Edit User" : "Add User"} right={<div />} />

//       <form
//         onSubmit={handleSubmit(onSubmit)}
//         className="bg-white p-8 rounded shadow-md max-w-4xl mx-auto mt-6"
//       >
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* First Name */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               First Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               {...register("first_name", {
//                 required: "First name is required",
//                 minLength: { value: 3, message: "Minimum 3 characters" },
//                 maxLength: { value: 20, message: "Maximum 20 characters" },
//                 pattern: { value: /^[A-Za-z]+$/, message: "Only alphabets allowed" },
//               })}
//               onChange={(e) => handleNoSpaces(e, "first_name")}
//               className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${
//                 errors.first_name ? "border-red-500" : ""
//               }`}
//               placeholder="First Name"
//             />
//             {errors.first_name && (
//               <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
//             )}
//           </div>

//           {/* Last Name */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Last Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               {...register("last_name", {
//                 required: "Last name is required",
//                 minLength: { value: 2, message: "Minimum 2 characters" },
//                 maxLength: { value: 20, message: "Maximum 20 characters" },
//                 pattern: { value: /^[A-Za-z]+$/, message: "Only alphabets allowed" },
//               })}
//               onChange={(e) => handleNoSpaces(e, "last_name")}
//               className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${
//                 errors.last_name ? "border-red-500" : ""
//               }`}
//               placeholder="Last Name"
//             />
//             {errors.last_name && (
//               <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
//             )}
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Email <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="email"
//               {...register("email", {
//                 required: "Email is required",
//                 maxLength: { value: 100, message: "Email cannot exceed 100 characters" },
//                 pattern: { value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: "Enter a valid email address" },
//               })}
//               className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${
//                 errors.email ? "border-red-500" : ""
//               }`}
//               placeholder="Email"
//             />
//             {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
//           </div>

//           {/* Phone */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Phone <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               {...register("phone_no", {
//                 required: "Phone number is required",
//                 pattern: {
//                   value: /^\+91 \d{5} \d{5}$/,
//                   message: "Enter valid number (+91 XXXXX XXXXX)",
//                 },
//               })}
//               placeholder="+91 99999 99999"
//               className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${
//                 errors.phone_no ? "border-red-500" : ""
//               }`}
//             />
//             {errors.phone_no && <p className="text-red-500 text-sm mt-1">{errors.phone_no.message}</p>}
//           </div>

//           {/* Department */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Department <span className="text-red-500">*</span>
//             </label>
//             <select
//               {...register("department_name", { required: "Department is required" })}
//               className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${
//                 errors.department_name ? "border-red-500" : ""
//               }`}
//             >
//               <option value="">Select Department</option>
//               {departments.map((d) => (
//                 <option key={d.id} value={d.deptName}>
//                   {d.deptName}
//                 </option>
//               ))}
//             </select>
//             {errors.department_name && (
//               <p className="text-red-500 text-sm mt-1">{errors.department_name.message}</p>
//             )}
//           </div>

//           {/* Status */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Status <span className="text-red-500">*</span>
//             </label>
//             <select
//               {...register("status", { required: "Status is required" })}
//               className={`border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 ${
//                 errors.status ? "border-red-500" : ""
//               }`}
//             >
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//             {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
//           </div>
//         </div>

//         <div className="mt-8 flex gap-3">
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
//           >
//             {editing ? "Update User" : "Add User"}
//           </button>
//           <button
//             type="button"
//             onClick={() => nav(-1)}
//             className="border px-6 py-2 rounded hover:bg-gray-100"
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AddUser;

