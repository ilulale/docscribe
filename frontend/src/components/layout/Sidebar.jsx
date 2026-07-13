import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useState, useEffect } from "react";
import { listSessions } from "../../api/endpoints";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/sessions/new", label: "New Recording" },
  { to: "/settings/letterhead", label: "Letterhead" },
  { to: "/settings/report-template", label: "Report Template" },
];

const adminItems = [
  { to: "/admin/doctors", label: "Doctors" },
  { to: "/admin/invoices", label: "Invoices" },
  { to: "/admin/credits", label: "Credits" },
  { to: "/admin/stats", label: "Stats" },
];

export default function Sidebar() {
  const doctor = useAuthStore((s) => s.doctor);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [processingCount, setProcessingCount] = useState(0);

  useEffect(() => {
    if (!doctor) fetchProfile();
  }, [doctor, fetchProfile]);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const sessions = await listSessions({ pageSize: 20 });
        const count = sessions.filter(
          (s) =>
            s.status === "pending" ||
            s.status === "transcribing" ||
            s.status === "generating_soap"
        ).length;
        if (active) setProcessingCount(count);
      } catch {
        /* ignore */
      }
    }
    check();
    const interval = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="w-56 bg-surface-0 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="relative">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {processingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full animate-pulse-dot" />
          )}
        </div>
        <span className="text-sm font-semibold tracking-tight">Docscribe</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        {doctor?.is_admin && (
          <>
            <div className="pt-5 pb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
                Admin
              </span>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3">
          <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-2xs font-semibold text-white/70">
            {doctor?.name?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white/80 truncate">
              {doctor?.name || "Doctor"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
