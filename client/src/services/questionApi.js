import axios from "axios";

const API = "http://localhost:5000/api/questions";

export const saveQuestionsToDB = async (data) => {
  const response = await axios.post(`${API}/save`, data);

  return response.data;
};