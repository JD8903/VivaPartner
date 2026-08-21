import api from "./api";

// Upload Students
export const uploadStudents = (formData, onUploadProgress) =>
  api.post("/students/upload", formData, {
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
  return api.get("/students", {
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
  return api.put(`/students/${id}`, studentData);
};

// delete student
export const deleteStudent = (id) => {
  return api.delete(`/students/${id}`);
};