import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { useEffect, useState } from "react";

import "./index.css";

import { getDashboardStats } from "./services/api";

import MarkAttendance from "./pages/MarkAttendance";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterFace from "./pages/RegisterFace";

function Dashboard() {
  const [stats, setStats] = useState({
    total_students: 0,
    registered_faces: 0,
    today_attendance: 0,
    attendance_percentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();

        if (cancelled) {
          return;
        }

        setStats(data);
        setError("");
      } catch (err) {
        console.error(err);

        if (cancelled) {
          return;
        }

        setError("Unable to load dashboard statistics.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>Overview of your face attendance system.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>

          <div>
            <p>Total Students</p>

            <h2>{loading ? "..." : stats.total_students}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🙂</div>

          <div>
            <p>Registered Faces</p>

            <h2>{loading ? "..." : stats.registered_faces}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>

          <div>
            <p>Today's Attendance</p>

            <h2>{loading ? "..." : stats.today_attendance}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>

          <div>
            <p>Attendance Percentage</p>

            <h2>{loading ? "..." : `${stats.attendance_percentage}%`}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/attendance" className="dashboard-button">
          📷 Mark Attendance
        </Link>

        <Link to="/attendance/history" className="dashboard-button secondary">
          📋 Attendance History
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <div className="logo">
            <h2>AttendVision</h2>
            <span>Attendance System</span>
          </div>

          <nav>
            <Link to="/" className="nav-item">
              Dashboard
            </Link>

            <Link to="/attendance" className="nav-item">
              Attendance
            </Link>

            <Link to="/attendance/history" className="nav-item">
              Attendance History
            </Link>

            <Link to="/students" className="nav-item">
              Students
            </Link>

            <Link to="/register" className="nav-item">
              Register Student
            </Link>

            <Link to="/settings" className="nav-item">
              Settings
            </Link>
          </nav>
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

            <Route path="/settings" element={<h1>Settings</h1>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
