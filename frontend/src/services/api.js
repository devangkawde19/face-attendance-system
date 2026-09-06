import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const checkBackendHealth = async () => {
  const response = await api.get("/");
  return response.data;
};

export const getStudents = async () => {
  const response = await api.get("/students");
  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await api.post("/students", studentData);
  return response.data;
};

export const updateStudentStatus = async (studentId, status) => {
  const response = await api.patch(`/students/${studentId}/status`, {
    status,
  });
  return response.data;
};

export const registerFaceSamples = async (studentId, files) => {
  if (files.length !== 5) {
    throw new Error("Exactly 5 face samples are required.");
  }

  const formData = new FormData();

  files.forEach((file, index) => {
    formData.append(`file${index + 1}`, file, `face-sample-${index + 1}.jpg`);
  });

  const response = await api.post(`/students/${studentId}/faces`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const recognizeAndMarkAttendance = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post("/attendance/mark-by-face", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getAttendance = async () => {
  const response = await api.get("/attendance");
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getTodayAttendance = async () => {
  const response = await api.get("/dashboard/today-attendance");
  return response.data;
};

export default api;
