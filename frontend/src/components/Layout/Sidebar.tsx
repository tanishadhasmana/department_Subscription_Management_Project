import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, Menu } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/subscription", icon: <Package size={20} />, label: "Subscriptions" },
    { path: "/users", icon: <Users size={20} />, label: "Users" },
  ];

  return (
    <aside
      className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white h-screen fixed top-0 left-0 flex flex-col transition-all duration-300 shadow-xl z-50 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Sidebar Top Header */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-gray-700">
        {isOpen && (
          <span className="text-base font-semibold text-white">
            Department Subscription Management
          </span>
        )}

        {/* Hamburger Icon */}
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer ml-auto text-gray-300"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar Menu */}
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className={`${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
                    {item.icon}
                  </span>
                  {isOpen && (
                    <span className="font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                  {isActive && isOpen && (
                    <span className="ml-auto w-2 h-2 bg-white rounded-full"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      {isOpen && (
        <div className="px-5 py-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 text-center">
            © 2025 DSM v1.0
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;






// import React from "react";
// import { Link, useLocation } from "react-router-dom";
// import { LayoutDashboard, Users, Package,  } from "lucide-react";
// import { FaBars } from "react-icons/fa";

// interface SidebarProps {
//   isOpen: boolean;
//   toggleSidebar: () => void;
// }

// const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
//   const location = useLocation();

//   const menuItems = [
//     { path: "/dashboard", icon: <LayoutDashboard size={22} />, label: "Dashboard" },
//     { path: "/subscription", icon: <Package size={22} />, label: "Subscriptions" },
//     { path: "/users", icon: <Users size={22} />, label: "Users" },
//   ];

//   return (
//     <aside
//       className={`bg-gray-900 text-white h-screen fixed top-0 left-0 flex flex-col transition-all duration-300 ${
//         isOpen ? "w-64" : "w-20"
//       }`}
//     >
//       {/* Sidebar Top Header */}
//       <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
//         {isOpen && <span className="text-xl font-semibold">Department Subscription Management</span>}

//         {/* Hamburger Icon INSIDE Sidebar */}
//         <button onClick={toggleSidebar} className="text-gray-300 hover:text-white cursor-pointer">
//           <FaBars size={22} />
//         </button>
//       </div>

//       {/* Sidebar Menu */}
//       <nav className="flex-1 overflow-y-auto">
//         <ul className="mt-5">
//           {menuItems.map((item) => (
//             <li key={item.path}>
//               <Link
//                 to={item.path}
//                 className={`flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors ${
//                   location.pathname === item.path ? "bg-gray-800" : ""
//                 }`}
//               >
//                 {item.icon}
//                 {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
//               </Link>
//             </li>
//           ))}
//         </ul>
//       </nav>
//     </aside>
//   );
// };

// export default Sidebar;



