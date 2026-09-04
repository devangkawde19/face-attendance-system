import { BrowserRouter, Link, Route, Routes } from "react-router-dom";


import "./index.css";

import MarkAttendance from "./pages/MarkAttendance";
import Students from "./pages/Students";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterFace from "./pages/RegisterFace";
function Dashboard() {
  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      <p>Welcome to your face attendance system.</p>

      <Link to="/attendance" className="dashboard-button">
        📷 Mark Attendance
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* =========================
            SIDEBAR
            ========================= */}

        <aside className="sidebar">
          <div className="logo">
            <h2>FaceAttend</h2>

            <span>Attendance System</span>
          </div>

          <nav>
            <Link to="/" className="nav-item">
              Dashboard
            </Link>

            <Link to="/attendance" className="nav-item">
              Attendance
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

        {/* =========================
            MAIN CONTENT
            ========================= */}

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attendance" element={<MarkAttendance />} />
            <Route path="/students" element={<Students />} />
            <Route path="/register" element={<RegisterStudent />} />
            <Route path="/settings" element={<h1>Settings</h1>} />
            <Route
              path="/students/:studentId/face"
              element={<RegisterFace />}
            />
            ;
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
