
import React, { useEffect, useState, useCallback } from "react";
import { getUsers } from "../../services/userService";
import type { User } from "../../types/User";
import toast, { Toaster } from "react-hot-toast";
import { RingLoader } from "react-spinners";

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Users</h2>

      <Toaster position="top-right" reverseOrder={false} />

      <div className="bg-white rounded shadow overflow-auto mt-4">
        {loading ? (
          <div className="min-h-[500px] flex justify-center items-center">
            <RingLoader size={80} />
          </div>
        ) : (
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">First Name</th>
                <th className="p-3 text-left">Last Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center p-4 text-gray-500 italic"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u, index) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{u.first_name || "-"}</td>
                    <td className="p-3">{u.last_name || "-"}</td>
                    <td className="p-3">{u.email || "-"}</td>
                    <td className="p-3">{u.phone_no || "-"}</td>
                    <td className="p-3 capitalize">{u.role_name || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserList;








// import React, { useEffect, useState, useCallback, useRef } from "react";
// import { getUsers, deleteUser, toggleUserStatus } from "../../services/userService";
// import type { User } from "../../types/User";
// import { useNavigate } from "react-router-dom";
// import { Edit, Trash2 } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import Pagination from "../../components/common/Pagination";
// import { RingLoader } from "react-spinners";
// import { confirmAlert } from "react-confirm-alert";

// const UserList: React.FC = () => {
//   const [users, setUsers] = useState<User[]>([]);
//   const [limit, setLimit] = useState(10);
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const [searchValues, setSearchValues] = useState({
//     id: "",
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     roleName: "",
//   });
//   const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
//   const [sortBy, setSortBy] = useState<string | undefined>(undefined);
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

//   const nav = useNavigate();
//   const didMountSearch = useRef(false);
//   const skipNextSearch = useRef(false);

//   const loadUsers = useCallback(
//     async (
//       filterColumn?: string,
//       filterValue?: string,
//       page: number = 1,
//       newLimit: number = limit,
//       sb?: string,
//       so?: "asc" | "desc"
//     ) => {
//       try {
//         setLoading(true);
//         const data = await getUsers(
//           filterValue,
//           filterColumn,
//           page,
//           newLimit,
//           sb ?? sortBy,
//           so ?? sortOrder
//         );

//         setUsers(data.users || []);
//         setTotalUsers(data.total || 0);
//         setTotalPages(data.totalPages ?? 1);
//       } catch (err) {
//         console.error("Failed to fetch users:", err);
//         toast.error("Failed to load users");
//       } finally {
//         setLoading(false);
//       }
//     },
//     [limit, sortBy, sortOrder]
//   );

//   // Debounced search + status
//   useEffect(() => {
//     if (!didMountSearch.current) {
//       didMountSearch.current = true;
//       return;
//     }

//     if (skipNextSearch.current) {
//       skipNextSearch.current = false;
//       return;
//     }

//     const timeout = setTimeout(() => {
//       let column: string | undefined;
//       let value: string | undefined;

//       const columnMap: Record<string, string> = {
//         firstName: "first_name",
//         lastName: "last_name",
//         email: "email",
//         phone: "phone_no",
//         roleName: "role_name",
//       };

//       column = Object.keys(searchValues).find(
//         (key) => searchValues[key as keyof typeof searchValues]
//       );

//       value = column ? searchValues[column as keyof typeof searchValues] : undefined;
//       column = column ? columnMap[column] : undefined;

//       if (statusFilter !== "all") {
//         column = "status";
//         value = statusFilter;
//       }

//       loadUsers(column, value, 1, limit, sortBy, sortOrder);
//     }, 500);

//     return () => clearTimeout(timeout);
//   }, [searchValues, statusFilter, loadUsers, limit, sortBy, sortOrder]);

//   const handleSort = (columnKey: string) => {
//     const newOrder: "asc" | "desc" =
//       sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
//     setSortBy(columnKey);
//     setSortOrder(newOrder);
//     skipNextSearch.current = true;

//     let column: string | undefined = undefined;
//     let value: string | undefined = undefined;
//     if (statusFilter !== "all") {
//       column = "status";
//       value = statusFilter;
//     }

//     loadUsers(column, value, 1, limit, columnKey, newOrder);
//   };

//   const handleDeleteConfirmed = async (id: number, onClose?: () => void) => {
//     try {
//       await deleteUser(id);
//       setUsers((prev) => prev.filter((user) => user.id !== id));
//       toast.success("User deleted successfully");
//     } catch (err) {
//       console.error("Delete failed:", err);
//       toast.error("Failed to delete user");
//     } finally {
//       if (onClose) onClose();
//     }
//   };

//   const confirmDelete = (id: number) => {
//     confirmAlert({
//       customUI: ({ onClose }) => (
//         <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scaleIn">
//             <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
//               Are you sure you want to delete this user?
//             </h3>
//             <p className="text-gray-600 mb-6 text-center">
//               This action cannot be undone.
//             </p>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={onClose}
//                 className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleDeleteConfirmed(id, onClose)}
//                 className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       ),
//     });
//   };

//   const handleToggle = async (id: number, newStatus: "active" | "inactive") => {
//     try {
//       await toggleUserStatus(id, newStatus);
//       setUsers((prev) =>
//         prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
//       );
//       toast.success(
//         newStatus === "active"
//           ? "User marked as active"
//           : "User marked as inactive"
//       );
//     } catch (err) {
//       console.error("Status update failed:", err);
//       toast.error("Failed to update status");
//     }
//   };

//   useEffect(() => {
//     loadUsers(undefined, undefined, 1);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const SortArrow = ({ column }: { column: string }) => {
//     if (sortBy !== column)
//       return <span className="inline-block ml-2 opacity-50 select-none">▲▼</span>;
//     return sortOrder === "asc" ? (
//       <span className="inline-block ml-2 select-none">▲</span>
//     ) : (
//       <span className="inline-block ml-2 select-none">▼</span>
//     );
//   };

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold text-gray-800">Users</h2>
//         <button
//           onClick={() => nav("/users/add")}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
//         >
//           Add User
//         </button>
//       </div>

//       <Toaster position="top-right" reverseOrder={false} />

//       <div className="bg-white rounded shadow overflow-auto mt-4">
//         {loading ? (
//           <div className="min-h-[500px] flex justify-center items-center">
//             <RingLoader size={80} />
//           </div>
//         ) : (
//           <>
//             <table className="min-w-full border text-sm">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="p-3 text-left">#</th>
//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("first_name")}
//                     >
//                       First Name <SortArrow column="first_name" />
//                     </button>
//                   </th>
//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("last_name")}
//                     >
//                       Last Name <SortArrow column="last_name" />
//                     </button>
//                   </th>
//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("email")}
//                     >
//                       Email <SortArrow column="email" />
//                     </button>
//                   </th>
//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("phone_no")}
//                     >
//                       Phone <SortArrow column="phone_no" />
//                     </button>
//                   </th>
//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("role_name")}
//                     >
//                       Role <SortArrow column="role_name" />
//                     </button>
//                   </th>
//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-center">Actions</th>
//                 </tr>
//                 <tr className="bg-gray-100">
//                   <th></th>
//                   <th className="p-2">
//                     <input
//                       type="text"
//                       placeholder="Search First Name"
//                       value={searchValues.firstName}
//                       onChange={(e) =>
//                         setSearchValues((prev) => ({
//                           ...prev,
//                           firstName: e.target.value,
//                         }))
//                       }
//                       className="w-full p-1 border rounded"
//                     />
//                   </th>
//                   <th className="p-2">
//                     <input
//                       type="text"
//                       placeholder="Search Last Name"
//                       value={searchValues.lastName}
//                       onChange={(e) =>
//                         setSearchValues((prev) => ({
//                           ...prev,
//                           lastName: e.target.value,
//                         }))
//                       }
//                       className="w-full p-1 border rounded"
//                     />
//                   </th>
//                   <th className="p-2">
//                     <input
//                       type="text"
//                       placeholder="Search Email"
//                       value={searchValues.email}
//                       onChange={(e) =>
//                         setSearchValues((prev) => ({
//                           ...prev,
//                           email: e.target.value,
//                         }))
//                       }
//                       className="w-full p-1 border rounded"
//                     />
//                   </th>
//                   <th className="p-2">
//                     <input
//                       type="text"
//                       placeholder="Search Phone"
//                       value={searchValues.phone}
//                       onChange={(e) =>
//                         setSearchValues((prev) => ({
//                           ...prev,
//                           phone: e.target.value,
//                         }))
//                       }
//                       className="w-full p-1 border rounded"
//                     />
//                   </th>
//                   <th className="p-2">
//                     <input
//                       type="text"
//                       placeholder="Search Role"
//                       value={searchValues.roleName}
//                       onChange={(e) =>
//                         setSearchValues((prev) => ({
//                           ...prev,
//                           roleName: e.target.value,
//                         }))
//                       }
//                       className="w-full p-1 border rounded"
//                     />
//                   </th>
//                   <th>
//                     <select
//                       value={statusFilter}
//                       onChange={(e) =>
//                         setStatusFilter(
//                           e.target.value as "all" | "active" | "inactive"
//                         )
//                       }
//                       className="w-full border rounded px-2 py-1"
//                     >
//                       <option value="all">All</option>
//                       <option value="active">Active</option>
//                       <option value="inactive">Inactive</option>
//                     </select>
//                   </th>
//                   <th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={8}
//                       className="text-center p-4 text-gray-500 italic"
//                     >
//                       No users found.
//                     </td>
//                   </tr>
//                 ) : (
//                   users.map((u, index) => (
//                     <tr key={u.id} className="border-t hover:bg-gray-50">
//                       <td className="p-3">
//                         {(currentPage - 1) * limit + index + 1}
//                       </td>
//                       <td className="p-3">{u.first_name || "-"}</td>
//                       <td className="p-3">{u.last_name || "-"}</td>
//                       <td className="p-3">{u.email || "-"}</td>
//                       <td className="p-3">{u.phone_no || "-"}</td>
//                       <td className="p-3 capitalize">{u.role_name || "-"}</td>

//                       <td className="p-3">
//                         <label className="relative inline-flex items-center cursor-pointer">
//                           <input
//                             type="checkbox"
//                             checked={u.status?.toLowerCase() === "active"}
//                             onChange={(e) =>
//                               handleToggle(
//                                 u.id,
//                                 e.target.checked ? "active" : "inactive"
//                               )
//                             }
//                             className="sr-only peer"
//                           />
//                           <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
//                         </label>
//                       </td>

//                       <td className="p-3 text-center space-x-3">
//                         <button
//                           onClick={() => nav(`/users/edit/${u.id}`)}
//                           className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
//                           title="Edit User"
//                         >
//                           <Edit size={18} />
//                         </button>
//                         <button
//                           onClick={() => confirmDelete(u.id)}
//                           className="text-red-600 hover:text-red-800 cursor-pointer"
//                           title="Delete User"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>

//             <div className="flex justify-between items-center mt-4">
//               <span className="text-sm text-gray-600">
//                 Total Users: {totalUsers}
//               </span>
//               <Pagination
//                 currentPage={currentPage}
//                 totalPages={totalPages}
//                 onPageChange={(p) => {
//                   skipNextSearch.current = true;
//                   setCurrentPage(p);
//                   let column: string | undefined = undefined;
//                   let value: string | undefined = undefined;
//                   if (statusFilter !== "all") {
//                     column = "status";
//                     value = statusFilter;
//                   }
//                   loadUsers(column, value, p, limit, sortBy, sortOrder);
//                 }}
//                 limit={limit}
//                 onLimitChange={(newLimit) => {
//                   skipNextSearch.current = true;
//                   setLimit(newLimit);
//                   setCurrentPage(1);
//                   let column: string | undefined = undefined;
//                   let value: string | undefined = undefined;
//                   if (statusFilter !== "all") {
//                     column = "status";
//                     value = statusFilter;
//                   }
//                   loadUsers(column, value, 1, newLimit, sortBy, sortOrder);
//                 }}
//               />
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserList;



