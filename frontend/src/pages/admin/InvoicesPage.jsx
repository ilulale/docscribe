import { useState, useEffect } from "react";
import {
  listInvoices,
  createInvoice,
  updateInvoiceStatus,
  listDoctors,
} from "../../api/endpoints";

const STATUS_CONFIG = {
  pending: { badge: "badge-warning", label: "Pending" },
  paid: { badge: "badge-success", label: "Paid" },
  cancelled: { badge: "badge-danger", label: "Cancelled" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ doctorId: "", amount: "" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [invData, docData] = await Promise.all([
        listInvoices(),
        listDoctors(),
      ]);
      setInvoices(invData);
      setDoctors(docData);
    } catch {
      setError("Failed to load data");
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createInvoice({
        doctorId: parseInt(form.doctorId),
        amount: parseFloat(form.amount),
      });
      setForm({ doctorId: "", amount: "" });
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create invoice");
    }
    setCreating(false);
  }

  async function handleStatusChange(invoiceId, status) {
    try {
      await updateInvoiceStatus(invoiceId, status);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update");
    }
  }

  const doctorName = (id) =>
    doctors.find((d) => d.id === id)?.name || `#${id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage billing and payments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary"
        >
          {showCreate ? "Cancel" : "Create Invoice"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs animate-slide-up">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="card p-5 animate-slide-up">
          <p className="section-title mb-4">New Invoice</p>
          <form onSubmit={handleCreate} className="space-y-3 max-w-md">
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount (INR)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
              required
              min="0"
              step="0.01"
            />
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create"
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
                  ID
                </th>
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Doctor
                </th>
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Amount
                </th>
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Created
                </th>
                <th className="text-right px-5 py-3 text-2xs font-medium uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => {
                const config =
                  STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-canvas transition-colors duration-100"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs">{inv.id}</td>
                    <td className="px-5 py-3.5 text-sm">
                      {doctorName(inv.doctor_id)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium tabular-nums">
                      {inv.currency} {inv.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={config.badge}>{config.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted">
                      {new Date(inv.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() =>
                              handleStatusChange(inv.id, "paid")
                            }
                            className="btn-ghost text-accent text-xs"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(inv.id, "cancelled")
                            }
                            className="btn-ghost text-red-500 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="p-8 text-center text-sm text-muted">
              No invoices yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
