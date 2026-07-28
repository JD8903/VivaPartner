import axios from "axios";

const API =
  "http://localhost:5000/api/pdf";

export const extractPDF = async (file) => {
  const formData = new FormData();

  formData.append("pdf", file);

  const res = await axios.post(
    `${API}/extract`,
    formData
  );

  return res.data;
};