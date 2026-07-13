import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import NewSession from "./pages/NewSession";
import SessionDetail from "./pages/SessionDetail";
import NoteEditor from "./pages/NoteEditor";
import PatientHistory from "./pages/PatientHistory";
import LetterheadSettings from "./pages/LetterheadSettings";
import ReportTemplatePage from "./pages/ReportTemplatePage";
import DoctorsPage from "./pages/admin/DoctorsPage";
import InvoicesPage from "./pages/admin/InvoicesPage";
import CreditsPage from "./pages/admin/CreditsPage";
import StatsPage from "./pages/admin/StatsPage";

function RootLayout() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "sessions/new", element: <NewSession /> },
      { path: "sessions/:id", element: <SessionDetail /> },
      { path: "sessions/:id/note", element: <NoteEditor /> },
      { path: "patients/:id/history", element: <PatientHistory /> },
      { path: "settings/letterhead", element: <LetterheadSettings /> },
      { path: "settings/report-template", element: <ReportTemplatePage /> },
      { path: "admin/doctors", element: <DoctorsPage /> },
      { path: "admin/invoices", element: <InvoicesPage /> },
      { path: "admin/credits", element: <CreditsPage /> },
      { path: "admin/stats", element: <StatsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
