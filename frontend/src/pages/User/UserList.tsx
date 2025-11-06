// src/pages/Users/UserList.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  getUsers,
  deleteUser,
  toggleUserStatus,
  exportUsersCSV,
} from "../../services/userService";
import type { User } from "../../types/User";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Layout/Header";
import { Edit, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Pagination from "../../components/common/Pagination";
import { RingLoader } from "react-spinners";
import { motion } from "framer-motion";
import { confirmAlert } from "react-confirm-alert";

const UserList: React.FC = () => {
  // instead, const [users, setUsers] = useState([ ]), because we have to define type of that empty array too.
  const [users, setUsers] = useState<User[]>([]);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  // True while API call runs → shows loader spinner.
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // True when CSV export is in progress → disables button.
  const [exporting, setExporting] = useState(false);
  // Hook to navigate between pages.
  const nav = useNavigate();
  // Stores all search filters, When user types into the search boxes, these get updated.
  const [searchValues, setSearchValues] = useState({
    id: "",
    firstName: "",
    email: "",
    phone: "",
    departmentName: "",
    status: "",
  });

  // sorting state
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Flags to prevent duplicate calls, These act like variables that don’t reset on re-renders.

  // prevents duplicate initial API call.
  const didInit = React.useRef(false);
  // skips running search effect first time.
  const didMountSearch = React.useRef(false);
  // avoids duplicate search after pagination/limit change.
  const skipNextSearch = React.useRef(false);

  // Fetches users from backend using getUsers() with filters, pagination, and sorting.
  // Wrapped in useCallback to prevent unnecessary recreation.
  // setUsers() updates the table.
  // finally ensures loading is false after every fetch.
  const loadUsers = useCallback(
    async (
      filterColumn?: string,
      filterValue?: string,
      page: number = 1,
      newLimit: number = limit,
      sb?: string,
      so?: "asc" | "desc"
    ) => {
      try {
        setLoading(true);
        const data = await getUsers(
          filterValue,
          filterColumn,
          page,
          newLimit,
          sb ?? sortBy,
          so ?? sortOrder
        );
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [limit, sortBy, sortOrder]
  );

  // Debounced search filter (skip first render and optionally skip next if pagination triggered)
  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return; // skip on first render so initial load (didInit) happens alone
    }

    if (skipNextSearch.current) {
      // pagination/limit change explicitly requested loadUsers — skip the debounced follow-up
      skipNextSearch.current = false;
      return;
    }

    // run the fucn after 5ms, search value can be anything, the name, or mail etc, and find, finds the first key where value is not empty
    const timeout = setTimeout(() => {
      const column = Object.keys(searchValues).find(
        (key) => searchValues[key as keyof typeof searchValues]
      );
      // if col exist with that value, like Tanisha,then add to value
      if (column) {
        const value = searchValues[column as keyof typeof searchValues];
        loadUsers(column, value, 1);
      } else {
        loadUsers(undefined, undefined, 1);
      }
    }, 2000);
    // this is important for the smooth searching, like as we type Ta.. etc it call multiples of time that use effect
    return () => clearTimeout(timeout);
    // Run this effect every time searchValues or loadUsers changes.
  }, [searchValues, loadUsers]);

  // sorting handler
  const handleSort = (columnKey: string) => {
    // toggle order if same column clicked again; otherwise set asc by default
    let newOrder: "asc" | "desc" = "asc";
    if (sortBy === columnKey) {
      newOrder = sortOrder === "asc" ? "desc" : "asc";
    }
    setSortBy(columnKey);
    setSortOrder(newOrder);

    // re-fetch first page with new sort (we decided not to suppress search after sort)
    loadUsers(undefined, undefined, 1, limit, columnKey, newOrder);
  };

  // actual deletion logic (keeps same messaging), on close callback fucn, to close the model.
  const handleDeleteConfirmed = async (id: number, onClose?: () => void) => {
    try {
      // calls dlt user API and wait for it to finish, ensure only respond when srver respond with success msg.
      await deleteUser(id);
      // update state of user, filter here creating new arr, of users for whose the condition is true,means keep all users whose id is not equal to dlt user's id.
      setUsers((prev: User[]) => prev.filter((user: User) => user.id !== id));
      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete user");
    } finally {
      // close modal if provided
      if (onClose) onClose();
    }
  };

  const confirmDelete = (id: number) => {
    // fucn imported from react confrim alert, for confrimation dailog
    confirmAlert({
      // property of r-c-a to render that model
      customUI: ({ onClose }) => (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scaleIn">
            <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
              Are you sure you want to delete this user?
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirmed(id, onClose)}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ),
    });
  };

  // Toggle user active/inactive
  const handleToggle = async (
    id: number,
    currentStatus: "active" | "inactive"
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await toggleUserStatus(id, newStatus);
      setUsers((prev: User[]) =>
        prev.map((u: User) => (u.id === id ? { ...u, status: newStatus } : u))
      );

      toast.success(
        newStatus === "active"
          ? "User marked as active"
          : "User marked as inactive"
      );
    } catch (err) {
      console.error("Status update failed:", err);
      toast.error("Failed to update status");
    }
  };

  // run only once,
  useEffect(() => {
    // avoide double execution
    if (didInit.current) return;
    didInit.current = true;
    loadUsers(undefined, undefined, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SortArrow = ({ column }: { column: string }) => {
    // if col is not sorted , show icons
    if (sortBy !== column) {
      // show neutral small arrows (you can style further)
      return (
        <span
          className="inline-block ml-2 opacity-50 select-none cursor-pointer"
          aria-hidden
        >
          ▲▼
        </span>
      );
    }
    return sortOrder === "asc" ? (
      <span className="inline-block ml-2 select-none">▲</span>
    ) : (
      <span className="inline-block ml-2 select-none">▼</span>
    );
  };

  return (
    <div>
      <Header
        title="Users"
        right={
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (exporting) return; // prevent multiple clicks
                setExporting(true);
                try {
                  const res = await exportUsersCSV();
                  //binary large obj, represent raw binary data like file, img, text etc, used to create a downlodable file obj,
                  const blob = new Blob([res.data], {
                    type: "text/csv;charset=utf-8;",
                  });
                  // convert blob to temporary url.
                  const url = window.URL.createObjectURL(blob);
                  // create its anchor tag
                  const link = document.createElement("a");
                  // set that link to temprory link
                  link.href = url;
                  // sets the download file name.
                  link.setAttribute("download", "users_export.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("All users exported successfully");
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to export users");
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              className={`${
                exporting
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 cursor-pointer"
              } text-white px-4 py-2 rounded`}
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>

            {/* Add User */}
            <button
              onClick={() => nav("/users/add")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
            >
              Add User
            </button>
          </div>
        }
      />

      <Toaster position="top-right" reverseOrder={false} />

      <div className="bg-white rounded shadow overflow-auto mt-4">
        {loading ? (
          <div className="min-h-[500px] flex justify-center items-center">
            <RingLoader size={80} />
          </div>
        ) : (
          <>
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("id")}
                      aria-label="Sort by ID"
                    >
                      ID <SortArrow column="id" />
                    </button>
                  </th>

                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("firstName")}
                      aria-label="Sort by Name"
                    >
                      Name <SortArrow column="firstName" />
                    </button>
                  </th>

                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("email")}
                      aria-label="Sort by Email"
                    >
                      Email <SortArrow column="email" />
                    </button>
                  </th>

                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("phone")}
                      aria-label="Sort by Phone"
                    >
                      Phone <SortArrow column="phone" />
                    </button>
                  </th>

                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("departmentName")}
                      aria-label="Sort by departmentName"
                    >
                      Role <SortArrow column="departmentName" />
                    </button>
                  </th>

                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>

                <tr className="border-t">
                  <th className="p-2">
                    <input
                      type="text"
                      placeholder="Search ID"
                      className="border p-1 text-sm rounded w-full"
                      value={searchValues.id}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); //remove everything that is not digit from the strg
                        setSearchValues({
                          id: value,
                          firstName: "",
                          email: "",
                          phone: "",
                          departmentName: "",
                          status: "",
                        });
                      }}
                    />
                  </th>

                  {["firstName", "email", "phone", "departmentName"].map((key) => (
                    <th key={key} className="p-2">
                      <input
                        type="text"
                        // dynamic like, search name, mail etc come
                        placeholder={`Search ${key === "departmentName" ? "Department" : key}`}
                        className="border p-1 text-sm rounded w-full"
                        value={searchValues[key as keyof typeof searchValues]}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (
                            // prevent input from starting with space
                            inputValue.trimStart() === "" &&
                            inputValue !== ""
                          )
                            return;
                          // update the search state
                          setSearchValues((prev) => ({
                            // copies all previous value first, then override only which is needed
                            ...prev,
                            id: "",
                            firstName:
                              key === "firstName" ? inputValue.trimStart() : "",
                            email:
                              key === "email" ? inputValue.trimStart() : "",
                            phone:
                              key === "phone" ? inputValue.trimStart() : "",
                           departmentName : key === "departmentName" ? inputValue.trimStart() : "",
                            status: "",
                          }));
                        }}
                      />
                    </th>
                  ))}

                  <th className="p-2">
                    <select
                      className="border p-1 text-sm rounded w-full"
                      value={searchValues.status}
                      onChange={(e) =>
                        setSearchValues({
                          id: "",
                          firstName: "",
                          email: "",
                          phone: "",
                          departmentName: "",
                          status: e.target.value.trim().toLowerCase(),
                        })
                      }
                    >
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center p-4 text-gray-500 italic"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u: User) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{u.id}</td>
                      <td className="p-3">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.phone || "-"}</td>
                      {/* like admin to Admin, super admin to Super Admin */}
                      <td className="p-3 capitalize">{u.departmentName}</td>

                      <td className="p-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={u.status === "active"}
                            onChange={() => handleToggle(u.id, u.status)}
                            className="sr-only peer"
                          />
                          <div
                            className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer
                            peer-checked:bg-green-500
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                            peer-checked:after:translate-x-full"
                          ></div>
                        </label>
                      </td>

                      <td className="p-3 text-center space-x-3">
                        <button
                          onClick={() => nav(`/users/edit/${u.id}`)}
                          className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => confirmDelete(u.id)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Total Users: {totalUsers ?? 0}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  skipNextSearch.current = true; // prevents triggering search effect again
                  setCurrentPage(p);
                  loadUsers(undefined, undefined, p, limit, sortBy, sortOrder);
                }}
                limit={limit}
                onLimitChange={(newLimit) => {
                  skipNextSearch.current = true;
                  setLimit(newLimit);
                  setCurrentPage(1);
                  loadUsers(
                    undefined,
                    undefined,
                    1,
                    newLimit,
                    sortBy,
                    sortOrder
                  );
                }}
              />
            </div>
          </>
        )}
      </div>
      {exporting && (
        <div className="fixed inset-0 bg-green-900/90 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center text-center text-white space-y-6 p-8 rounded-lg"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <RingLoader color="#fff" size={100} />
              <p className="text-3xl font-semibold tracking-wide">
                YOUR FILE IS BEING CREATED
              </p>
              <p className="text-xl">
                Please don’t close or refresh this window until process is
                finished
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserList;




// src/pages/Users/UserList.tsx
// import React, { useEffect, useState, useCallback } from "react";
// import {
//   getUsers,
//   deleteUser,
//   toggleUserStatus,
//   exportUsersCSV,
// } from "../../services/userService";
// import type { User } from "../../types/User";
// import { useNavigate } from "react-router-dom";
// import Header from "../../components/Layout/Header"
// import { Edit, Trash2 } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";
// import Pagination from "../../components/common/Pagination";
// import { RingLoader } from "react-spinners";
// import { motion } from "framer-motion";
// import { confirmAlert } from "react-confirm-alert";

// const UserList: React.FC = () => {
//   // instead, const [users, setUsers] = useState([ ]), because we have to define type of that empty array too.
//   const [users, setUsers] = useState<User[]>([]);
//   const [limit, setLimit] = useState(10);
//   const [totalUsers, setTotalUsers] = useState<number>(0);

//   // True while API call runs → shows loader spinner.
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   // True when CSV export is in progress → disables button.
//   const [exporting, setExporting] = useState(false);
//   // Hook to navigate between pages.
//   const nav = useNavigate();
//   // Stores all search filters, When user types into the search boxes, these get updated.
//   const [searchValues, setSearchValues] = useState({
//     id: "",
//     firstName: "",
//     email: "",
//     phone: "",
//     deptName: "",
//     status: "",
//   });

//   // sorting state
//   const [sortBy, setSortBy] = useState<string | undefined>(undefined);
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

//   // Flags to prevent duplicate calls, These act like variables that don’t reset on re-renders.

//   // prevents duplicate initial API call.
//   const didInit = React.useRef(false);
//   // skips running search effect first time.
//   const didMountSearch = React.useRef(false);
//   // avoids duplicate search after pagination/limit change.
//   const skipNextSearch = React.useRef(false);

//   // Fetches users from backend using getUsers() with filters, pagination, and sorting.
//   // Wrapped in useCallback to prevent unnecessary recreation.
//   // setUsers() updates the table.
//   // finally ensures loading is false after every fetch.
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

//   // Debounced search filter (skip first render and optionally skip next if pagination triggered)
//   useEffect(() => {
//     if (!didMountSearch.current) {
//       didMountSearch.current = true;
//       return; // skip on first render so initial load (didInit) happens alone
//     }

//     if (skipNextSearch.current) {
//       // pagination/limit change explicitly requested loadUsers — skip the debounced follow-up
//       skipNextSearch.current = false;
//       return;
//     }

//     // run the fucn after 5ms, search value can be anything, the name, or mail etc, and find, finds the first key where value is not empty
//     const timeout = setTimeout(() => {
//       const column = Object.keys(searchValues).find(
//         (key) => searchValues[key as keyof typeof searchValues]
//       );
//       // if col exist with that value, like Tanisha,then add to value
//       if (column) {
//         const value = searchValues[column as keyof typeof searchValues];
//         loadUsers(column, value, 1);
//       } else {
//         loadUsers(undefined, undefined, 1);
//       }
//     }, 2000);
//     // this is important for the smooth searching, like as we type Ta.. etc it call multiples of time that use effect
//     return () => clearTimeout(timeout);
//     // Run this effect every time searchValues or loadUsers changes.
//   }, [searchValues, loadUsers]);

//   // sorting handler
//   const handleSort = (columnKey: string) => {
//     // toggle order if same column clicked again; otherwise set asc by default
//     let newOrder: "asc" | "desc" = "asc";
//     if (sortBy === columnKey) {
//       newOrder = sortOrder === "asc" ? "desc" : "asc";
//     }
//     setSortBy(columnKey);
//     setSortOrder(newOrder);

//     // re-fetch first page with new sort (we decided not to suppress search after sort)
//     loadUsers(undefined, undefined, 1, limit, columnKey, newOrder);
//   };

//   // actual deletion logic (keeps same messaging), on close callback fucn, to close the model.
//   const handleDeleteConfirmed = async (id: number, onClose?: () => void) => {
//     try {
//       // calls dlt user API and wait for it to finish, ensure only respond when srver respond with success msg.
//       await deleteUser(id);
//       // update state of user, filter here creating new arr, of users for whose the condition is true,means keep all users whose id is not equal to dlt user's id.
//       setUsers((prev: User[]) => prev.filter((user: User) => user.id !== id));
//       toast.success("User deleted successfully");
//     } catch (err) {
//       console.error("Delete failed:", err);
//       toast.error("Failed to delete user");
//     } finally {
//       // close modal if provided
//       if (onClose) onClose();
//     }
//   };

//   const confirmDelete = (id: number) => {
//     // fucn imported from react confrim alert, for confrimation dailog
//     confirmAlert({
//       // property of r-c-a to render that model
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

//   // Toggle user active/inactive
//   const handleToggle = async (
//     id: number,
//     currentStatus: "active" | "inactive"
//   ) => {
//     const newStatus = currentStatus === "active" ? "inactive" : "active";
//     try {
//       await toggleUserStatus(id, newStatus);
//       setUsers((prev: User[]) =>
//         prev.map((u: User) => (u.id === id ? { ...u, status: newStatus } : u))
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

//   // run only once,
//   useEffect(() => {
//     // avoide double execution
//     if (didInit.current) return;
//     didInit.current = true;
//     loadUsers(undefined, undefined, 1);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const SortArrow = ({ column }: { column: string }) => {
//     // if col is not sorted , show icons
//     if (sortBy !== column) {
//       // show neutral small arrows (you can style further)
//       return (
//         <span
//           className="inline-block ml-2 opacity-50 select-none cursor-pointer"
//           aria-hidden
//         >
//           ▲▼
//         </span>
//       );
//     }
//     return sortOrder === "asc" ? (
//       <span className="inline-block ml-2 select-none">▲</span>
//     ) : (
//       <span className="inline-block ml-2 select-none">▼</span>
//     );
//   };

//   return (
//     <div>
//       <Header
//         title="Users"
//         right={
//           <div className="flex gap-2">
//             <button
//               onClick={async () => {
//                 if (exporting) return; // prevent multiple clicks
//                 setExporting(true);
//                 try {
//                   const res = await exportUsersCSV();
//                   //binary large obj, represent raw binary data like file, img, text etc, used to create a downlodable file obj,
//                   const blob = new Blob([res.data], {
//                     type: "text/csv;charset=utf-8;",
//                   });
//                   // convert blob to temporary url.
//                   const url = window.URL.createObjectURL(blob);
//                   // create its anchor tag
//                   const link = document.createElement("a");
//                   // set that link to temprory link
//                   link.href = url;
//                   // sets the download file name.
//                   link.setAttribute("download", "users_export.csv");
//                   document.body.appendChild(link);
//                   link.click();
//                   document.body.removeChild(link);
//                   toast.success("All users exported successfully");
//                 } catch (err) {
//                   console.error(err);
//                   toast.error("Failed to export users");
//                 } finally {
//                   setExporting(false);
//                 }
//               }}
//               disabled={exporting}
//               className={`${
//                 exporting
//                   ? "bg-green-400 cursor-not-allowed"
//                   : "bg-green-600 hover:bg-green-700 cursor-pointer"
//               } text-white px-4 py-2 rounded`}
//             >
//               {exporting ? "Exporting..." : "Export CSV"}
//             </button>

//             {/* Add User */}
//             <button
//               onClick={() => nav("/users/add")}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
//             >
//               Add User
//             </button>
//           </div>
//         }
//       />

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
//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("deptName")}
//                       aria-label="Sort by Department"
//                     >
//                       Department <SortArrow column="deptName" />
//                     </button>
//                   </th>

//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("firstName")}
//                       aria-label="Sort by Name"
//                     >
//                       Name <SortArrow column="firstName" />
//                     </button>
//                   </th>

//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("email")}
//                       aria-label="Sort by Email"
//                     >
//                       Email <SortArrow column="email" />
//                     </button>
//                   </th>

//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("phone")}
//                       aria-label="Sort by Phone"
//                     >
//                       Phone <SortArrow column="phone" />
//                     </button>
//                   </th>

//                   <th className="p-3 text-left">
//                     <button
//                       className="flex items-center"
//                       onClick={() => handleSort("role")}
//                       aria-label="Sort by Role"
//                     >
//                       Role <SortArrow column="role" />
//                     </button>
//                   </th>

//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-center">Actions</th>
//                 </tr>

//                 <tr className="border-t">
//                   <th className="p-2">
//                     <input
//                       type="text"
//                       placeholder="Search ID"
//                       className="border p-1 text-sm rounded w-full"
//                       value={searchValues.id}
//                       onChange={(e) => {
//                         const value = e.target.value.replace(/\D/g, ""); //remove everything that is not digit from the strg
//                         setSearchValues({
//                           id: value,
//                           firstName: "",
//                           email: "",
//                           phone: "",
//                           deptName: "",
//                           status: "",
//                         });
//                       }}
//                     />
//                   </th>

//                   {["firstName", "email", "phone", "deptName"].map((key) => (
//                     <th key={key} className="p-2">
//                       <input
//                         type="text"
//                         // dynamic like, search name, mail etc come
//                         // placeholder={`Search ${key}`}
//                         placeholder={`Search ${key === "deptName" ? "Department" : key}`}

//                         className="border p-1 text-sm rounded w-full"
//                         value={searchValues[key as keyof typeof searchValues]}
//                         onChange={(e) => {
//                           const inputValue = e.target.value;
//                           if (
//                             // prevent input from starting with space
//                             inputValue.trimStart() === "" &&
//                             inputValue !== ""
//                           )
//                             return;
//                           // update the search state
//                           setSearchValues((prev) => ({
//                             // copies all previous value first, then override only which is needed
//                             ...prev,
//                             id: "",
//                             firstName:
//                               key === "firstName" ? inputValue.trimStart() : "",
//                             email:
//                               key === "email" ? inputValue.trimStart() : "",
//                             phone:
//                               key === "phone" ? inputValue.trimStart() : "",
//                             role: key === "deptName" ? inputValue.trimStart() : "",
//                             status: "",
//                           }));
//                         }}
//                       />
//                     </th>
//                   ))}

//                   <th className="p-2">
//                     <select
//                       className="border p-1 text-sm rounded w-full"
//                       value={searchValues.status}
//                       onChange={(e) =>
//                         setSearchValues({
//                           id: "",
//                           firstName: "",
//                           email: "",
//                           phone: "",
//                           deptName: "",
//                           status: e.target.value.trim().toLowerCase(),
//                         })
//                       }
//                     >
//                       <option value="">All</option>
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
//                       colSpan={7}
//                       className="text-center p-4 text-gray-500 italic"
//                     >
//                       No users found.
//                     </td>
//                   </tr>
//                 ) : (
//                   users.map((u: User) => (
//                     <tr key={u.id} className="border-t hover:bg-gray-50">
//                       <td className="p-3">{u.id}</td>
//                       <td className="p-3">
//                         {u.firstName} {u.lastName}
//                       </td>
//                       <td className="p-3">{u.email}</td>
//                       <td className="p-3">{u.phone || "-"}</td>
//                       {/* like admin to Admin, super admin to Super Admin */}
//                       <td className="p-3 capitalize">{u.deptName || "-"}</td>

//                       <td className="p-3">
//                         <label className="relative inline-flex items-center cursor-pointer">
//                           <input
//                             type="checkbox"
//                             checked={u.status === "active"}
//                             onChange={() => handleToggle(u.id, u.status)}
//                             className="sr-only peer"
//                           />
//                           <div
//                             className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer
//                             peer-checked:bg-green-500
//                             after:content-[''] after:absolute after:top-[2px] after:left-[2px]
//                             after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
//                             peer-checked:after:translate-x-full"
//                           ></div>
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
//                 Total Users: {totalUsers ?? 0}
//               </span>
//               <Pagination
//                 currentPage={currentPage}
//                 totalPages={totalPages}
//                 onPageChange={(p) => {
//                   skipNextSearch.current = true; // prevents triggering search effect again
//                   setCurrentPage(p);
//                   loadUsers(undefined, undefined, p, limit, sortBy, sortOrder);
//                 }}
//                 limit={limit}
//                 onLimitChange={(newLimit) => {
//                   skipNextSearch.current = true;
//                   setLimit(newLimit);
//                   setCurrentPage(1);
//                   loadUsers(
//                     undefined,
//                     undefined,
//                     1,
//                     newLimit,
//                     sortBy,
//                     sortOrder
//                   );
//                 }}
//               />
//             </div>
//           </>
//         )}
//       </div>
//       {exporting && (
//         <div className="fixed inset-0 bg-green-900/90 flex items-center justify-center z-50">
//           <motion.div
//             initial={{ scale: 0.8, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             transition={{ duration: 0.3 }}
//             className="flex flex-col items-center justify-center text-center text-white space-y-6 p-8 rounded-lg"
//           >
//             <div className="flex flex-col items-center justify-center space-y-4">
//               <RingLoader color="#fff" size={100} />
//               <p className="text-3xl font-semibold tracking-wide">
//                 YOUR FILE IS BEING CREATED
//               </p>
//               <p className="text-xl">
//                 Please don’t close or refresh this window until process is
//                 finished
//               </p>
//             </div>
//           </motion.div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserList;
