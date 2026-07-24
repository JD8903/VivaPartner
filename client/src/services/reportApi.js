import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ================= Dashboard =================

export const getDashboardStatistics = async () => {
  try {
    const { data } = await API.get("/reports/dashboard");
    return data;
  } catch (error) {
    console.error("Dashboard Statistics Error:", error);
    throw error;
  }
};

// ================= Recent Activities =================

export const getRecentActivities = async () => {
  try {
    const { data } = await API.get("/reports/recent-activities");
    return data;
  } catch (error) {
    console.error("Recent Activities Error:", error);
    throw error;
  }
};

// ================= Charts =================

export const getTeachersPerDepartment = async () => {
  try {
    const { data } = await API.get(
      "/reports/teachers-department"
    );
    return data;
  } catch (error) {
    console.error("Teachers Chart Error:", error);
    throw error;
  }
};

export const getSubjectsPerDepartment = async () => {
  try {
    const { data } = await API.get(
      "/reports/subjects-department"
    );
    return data;
  } catch (error) {
    console.error("Subjects Chart Error:", error);
    throw error;
  }
};

export const getClassesPerDepartment = async () => {
  try {
    const { data } = await API.get(
      "/reports/classes-department"
    );
    return data;
  } catch (error) {
    console.error("Classes Chart Error:", error);
    throw error;
  }
};

export const getAssignmentsPerTeacher = async () => {
  try {
    const { data } = await API.get(
      "/reports/assignments-teacher"
    );
    return data;
  } catch (error) {
    console.error("Assignments Chart Error:", error);
    throw error;
  }
};