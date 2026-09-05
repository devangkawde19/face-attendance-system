import { useEffect, useState } from "react";

import { getDashboardStats } from "../services/api";

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
        <a href="/attendance" className="dashboard-button">
          📷 Mark Attendance
        </a>

        <a href="/attendance/history" className="dashboard-button secondary">
          📋 Attendance History
        </a>
      </div>
    </div>
  );
}

export default Dashboard;
