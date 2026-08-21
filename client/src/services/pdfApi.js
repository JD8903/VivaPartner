import api from "./api";

export const extractPDF = async (file) => {
  if (!file) {
    throw new Error("No PDF file selected.");
  }

  const formData = new FormData();

  formData.append("file", file);

  try {
    const response = await api.post(
      "/pdf/extract",
      formData
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "PDF extraction failed."
      );
    }

    if (
      typeof response.data.text !== "string" ||
      !response.data.text.trim()
    ) {
      throw new Error(
        "No readable text was extracted from the PDF."
      );
    }

    return response.data;
  } catch (error) {
    console.error(
      "PDF extraction API error:",
      error
    );

    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to extract PDF text."
    );
  }
};