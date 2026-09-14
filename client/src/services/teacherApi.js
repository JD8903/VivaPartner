import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================
// Get All Teachers
// ======================
export const getTeachers = async () => {
  const response = await API.get("/teachers");
  return response.data;
};

// ======================
// Get Teacher By ID
// ======================
export const getTeacherById = async (id) => {
  const response = await API.get(`/teachers/${id}`);
  return response.data;
};

// ======================
// Create Teacher
// ======================
export const createTeacher = async (teacherData) => {
  const response = await API.post("/teachers", teacherData);
  return response.data;
};

// ======================
// Update Teacher
// ======================
export const updateTeacher = async (id, teacherData) => {
  const response = await API.put(`/teachers/${id}`, teacherData);
  return response.data;
};

// ======================
// Delete Teacher
// ======================
export const deleteTeacher = async (id) => {
  const response = await API.delete(`/teachers/${id}`);
  return response.data;
};

//=====================
//TEACHER COUNT
//====================

export const getTeacherCount = async () => {
  const response = await API.get("/teachers/count/all");
  return response.data;
};

// ============================
// Get Assigned Classes
// ============================

export const getAssignedClasses = async () => {
  const token = localStorage.getItem("token");

  const response = await API.get("/teacher/assigned-classes", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ============================
// Get Teacher Dashboard Stats
// ============================

export const getTeacherDashboardStats = async () => {
  const token = localStorage.getItem("token");

  const response = await API.get("/teacher/dashboard-stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default API;