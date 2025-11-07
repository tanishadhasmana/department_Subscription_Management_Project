import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { confirmAlert } from "react-confirm-alert";
import toast from "react-hot-toast";
import { Building2 } from "lucide-react"; // Logo icon

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, right }) => {
  const { user, logout } = useAuth();

  const handleLogoutConfirmed = async (onClose: () => void) => {
    await logout();
    onClose();
    toast.success("You have been logged out successfully");
  };

  const confirmLogout = () => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scaleIn">
            <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
              Are you sure you want to log out?
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              You can log in again later.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogoutConfirmed(onClose)}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ),
    });
  };

  return (
    <header className="w-full bg-white shadow p-4 flex justify-between items-center sticky top-0 z-40">
      {/* Left Section — Logo + Title */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="bg-blue-600 p-2 rounded-lg flex items-center justify-center shadow">
          <Building2 size={22} className="text-white" />
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-gray-800">
          DSM
        </h1>

        {/* Optional dynamic page title */}
        {title && (
          <h2 className="text-lg font-medium text-gray-700 ml-4">{title}</h2>
        )}
      </div>

      {/* Right Section — User Info + Logout */}
      <div className="flex items-center gap-4">
        {right}
        <span className="text-gray-700">
          Welcome, {user?.first_name }
        </span>
        <button
          onClick={confirmLogout}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;



// import React from "react";
// import { useAuth } from "../../hooks/useAuth";
// import { confirmAlert } from "react-confirm-alert";
// import toast from "react-hot-toast";

// interface HeaderProps {
//   title?: string;
//   right?: React.ReactNode;
// }

// // const Header: React.FC = () => {
// //   const { user, logout } = useAuth();
// const Header: React.FC<HeaderProps> = ({ title, right }) => {
//   const { user, logout } = useAuth();

//   const handleLogoutConfirmed = async (onClose: () => void) => {
//     await logout();
//     onClose();
//     toast.success("You have been logged out successfully");
//   };

//   const confirmLogout = () => {
//     confirmAlert({
//       customUI: ({ onClose }) => (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scaleIn">
//             <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
//               Are you sure you want to log out?
//             </h3>
//             <p className="text-gray-600 mb-6 text-center">
//               You can log in again later.
//             </p>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={onClose}
//                 className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleLogoutConfirmed(onClose)}
//                 className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       ),
//     });
//   };

//   return (
//     <header className="w-full bg-white shadow p-4 flex justify-between items-center">
//       <div>{title && <h2 className="text-xl font-semibold">{title}</h2>}</div>
//       <div className="flex items-center gap-4">
//         {right}
//         <span>Welcome, {user?.firstName || "Admin"}</span>
//         <button onClick={confirmLogout}>Logout</button>
//       </div>
//     </header>
//   );
// };

// export default Header;
