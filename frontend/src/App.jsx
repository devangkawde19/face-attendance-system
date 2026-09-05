import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import "./index.css";

import Dashboard from "./pages/Dashboard";
import MarkAttendance from "./pages/MarkAttendance";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import RegisterStudent from "./pages/RegisterStudent";
import RegisterFace from "./pages/RegisterFace";

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
