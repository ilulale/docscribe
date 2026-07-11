import { useState, useEffect } from "react";
import {
  listInvoices,
  createInvoice,
  updateInvoiceStatus,
  listDoctors,
} from "../../api/endpoints";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
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
      const [invData, docData] = await Promise.all([listInvoices(), listDoctors()]);
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

  const doctorName = (id) => doctors.find((d) => d.id === id)?.name || `#${id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showCreate ? "Cancel" : "Create Invoice"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">New Invoice</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Doctor</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Created</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{inv.id}</td>
                  <td className="px-4 py-3">{doctorName(inv.doctor_id)}</td>
                  <td className="px-4 py-3">
                    {inv.currency} {inv.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_STYLES[inv.status] || ""
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(inv.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleStatusChange(inv.id, "paid")}
                          className="text-sm text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleStatusChange(inv.id, "cancelled")}
                          className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="p-6 text-gray-500 text-center">No invoices yet</div>
          )}
        </div>
      )}
    </div>
  );
}
