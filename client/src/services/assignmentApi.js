import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// Get All Assignments
// ===============================
export const getAssignments = async () => {
  const response = await API.get("/assignments");
  return response.data;
};

// ===============================
// Get Assignment By ID
// ===============================
export const getAssignmentById = async (id) => {
  const response = await API.get(`/assignments/${id}`);
  return response.data;
};

// ===============================
// Create Assignment
// ===============================
export const createAssignment = async (assignmentData) => {
  const response = await API.post(
    "/assignments",
    assignmentData
  );

  return response.data;
};

// ===============================
// Update Assignment
// ===============================
export const updateAssignment = async (
  id,
  assignmentData
) => {
  const response = await API.put(
    `/assignments/${id}`,
    assignmentData
  );

  return response.data;
};

// ===============================
// Delete Assignment
// ===============================
export const deleteAssignment = async (id) => {
  const response = await API.delete(
    `/assignments/${id}`
  );

  return response.data;
};