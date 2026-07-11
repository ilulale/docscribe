import { useAuthStore } from "../../stores/authStore";

export default function TopBar() {
  const doctor = useAuthStore((s) => s.doctor);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{doctor?.name}</span>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
