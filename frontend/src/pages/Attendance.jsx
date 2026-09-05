import { useEffect, useState } from "react";

import { getAttendance } from "../services/api";
function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAttendance();

      setAttendance(data.attendance || []);
    } catch (err) {
      console.error(err);

      setError("Unable to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchAttendance = async () => {
      try {
        const data = await getAttendance();

        if (cancelled) {
          return;
        }

        setAttendance(data.attendance || []);
        setError("");
      } catch (err) {
        console.error(err);

        if (cancelled) {
          return;
        }

        setError("Unable to load attendance records.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAttendance();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) {
      return "-";
    }

    return new Date(dateTimeString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h1>Attendance</h1>

          <p>View student attendance records.</p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadAttendance}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading attendance records...</div>
      ) : attendance.length === 0 ? (
        <div className="empty-message">No attendance records found.</div>
      ) : (
        <div className="attendance-table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Check-in</th>
                <th>Student Code</th>
                <th>Student Name</th>
                <th>Course</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((record, index) => (
                <tr key={record.id}>
                  <td>{index + 1}</td>

                  <td>{formatDate(record.attendance_date)}</td>

                  <td>{formatTime(record.check_in_time)}</td>

                  <td>
                    <strong>{record.student_code}</strong>
                  </td>

                  <td>{record.full_name}</td>

                  <td>{record.course || "-"}</td>

                  <td>{record.department || "-"}</td>

                  <td>
                    <span className="status-badge">{record.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Attendance;
