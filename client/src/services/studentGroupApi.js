import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
});

export const generateGroups = (data) => {
  return API.post("/student-groups/generate", data);
};