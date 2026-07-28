import { useAuthStore } from "../../stores/authStore";

export default function TopBar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="h-14 border-b border-border bg-white/80 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
          <svg
            width="12"
            height="12"
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
        <span className="text-sm font-semibold tracking-tight">Docscribe</span>
      </div>
      <button onClick={logout} className="btn-ghost text-xs ml-auto">
        Sign out
      </button>
    </header>
  );
}
