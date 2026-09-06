import { useEffect, useState } from "react";
import { getDashboardStats, getTodayAttendance } from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    total_students: 0,
    registered_faces: 0,
    today_attendance: 0,
    attendance_percentage: 0,
  });

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      try {
        const [statsData, attendanceData] = await Promise.all([
          getDashboardStats(),
          getTodayAttendance(),
        ]);

        if (cancelled) {
          return;
        }

        setStats(statsData);
        setTodayAttendance(attendanceData.attendance || []);

        setError("");
        setAttendanceError("");
      } catch (err) {
        console.error(err);

        if (cancelled) {
          return;
        }

        setError("Unable to load dashboard statistics.");
        setAttendanceError("Unable to load today's attendance.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAttendanceLoading(false);
        }
      }
    };

    fetchDashboardData();

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

      <div className="dashboard-attendance">
        <div className="section-header">
          <div>
            <h2>Today's Attendance</h2>

            <p>Students who have marked attendance today.</p>
          </div>
        </div>

        {attendanceError && (
          <div className="error-message">{attendanceError}</div>
        )}

        {attendanceLoading ? (
          <div className="attendance-loading">
            Loading today's attendance...
          </div>
        ) : todayAttendance.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>

            <h3>No attendance recorded today</h3>

            <p>
              Attendance records will appear here after students mark their
              attendance.
            </p>
          </div>
        ) : (
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student Code</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Check-in Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {todayAttendance.map((record) => (
                  <tr key={record.attendance_id}>
                    <td>{record.student_code}</td>

                    <td>{record.full_name}</td>

                    <td>{record.course || "—"}</td>

                    <td>
                      {new Date(record.check_in_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td>
                      <span className={`attendance-status ${record.status}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
