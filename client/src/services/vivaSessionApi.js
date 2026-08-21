import api from "./api";

// ======================================================
// Create Viva Session
// ======================================================

export const createVivaSession = async (sessionData) => {
  try {
    const response = await api.post(
      "/viva-sessions",
      sessionData
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create viva session."
    );
  }
};

// ======================================================
// Get Viva Session
// ======================================================

export const getVivaSession = async (sessionId) => {
  try {
    const response = await api.get(
      `/viva-sessions/${encodeURIComponent(sessionId)}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch viva session."
    );
  }
};

// ======================================================
// Get Student Viva Share Link
// ======================================================

export const getStudentVivaLink = async (sessionId) => {
  try {
    const response = await api.get(
      `/viva-sessions/${encodeURIComponent(
        sessionId
      )}/share-link`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to generate viva link."
    );
  }
};

// ======================================================
// Student Join Viva
// ======================================================

export const joinVivaSession = async (
  sessionId,
  enrollmentNumber,
  studentName = ""
) => {
  try {
    const response = await api.post(
      `/viva-sessions/${encodeURIComponent(
        sessionId
      )}/join`,
      {
        enrollmentNumber,
        studentName,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to join viva."
    );
  }
};
// ======================================================
// Start Viva
// ======================================================

export const startVivaSession = async (sessionId) => {
  try {
    const response = await api.post(
      `/viva-sessions/${encodeURIComponent(
        sessionId
      )}/start`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to start viva."
    );
  }
};
// ======================================================
// Get Viva Question
// ======================================================

export const getVivaQuestion = async (
  sessionId,
  questionNumber
) => {
  try {
    const response = await api.get(
      `/viva-sessions/${encodeURIComponent(
        sessionId
      )}/question/${questionNumber}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to load viva question."
    );
  }
};