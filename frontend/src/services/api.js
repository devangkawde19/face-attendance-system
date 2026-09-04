import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// =========================================================
// BACKEND HEALTH
// =========================================================

export const checkBackendHealth = async () => {
  const response = await api.get("/health");

  return response.data;
};

// =========================================================
// GET STUDENTS
// =========================================================

export const getStudents = async () => {
  const response = await api.get("/students");

  return response.data;
};

// =========================================================
// CREATE STUDENT
// =========================================================

export const createStudent = async (studentData) => {
  return await api.post("/students", studentData);
};

// =========================================================
// REGISTER 5 FACE SAMPLES
// =========================================================

export const registerFaceSamples = async (studentId, samples) => {
  const formData = new FormData();

  samples.forEach((sample, index) => {
    formData.append(`file${index + 1}`, sample, `face_sample_${index + 1}.jpg`);
  });

  return await api.post(`/students/${studentId}/faces`, formData);
};

// =========================================================
// RECOGNIZE + MARK ATTENDANCE
// =========================================================

export const recognizeAndMarkAttendance = async (imageBlob) => {
  const formData = new FormData();

  formData.append("file", imageBlob, "attendance.jpg");

  const response = await api.post("/attendance/mark-by-face", formData);

  return response.data;
};

export default api;
