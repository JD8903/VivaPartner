import api from "./api";

export const extractDOCX = async (file) => {
  if (!file) {
    throw new Error("No DOCX file selected.");
  }

  const formData = new FormData();

  formData.append("file", file);

  try {
    const response = await api.post(
      "/docx/extract",
      formData
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to extract DOCX text."
    );
  }
};