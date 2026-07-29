import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Upload Students
export const uploadStudents = (formData, onUploadProgress) =>
  API.post("/students/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

// Get Students (Search + Filter + Pagination)
export const getStudents = (
  search = "",
  classId = "",
  department = "",
  page = 1,
  limit = 10
) => {
  return API.get("/students", {
    params: {
      search,
      classId,
      department,
      page,
      limit,
    },
  });
};

// Update Student
export const updateStudent = (id, studentData) => {
  return API.put(`/students/${id}`, studentData);
};

//delete student
export const deleteStudent = (id) => {
  return API.delete(`/students/${id}`);
};