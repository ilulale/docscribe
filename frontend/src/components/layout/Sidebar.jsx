import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/sessions/new", label: "New Recording" },
  { to: "/settings/letterhead", label: "Letterhead" },
];

const adminItems = [
  { to: "/admin/doctors", label: "Doctors" },
  { to: "/admin/invoices", label: "Invoices" },
  { to: "/admin/credits", label: "Credits" },
  { to: "/admin/stats", label: "Stats" },
];

export default function Sidebar() {
  const doctor = useAuthStore((s) => s.doctor);

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        Docscribe
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded transition-colors ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {doctor?.is_admin && (
          <>
            <div className="pt-4 pb-2 text-xs text-gray-500 uppercase tracking-wider">
              Admin
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded transition-colors ${
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
