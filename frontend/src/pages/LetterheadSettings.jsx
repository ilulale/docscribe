import { useState, useEffect, useRef } from "react";
import {
  getLetterhead,
  upsertLetterhead,
  uploadLogo,
  deleteLogo,
} from "../api/endpoints";

const FIELDS = [
  { key: "clinic_name", label: "Clinic Name", type: "text" },
  {
    key: "doctor_qualifications",
    label: "Qualifications",
    type: "text",
    placeholder: "MBBS, MD...",
  },
  { key: "address", label: "Address", type: "textarea", rows: 2 },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "website", label: "Website", type: "url" },
  { key: "registration_numbers", label: "Registration Numbers", type: "text" },
  {
    key: "opd_hours",
    label: "OPD Hours",
    type: "text",
    placeholder: "Mon-Sat: 10:00 AM - 2:00 PM",
  },
];

export default function LetterheadSettings() {
  const [form, setForm] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLetterhead();
        setForm({
          clinic_name: data.clinic_name || "",
          doctor_qualifications: data.doctor_qualifications || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          registration_numbers: data.registration_numbers || "",
          opd_hours: data.opd_hours || "",
        });
        if (data.logo_path)
          setLogoPreview(
            `/api/letterhead/logo?path=${encodeURIComponent(data.logo_path)}`
          );
      } catch {
        /* empty form */
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleFieldChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setSaved(false);
  }

  async function handleRemoveLogo() {
    try {
      await deleteLogo();
      setLogoPreview(null);
      setLogoFile(null);
      setSaved(false);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to remove logo");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await upsertLetterhead(form);
      if (logoFile) {
        await uploadLogo(logoFile);
        setLogoFile(null);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to save");
    }
    setSaving(false);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Letterhead</h1>
        <p className="text-sm text-muted mt-0.5">
          Configure your clinic details for PDF exports
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs animate-slide-up">
          {error}
        </div>
      )}

      {saved && (
        <div className="px-4 py-3 rounded-xl bg-accent-muted border border-accent-light text-accent text-xs animate-slide-up">
          Settings saved
        </div>
      )}

      <div className="card p-5 animate-slide-up">
        <p className="section-title mb-4">Logo</p>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A1A1AA"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-xs"
              >
                Upload
              </button>
              {logoPreview && (
                <button
                  onClick={handleRemoveLogo}
                  className="btn-danger text-xs"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-2xs text-muted">PNG, JPG up to 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="card p-5 animate-slide-up stagger-2">
        <p className="section-title mb-4">Details</p>
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-surface-0/60 mb-1.5">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  rows={field.rows || 3}
                  className="input resize-y"
                />
              ) : (
                <input
                  type={field.type}
                  value={form[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="input"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
