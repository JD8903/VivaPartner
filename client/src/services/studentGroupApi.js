import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const generateGroups = (data) => {
  return API.post("/student-groups/generate", data);
};