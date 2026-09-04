import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStudents } from "../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
      try {
        const data = await getStudents();

        if (cancelled) {
          return;
        }

        setStudents(data.students || []);
        setError("");
        setLoading(false);
      } catch (err) {
        console.error("Failed to load students:", err);

        if (cancelled) {
          return;
        }

        setError("Unable to load students. Please check the backend.");

        setLoading(false);
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, []);

  const getFaceStatusLabel = (status) => {
    if (status === "registered") {
      return "Registered";
    }

    if (status === "incomplete") {
      return "Incomplete";
    }

    return "Pending";
  };

  const getFaceStatusClass = (status) => {
    if (status === "registered") {
      return "face-status registered";
    }

    if (status === "incomplete") {
      return "face-status incomplete";
    }

    return "face-status pending";
  };

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <h1>Students</h1>

          <p>Manage registered students and their face recognition status.</p>
        </div>

        <Link to="/register" className="register-button">
          + Register Student
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="empty-message">No students registered yet.</div>
      ) : (
        <div className="students-table-card">
          <div className="students-table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Face Samples</th>
                  <th>Face Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>

                    <td>
                      <strong>{student.student_code}</strong>
                    </td>

                    <td>{student.full_name}</td>

                    <td>{student.email || "—"}</td>

                    <td>{student.course || "—"}</td>

                    <td>{student.year || "—"}</td>

                    <td>{student.semester || "—"}</td>

                    <td>{student.status}</td>

                    <td>{student.face_samples}</td>

                    <td>
                      <span className={getFaceStatusClass(student.face_status)}>
                        {getFaceStatusLabel(student.face_status)}
                      </span>
                    </td>

                    <td>
                      {student.face_status !== "registered" && (
                        <Link
                          to={`/students/${student.id}/face`}
                          className="face-register-button"
                        >
                          {student.face_status === "incomplete"
                            ? "Retry Face"
                            : "Register Face"}
                        </Link>
                      )}

                      {student.face_status === "registered" && (
                        <span className="face-complete">✓ Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
