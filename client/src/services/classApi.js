import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get All Classes
export const getClasses = async () => {
  const response = await API.get("/classes");
  return response.data;
};

// Get Class By ID
export const getClassById = async (id) => {
  const response = await API.get(`/classes/${id}`);
  return response.data;
};

// Create Class
export const createClass = async (classData) => {
  const response = await API.post("/classes", classData);
  return response.data;
};

// Update Class
export const updateClass = async (id, classData) => {
  const response = await API.put(`/classes/${id}`, classData);
  return response.data;
};

// Delete Class
export const deleteClass = async (id) => {
  const response = await API.delete(`/classes/${id}`);
  return response.data;
};

// Class Count
export const getClassCount = async () => {
  const response = await API.get("/classes/count/all");
  return response.data;
};

// Get Classes By Department
export const getClassesByDepartment = async (departmentId) => {
  const response = await API.get(
    `/classes/department/${departmentId}`
  );
  return response.data;
};