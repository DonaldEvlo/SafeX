import React from 'react'
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Profile from "./pages/Profile";
import Verify2FA from './pages/Verify2FA'
import AdminLogs from './pages/AdminLogs';
import CheckContacts from './pages/CheckContacts'
// import Navbar from "./components/Shared/Navbar";
// import { useAuth } from "./utils/auth";

// // Protected Route for Admin
// function AdminRoute({ children }) {
//   const { user } = useAuth();

//   if (!user) return <Navigate to="/" />;
//   if (!user.isAdmin) return <Navigate to="/chat" />;

//   return children;
// }

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#111418]">
        {/* <Navbar /> */}
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/chat" element={<Chat />}/>
          <Route path="/login" element={<LoginForm />}/>
          <Route path="/register" element={<RegisterForm/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/verify-2fa" element={<Verify2FA />} />
          <Route path="/admin-log" element={<AdminLogs />} />
          <Route path="/contacts" element={<CheckContacts />} />  
           <Route path="/chat/:id" element={<Chat />} />

          {/* <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <AdminLogs />
              </AdminRoute>
            }
          /> */}
        </Routes>
      </div>
    </Router>
  );
}

