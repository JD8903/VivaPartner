import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get All Subjects
export const getSubjects = async () => {
  const response = await API.get("/subjects");
  return response.data;
};

// Get Subject By ID
export const getSubjectById = async (id) => {
  const response = await API.get(`/subjects/${id}`);
  return response.data;
};

// Create Subject
export const createSubject = async (subjectData) => {
  const response = await API.post("/subjects", subjectData);
  return response.data;
};

// Update Subject
export const updateSubject = async (id, subjectData) => {
  const response = await API.put(`/subjects/${id}`, subjectData);
  return response.data;
};

// Delete Subject
export const deleteSubject = async (id) => {
  const response = await API.delete(`/subjects/${id}`);
  return response.data;
};

// Subject Count
export const getSubjectCount = async () => {
  const response = await API.get("/subjects/count/all");
  return response.data;
};

// Get Subjects By Department
export const getSubjectsByDepartment = async (departmentId) => {
  const response = await API.get(
    `/subjects/department/${departmentId}`
  );
  return response.data;
};