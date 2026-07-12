import { useState, useEffect } from "react";
import {
  listDoctors,
  createDoctor,
  toggleDoctorActive,
} from "../../api/endpoints";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    try {
      const data = await listDoctors();
      setDoctors(data);
    } catch {
      setError("Failed to load doctors");
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createDoctor(form);
      setForm({ name: "", email: "", password: "" });
      setShowCreate(false);
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create doctor");
    }
    setCreating(false);
  }

  async function handleToggle(doctorId, currentActive) {
    try {
      await toggleDoctorActive(doctorId, !currentActive);
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctors</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage practitioner accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary"
        >
          {showCreate ? "Cancel" : "Add Doctor"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs animate-slide-up">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="card p-5 animate-slide-up">
          <p className="section-title mb-4">New Doctor</p>
          <form onSubmit={handleCreate} className="space-y-3 max-w-md">
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              required
              minLength={6}
            />
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Doctor"
              )}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {doctors.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-canvas transition-colors duration-100"
                >
                  <td className="px-5 py-3.5 text-sm font-medium">{d.name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{d.email}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={
                        d.is_admin ? "badge-info" : "badge-neutral"
                      }
                    >
                      {d.is_admin ? "Admin" : "Doctor"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={
                        d.is_active ? "badge-success" : "badge-danger"
                      }
                    >
                      {d.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleToggle(d.id, d.is_active)}
                      className={
                        d.is_active ? "btn-ghost text-red-500" : "btn-ghost text-accent"
                      }
                    >
                      {d.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {doctors.length === 0 && (
            <div className="p-8 text-center text-sm text-muted">
              No doctors registered yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
