import { useState, useEffect, Fragment } from "react";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import {
  listDoctors,
  createDoctor,
  toggleDoctorActive,
  updateDoctorModel,
  listModels,
} from "../../api/endpoints";

const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", openrouter_model: DEFAULT_MODEL });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadDoctors();
    loadModels();
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

  async function loadModels() {
    try {
      const data = await listModels();
      setModels(data);
    } catch {
      // silently fail — model list is non-critical
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createDoctor(form);
      setForm({ name: "", email: "", password: "", openrouter_model: DEFAULT_MODEL });
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

  async function handleModelChange(doctorId, newModel) {
    setUpdatingId(doctorId);
    try {
      await updateDoctorModel(doctorId, newModel);
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update model");
    }
    setUpdatingId(null);
  }

  const modelSlugs = models.map((m) => m.slug);
  const modelQuery = (model, query) =>
    model.slug.toLowerCase().includes(query.toLowerCase()) ||
    model.name.toLowerCase().includes(query.toLowerCase());

  function modelDisplayName(slug) {
    const found = models.find((m) => m.slug === slug);
    return found ? found.name : slug;
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
            <Combobox
              value={form.openrouter_model}
              onChange={(val) => setForm({ ...form, openrouter_model: val })}
            >
              <div className="relative">
                <ComboboxInput
                  className="input w-full"
                  placeholder="AI Model"
                  displayValue={(slug) => modelDisplayName(slug)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, openrouter_model: val });
                  }}
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-muted" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </ComboboxButton>
                {models.length > 0 && (
                  <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white border border-border shadow-lg text-sm">
                    {models
                      .filter((m) => modelQuery(m, form.openrouter_model))
                      .map((m) => (
                        <ComboboxOption
                          key={m.slug}
                          value={m.slug}
                          className={({ active }) =>
                            `cursor-pointer px-3 py-2 ${active ? "bg-accent/10 text-accent" : "text-surface-0"}`
                          }
                        >
                          <span className="font-medium">{m.slug}</span>
                          <span className="ml-2 text-xs text-muted">{m.name}</span>
                        </ComboboxOption>
                      ))}
                  </ComboboxOptions>
                )}
              </div>
            </Combobox>
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
                  AI Model
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
              {doctors.map((d) => {
                const isLegacy = models.length > 0 && !modelSlugs.includes(d.openrouter_model);
                return (
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
                      <div className="relative">
                        {updatingId === d.id ? (
                          <span className="text-xs text-muted">Saving...</span>
                        ) : (
                          <Combobox
                            value={d.openrouter_model}
                            onChange={(val) => handleModelChange(d.id, val)}
                          >
                            <div className="relative min-w-[200px]">
                              <ComboboxInput
                                className="text-sm border border-transparent hover:border-border rounded px-2 py-1 w-full focus:border-accent focus:outline-none transition-colors"
                                displayValue={(slug) => modelDisplayName(slug)}
                                onChange={() => {}}
                              />
                              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                </svg>
                              </ComboboxButton>
                              {models.length > 0 && (
                                <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white border border-border shadow-lg text-sm">
                                  {models.map((m) => (
                                    <ComboboxOption
                                      key={m.slug}
                                      value={m.slug}
                                      className={({ active }) =>
                                        `cursor-pointer px-3 py-2 ${active ? "bg-accent/10 text-accent" : "text-surface-0"}`
                                      }
                                    >
                                      <span className="font-medium">{m.slug}</span>
                                      <span className="ml-2 text-xs text-muted">{m.name}</span>
                                    </ComboboxOption>
                                  ))}
                                </ComboboxOptions>
                              )}
                            </div>
                          </Combobox>
                        )}
                        {isLegacy && (
                          <span
                            className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                            title="Model no longer available on OpenRouter"
                          />
                        )}
                      </div>
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
                );
              })}
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
