import axios from "axios";

const API = "http://localhost:5000/api/docx";

export const extractDOCX = async (file) => {
  const formData = new FormData();

  formData.append("docx", file);

  const response = await axios.post(
    `${API}/extract`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};