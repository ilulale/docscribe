import { useState, useEffect } from "react";
import { getReportTemplate, upsertReportTemplate } from "../api/endpoints";

const DEFAULT_SECTIONS = [
  {
    key: "subjective",
    label: "Subjective",
    prompt_instructions:
      "Chief Complaint (CC), History of Present Illness (HPI), Past Medical History (PMH), Medications, Allergies, Family/Social History (if mentioned), Review of Systems (only systems discussed)",
    order: 1,
    visible: true,
  },
  {
    key: "objective",
    label: "Objective",
    prompt_instructions:
      "Vital Signs (if mentioned), Physical Examination Findings (if mentioned), Investigations/Labs/Imaging discussed or ordered",
    order: 2,
    visible: true,
  },
  {
    key: "assessment",
    label: "Assessment",
    prompt_instructions:
      "Clinical impression / working diagnosis (only if stated or clearly implied), Differential diagnoses (only if explicitly discussed)",
    order: 3,
    visible: true,
  },
  {
    key: "plan",
    label: "Plan",
    prompt_instructions:
      "Medications prescribed (name, dose, frequency, duration), Investigations ordered, Referrals, Follow-up instructions, Patient education/counseling given",
    order: 4,
    visible: true,
  },
  {
    key: "additional_notes",
    label: "Additional Notes",
    prompt_instructions:
      "Anything clinically relevant that doesn't fit above categories, e.g. patient concerns, non-compliance mentioned",
    order: 5,
    visible: true,
  },
];

export default function ReportTemplatePage() {
  const [sections, setSections] = useState([]);
  const [pdfFooter, setPdfFooter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getReportTemplate();
        setSections(data.sections?.length ? data.sections : DEFAULT_SECTIONS);
        setPdfFooter(data.pdf_footer || "");
      } catch {
        setSections(DEFAULT_SECTIONS);
      }
      setLoading(false);
    }
    load();
  }, []);

  function updateSection(index, field, value) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
    setSaved(false);
  }

  function addSection() {
    const newKey = `section_${Date.now()}`;
    setSections((prev) => [
      ...prev,
      {
        key: newKey,
        label: "New Section",
        prompt_instructions: "",
        order: prev.length + 1,
        visible: true,
      },
    ]);
    setSaved(false);
  }

  function removeSection(index) {
    setSections((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function moveSection(index, direction) {
    setSections((prev) => {
      const arr = [...prev];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await upsertReportTemplate({ sections, pdf_footer: pdfFooter || null });
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
        <h1 className="text-2xl font-bold tracking-tight">Report Template</h1>
        <p className="text-sm text-muted mt-0.5">
          Customise the sections that appear in your generated clinical notes
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs animate-slide-up">
          {error}
        </div>
      )}

      {saved && (
        <div className="px-4 py-3 rounded-xl bg-accent-muted border border-accent-light text-accent text-xs animate-slide-up">
          Template saved
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div
            key={section.key}
            className="card p-4 animate-slide-up"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveSection(idx, -1)}
                  disabled={idx === 0}
                  className="text-muted hover:text-surface-0 disabled:opacity-20 text-xs leading-none"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveSection(idx, 1)}
                  disabled={idx === sections.length - 1}
                  className="text-muted hover:text-surface-0 disabled:opacity-20 text-xs leading-none"
                  title="Move down"
                >
                  ▼
                </button>
              </div>

              <input
                type="text"
                value={section.label}
                onChange={(e) => updateSection(idx, "label", e.target.value)}
                className="input flex-1 text-sm font-semibold"
                placeholder="Section label"
              />

              <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(e) =>
                    updateSection(idx, "visible", e.target.checked)
                  }
                  className="accent-accent"
                />
                Visible
              </label>

              <button
                onClick={() => removeSection(idx)}
                className="text-muted hover:text-red-500 text-xs ml-1 shrink-0"
                title="Remove section"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">
                AI Prompt Instructions
              </label>
              <textarea
                value={section.prompt_instructions}
                onChange={(e) =>
                  updateSection(idx, "prompt_instructions", e.target.value)
                }
                rows={4}
                className="input resize-y text-xs min-h-[80px]"
                placeholder="What the AI should extract for this section..."
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addSection}
        className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-xs text-muted hover:text-surface-0 hover:border-surface-0/20 transition-colors"
      >
        + Add Section
      </button>

      <div className="card p-4 animate-slide-up">
        <label className="block text-xs font-medium text-surface-0/60 mb-1.5">
          PDF Footer (optional)
        </label>
        <textarea
          value={pdfFooter}
          onChange={(e) => {
            setPdfFooter(e.target.value);
            setSaved(false);
          }}
          rows={2}
          className="input resize-y text-xs"
          placeholder="Custom footer text for exported PDFs (defaults to 'Generated by Docscribe')"
        />
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Template"
          )}
        </button>
      </div>
    </div>
  );
}
