import { useState, useEffect, useRef } from "react";
import { getLetterhead, upsertLetterhead, uploadLogo, deleteLogo } from "../api/endpoints";

const FIELDS = [
  { key: "clinic_name", label: "Clinic Name", type: "text" },
  { key: "doctor_qualifications", label: "Qualifications", type: "text", placeholder: "MBBS, MD..." },
  { key: "address", label: "Address", type: "textarea", rows: 2 },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "website", label: "Website", type: "url" },
  { key: "registration_numbers", label: "Registration Numbers", type: "text" },
  { key: "opd_hours", label: "OPD Hours", type: "text", placeholder: "Mon-Sat: 10:00 AM - 2:00 PM" },
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
        if (data.logo_path) {
          setLogoPreview(`/api/letterhead/logo?path=${encodeURIComponent(data.logo_path)}`);
        }
      } catch {
        // No letterhead yet, start with empty form
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
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to remove logo");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (logoFile) {
        await uploadLogo(logoFile);
      }
      await upsertLetterhead(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || "Save failed");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading letterhead...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Letterhead Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Saved successfully
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinic Logo
          </label>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-sm">No logo</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm"
              >
                Upload Logo
              </label>
              {logoPreview && (
                <button
                  onClick={handleRemoveLogo}
                  className="block text-sm text-red-500 hover:text-red-700"
                >
                  Remove logo
                </button>
              )}
              <p className="text-xs text-gray-400">PNG, JPG, max 5MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={form[f.key] || ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder || ""}
                  rows={f.rows || 2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              ) : (
                <input
                  type={f.type}
                  value={form[f.key] || ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder || ""}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Letterhead"}
          </button>
        </div>
      </div>
    </div>
  );
}
