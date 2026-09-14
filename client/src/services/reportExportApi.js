import api from "./api";

/**
 * Download generated Excel results for a viva session
 */
export const downloadVivaResultsExcel = async (sessionId) => {
  try {
    const response = await api.get(`/export/viva/${encodeURIComponent(sessionId)}/excel`, {
      responseType: "blob",
    });

    // Create a blob URL and trigger browser download
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Viva_Results_${sessionId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Download Excel Error:", error);
    throw new Error(error.response?.data?.message || "Failed to download Excel file.");
  }
};

/**
 * Upload original teacher Excel sheet and download populated version
 */
export const populateOriginalExcel = async (sessionId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/export/viva/${encodeURIComponent(sessionId)}/populate-excel`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      }
    );

    const originalBaseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "Results";
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Populated_${originalBaseName}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Populate Original Excel Error:", error);
    throw new Error(error.response?.data?.message || "Failed to populate original Excel file.");
  }
};
