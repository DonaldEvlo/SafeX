import React from 'react';
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Profile from "./pages/Profile";
import Verify2FA from './pages/Verify2FA';
import AdminLogs from './pages/AdminLogs';
import CheckContacts from './pages/CheckContacts';
import Unauthorized from './pages/Unauthorized';
import AdminRoute from './components/ProtectedRoutes/AdminRoute';
import useAutoLogout from './hooks/useAutoLogout';
import { getAuth, signOut } from "firebase/auth";
import { app } from './services/firebase';
import { AuthProvider } from './utils/AuthContext'; // ✅ ajoute ceci
import './App.css';

export default function App() {
  const auth = getAuth(app);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  const { showWarning, stayLoggedIn } = useAutoLogout(15 * 60 * 1000, handleLogout); // 15 min

  return (
    <AuthProvider> {/* ✅ Enveloppe toute l'application */}
      <Router>
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#111418]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify-2fa" element={<Verify2FA />} />
            <Route path="/contacts" element={<CheckContacts />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/admin-log"
              element={
                <AdminRoute>
                  <AdminLogs />
                </AdminRoute>
              }
            />
          </Routes>

          {/* ✅ Modale d'avertissement */}
          {showWarning && (
            <div
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                color: 'white',
                flexDirection: 'column',
                padding: 20,
              }}
            >
              <div style={{
                backgroundColor: '#22272e',
                padding: 30,
                borderRadius: 12,
                maxWidth: 400,
                textAlign: 'center'
              }}>
                <h2 style={{ marginBottom: 10 }}>Session inactive</h2>
                <p>Vous serez déconnecté dans 2 minutes par mesure de sécurité.</p>
                <button
                  onClick={stayLoggedIn}
                  style={{
                    marginTop: 20,
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Rester connecté
                </button>
              </div>
            </div>
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}
