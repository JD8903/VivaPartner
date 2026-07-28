import axios from "axios";

const API = "http://localhost:5000/api/ai";

export const generateQuestions = async (data) => {
  const response = await axios.post(
    `${API}/generate-questions`,
    data
  );

  return response.data;
};