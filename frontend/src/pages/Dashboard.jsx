
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats, getTodayAttendance } from "../services/api";
import "./Dashboard.css";

function formatCheckInTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [statsData, attendanceData] = await Promise.all([
          getDashboardStats(),
          getTodayAttendance(),
        ]);

        if (cancelled) return;

        setStats(statsData);
        setTodayAttendance(
          Array.isArray(attendanceData)
            ? attendanceData
            : attendanceData?.attendance ?? attendanceData?.records ?? [],
        );
      } catch (err) {
        console.error("Failed to load dashboard:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Unable to load dashboard data. Please check your backend connection and try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = [
    {
      label: "Total students",
      value: stats?.total_students ?? 0,
      description: "Students in your system",
      icon: "♟",
      color: "blue",
    },
    {
      label: "Registered faces",
      value: stats?.registered_faces ?? 0,
      description: "Ready for face recognition",
      icon: "◎",
      color: "purple",
    },
    {
      label: "Today's attendance",
      value: stats?.today_attendance ?? 0,
      description: "Attendance records today",
      icon: "✓",
      color: "green",
    },
    {
      label: "Attendance rate",
      value: `${Number(stats?.attendance_percentage ?? 0).toFixed(0)}%`,
      description: "Reported for today",
      icon: "%",
      color: "orange",
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-heading">
          <div className="dashboard-eyebrow">
            <span className="dashboard-live-dot" />
            ATTENDVISION OVERVIEW
          </div>

          <h1>Dashboard</h1>
          <p>Monitor student records and today's attendance at a glance.</p>
        </div>

        <div className="dashboard-date">
          <span aria-hidden="true">▦</span>
          {formatDate()}
        </div>
      </header>

      {error && (
        <div className="dashboard-error" role="alert">
          <span className="dashboard-error-icon">!</span>
          <div>
            <strong>Unable to load dashboard</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <section className="dashboard-loading" role="status">
          <span className="dashboard-spinner" />
          <strong>Loading your dashboard</strong>
          <p>Fetching student and attendance records…</p>

          <div className="dashboard-skeleton-grid" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>
      ) : (
        <>
          <section className="dashboard-stats" aria-label="Attendance statistics">
            {summaryCards.map((card) => (
              <article className="dashboard-stat-card" key={card.label}>
                <div className="dashboard-stat-top">
                  <span className="dashboard-stat-label">{card.label}</span>
                  <span
                    className={`dashboard-stat-icon ${card.color}`}
                    aria-hidden="true"
                  >
                    {card.icon}
                  </span>
                </div>

                <strong className="dashboard-stat-value">{card.value}</strong>
                <p>{card.description}</p>
              </article>
            ))}
          </section>

          <section className="dashboard-quick-section">
            <div className="dashboard-section-heading">
              <h2>Quick actions</h2>
              <p>Jump straight into a common task.</p>
            </div>

            <div className="dashboard-quick-grid">
              <Link to="/attendance" className="dashboard-action-card primary">
                <span className="dashboard-action-icon" aria-hidden="true">
                  ◎
                </span>
                <span className="dashboard-action-copy">
                  <strong>Mark attendance</strong>
                  <small>Open face attendance</small>
                </span>
                <span className="dashboard-action-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>

              <Link
                to="/attendance/history"
                className="dashboard-action-card"
              >
                <span className="dashboard-action-icon" aria-hidden="true">
                  ▤
                </span>
                <span className="dashboard-action-copy">
                  <strong>Attendance history</strong>
                  <small>Review previous records</small>
                </span>
                <span className="dashboard-action-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>

              <Link to="/register" className="dashboard-action-card">
                <span className="dashboard-action-icon" aria-hidden="true">
                  +
                </span>
                <span className="dashboard-action-copy">
                  <strong>Register student</strong>
                  <small>Add a student profile</small>
                </span>
                <span className="dashboard-action-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </div>
          </section>

          <section className="dashboard-attendance-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Today's attendance</h2>
                <p>Students who have marked attendance today.</p>
              </div>

              <Link
                to="/attendance/history"
                className="dashboard-history-link"
              >
                View history <span aria-hidden="true">→</span>
              </Link>
            </div>

            {todayAttendance.length === 0 ? (
              <div className="dashboard-empty">
                <span className="dashboard-empty-icon" aria-hidden="true">
                  ▤
                </span>
                <strong>No attendance records yet</strong>
                <p>Today's attendance records will appear here.</p>
                <Link to="/attendance" className="dashboard-empty-link">
                  Mark attendance →
                </Link>
              </div>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th scope="col">Student code</th>
                      <th scope="col">Student name</th>
                      <th scope="col">Course</th>
                      <th scope="col">Check-in time</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {todayAttendance.map((record, index) => (
                      <tr
                        key={
                          record.attendance_id ??
                          `${record.student_code ?? "student"}-${index}`
                        }
                      >
                        <td>
                          <span className="dashboard-student-code">
                            {record.student_code || "—"}
                          </span>
                        </td>
                        <td>
                          <strong className="dashboard-student-name">
                            {record.full_name || "Unknown student"}
                          </strong>
                        </td>
                        <td>{record.course || "—"}</td>
                        <td>{formatCheckInTime(record.check_in_time)}</td>
                        <td>
                          <span
                            className={`dashboard-status ${
                              String(record.status || "")
                                .toLowerCase()
                                .trim() === "present"
                                ? "present"
                                : "other"
                            }`}
                          >
                            <span className="dashboard-status-dot" />
                            {record.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;