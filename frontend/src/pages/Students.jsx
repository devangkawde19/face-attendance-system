import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getStudents, updateStudentStatus } from "../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStudentId, setUpdatingStudentId] = useState(null);

  const loadStudents = async () => {
    try {
      const data = await getStudents();

      setStudents(data.students || []);
      setError("");
    } catch (err) {
      console.error("Failed to load students:", err);

      setError("Unable to load students. Please check the backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialStudents = async () => {
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

    loadInitialStudents();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusChange = async (student) => {
    const newStatus = student.status === "active" ? "inactive" : "active";

    const action = newStatus === "inactive" ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${student.full_name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingStudentId(student.id);
      setError("");

      await updateStudentStatus(student.id, newStatus);

      await loadStudents();
    } catch (err) {
      console.error("Failed to update student status:", err);

      const message =
        err.response?.data?.detail || "Unable to update student status.";

      setError(message);
    } finally {
      setUpdatingStudentId(null);
    }
  };

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

  const totalStudents = students.length;

  const registeredFaces = students.filter(
    (student) => student.face_status === "registered",
  ).length;

  const pendingFaces = students.filter(
    (student) =>
      student.face_status === "pending" || student.face_status === "incomplete",
  ).length;

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      student.full_name?.toLowerCase().includes(search) ||
      student.student_code?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search)
    );
  });

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
      ) : (
        <>
          <div className="student-summary">
            <div className="student-summary-card">
              <div className="student-summary-icon">👥</div>

              <div>
                <p>Total Students</p>
                <h2>{totalStudents}</h2>
              </div>
            </div>

            <div className="student-summary-card">
              <div className="student-summary-icon">🙂</div>

              <div>
                <p>Face Registered</p>
                <h2>{registeredFaces}</h2>
              </div>
            </div>

            <div className="student-summary-card">
              <div className="student-summary-icon">⏳</div>

              <div>
                <p>Face Pending</p>
                <h2>{pendingFaces}</h2>
              </div>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="empty-message">No students registered yet.</div>
          ) : (
            <>
              <div className="students-toolbar">
                <input
                  type="search"
                  placeholder="Search by name, student code or email..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="student-search-input"
                />

                <span className="student-result-count">
                  Showing {filteredStudents.length} of {students.length}
                </span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="empty-message">
                  No students match your search.
                </div>
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
                        {filteredStudents.map((student) => (
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

                            <td>
                              <span
                                className={`student-status ${student.status}`}
                              >
                                {student.status}
                              </span>
                            </td>

                            <td>{student.face_samples}</td>

                            <td>
                              <span
                                className={getFaceStatusClass(
                                  student.face_status,
                                )}
                              >
                                {getFaceStatusLabel(student.face_status)}
                              </span>
                            </td>

                            <td>
                              <div className="student-actions">
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
                                  <span className="face-complete">
                                    ✓ Complete
                                  </span>
                                )}

                                <button
                                  type="button"
                                  className={`status-button ${
                                    student.status === "active"
                                      ? "deactivate"
                                      : "activate"
                                  }`}
                                  onClick={() => handleStatusChange(student)}
                                  disabled={updatingStudentId === student.id}
                                >
                                  {updatingStudentId === student.id
                                    ? "Updating..."
                                    : student.status === "active"
                                      ? "Deactivate"
                                      : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Students;
