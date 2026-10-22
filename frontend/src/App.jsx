
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { supabase } from "./services/supabase";
import "./index.css";

import Dashboard from "./pages/Dashboard";
import MarkAttendance from "./pages/MarkAttendance";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterFace from "./pages/RegisterFace";
import Login from "./pages/Login";

function ProtectedLayout() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Unable to load session:", error.message);
      }

      setSession(data?.session ?? null);
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return <p className="auth-loading">Checking your session...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
    }
  }

  const getNavClass = ({ isActive }) =>
    `nav-item${isActive ? " active" : ""}`;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <h2>AttendVision</h2>
          <span>Attendance System</span>
        </div>

        <nav aria-label="Main navigation">
          <NavLink to="/" end className={getNavClass}>
            Dashboard
          </NavLink>

          <NavLink to="/attendance" end className={getNavClass}>
            Attendance
          </NavLink>

          <NavLink
            to="/attendance/history"
            className={getNavClass}
          >
            Attendance History
          </NavLink>

          <NavLink to="/students" className={getNavClass}>
            Students
          </NavLink>

          <NavLink to="/register" className={getNavClass}>
            Register Student
          </NavLink>
        </nav>

        <button
          type="button"
          className="nav-item logout-button"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<MarkAttendance />} />
          <Route path="/attendance/history" element={<Attendance />} />
          <Route path="/students" element={<Students />} />
          <Route path="/register" element={<RegisterStudent />} />
          <Route
            path="/students/:studentId/face"
            element={<RegisterFace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;