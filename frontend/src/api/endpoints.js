import client from "./client";

export async function getPatients({ search, page = 1, pageSize = 20 } = {}) {
  const params = { page, page_size: pageSize };
  if (search) params.search = search;
  const { data } = await client.get("/patients", { params });
  return data;
}

export async function getPatient(id) {
  const { data } = await client.get(`/patients/${id}`);
  return data;
}

export async function createPatient(name) {
  const { data } = await client.post("/patients", { name });
  return data;
}

export async function searchPatients(name) {
  const { data } = await client.post("/patients/search", { name });
  return data;
}

export async function getPatientSessions(patientId) {
  const { data } = await client.get(`/patients/${patientId}/sessions`);
  return data;
}

export async function createSession(patientId) {
  const { data } = await client.post("/sessions", { patient_id: patientId });
  return data;
}

export async function uploadAudio(sessionId, audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  const { data } = await client.post(`/sessions/${sessionId}/audio`, formData, {
    headers: { "Content-Type": undefined },
  });
  return data;
}

export async function getSessionStatus(sessionId) {
  const { data } = await client.get(`/sessions/${sessionId}/status`);
  return data;
}

export async function getSession(sessionId) {
  const { data } = await client.get(`/sessions/${sessionId}`);
  return data;
}

export function getSessionAudioUrl(sessionId) {
  const token = localStorage.getItem("token");
  return `/api/sessions/${sessionId}/audio?token=${token}`;
}

export async function listSessions({ status, page = 1, pageSize = 20 } = {}) {
  const params = { page, page_size: pageSize };
  if (status) params.status = status;
  const { data } = await client.get("/sessions", { params });
  return data;
}

export async function retrySession(sessionId) {
  const { data } = await client.post(`/sessions/${sessionId}/retry`);
  return data;
}

export async function getNote(sessionId) {
  const { data } = await client.get(`/sessions/${sessionId}/note`);
  return data;
}

export async function updateNote(sessionId, { transcript, soap_json }) {
  const body = {};
  if (transcript !== undefined) body.transcript = transcript;
  if (soap_json !== undefined) body.soap_json = soap_json;
  const { data } = await client.put(`/sessions/${sessionId}/note`, body);
  return data;
}

export async function signNote(sessionId) {
  const { data } = await client.post(`/sessions/${sessionId}/sign`);
  return data;
}

export async function regenerateNote(sessionId) {
  const { data } = await client.post(`/sessions/${sessionId}/regenerate`);
  return data;
}

export async function getNotePdfUrl(sessionId) {
  const token = localStorage.getItem("token");
  return `/api/sessions/${sessionId}/note/pdf?token=${token}`;
}

export async function getLetterhead() {
  const { data } = await client.get("/letterhead");
  return data;
}

export async function upsertLetterhead(fields) {
  const { data } = await client.post("/letterhead", fields);
  return data;
}

export async function uploadLogo(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await client.post("/letterhead/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteLogo() {
  const { data } = await client.delete("/letterhead/logo");
  return data;
}

export async function listDoctors() {
  const { data } = await client.get("/admin/doctors");
  return data;
}

export async function createDoctor({ name, email, password }) {
  const { data } = await client.post("/admin/doctors", { name, email, password });
  return data;
}

export async function toggleDoctorActive(doctorId, isActive) {
  const { data } = await client.patch(`/admin/doctors/${doctorId}/active`, {
    is_active: isActive,
  });
  return data;
}

export async function listInvoices() {
  const { data } = await client.get("/admin/invoices");
  return data;
}

export async function createInvoice({ doctorId, amount, currency = "INR" }) {
  const { data } = await client.post("/admin/invoices", {
    doctor_id: doctorId,
    amount,
    currency,
  });
  return data;
}

export async function updateInvoiceStatus(invoiceId, status) {
  const { data } = await client.patch(`/admin/invoices/${invoiceId}`, { status });
  return data;
}

export async function getStats() {
  const { data } = await client.get("/admin/stats");
  return data;
}

export async function getCredits() {
  const { data } = await client.get("/admin/credits");
  return data;
}
