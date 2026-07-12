import { useAuthStore } from "../../stores/authStore";

export default function TopBar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="h-14 border-b border-border bg-white/80 backdrop-blur-sm px-6 flex items-center justify-end shrink-0">
      <button onClick={logout} className="btn-ghost text-xs">
        Sign out
      </button>
    </header>
  );
}
