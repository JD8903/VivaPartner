import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// Get All Departments
// ===============================
export const getDepartments = async () => {
  const response = await API.get("/departments");
  return response.data;
};

// ===============================
// Get Department By ID
// ===============================
export const getDepartmentById = async (id) => {
  const response = await API.get(`/departments/${id}`);
  return response.data;
};

// ===============================
// Create Department
// ===============================
export const createDepartment = async (departmentData) => {
  const response = await API.post(
    "/departments",
    departmentData
  );

  return response.data;
};

// ===============================
// Update Department
// ===============================
export const updateDepartment = async (
  id,
  departmentData
) => {
  const response = await API.put(
    `/departments/${id}`,
    departmentData
  );

  return response.data;
};

// ===============================
// Delete Department
// ===============================
export const deleteDepartment = async (id) => {
  const response = await API.delete(
    `/departments/${id}`
  );

  return response.data;
};

// ===============================
// Department Count
// ===============================
export const getDepartmentCount = async () => {
  const response = await API.get(
    "/departments/count/all"
  );

  return response.data;
};