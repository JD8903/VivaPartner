import axios from "axios";

const API =
  "http://localhost:5000/api/viva/public";

// =====================================================
// GET PUBLIC VIVA SESSION
// =====================================================

export const getPublicVivaSession = async (
  sessionId
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  try {
    const response = await axios.get(
      `${API}/${encodeURIComponent(sessionId)}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to load Viva Session."
    );
  }
};

// =====================================================
// JOIN PUBLIC VIVA
// =====================================================

export const joinPublicViva = async (
  sessionId,
  enrollmentNumber
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  if (
    !enrollmentNumber ||
    !enrollmentNumber.trim()
  ) {
    throw new Error(
      "Enrollment number is required."
    );
  }

  try {
    const response = await axios.post(
      `${API}/${encodeURIComponent(
        sessionId
      )}/join`,
      {
        enrollmentNumber:
          enrollmentNumber.trim(),
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to join Viva."
    );
  }
};

// =====================================================
// START PUBLIC VIVA
// =====================================================

export const startPublicViva = async (
  sessionId,
  attemptId
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  if (!attemptId) {
    throw new Error(
      "Viva attempt ID is required."
    );
  }

  try {
    const response = await axios.post(
      `${API}/${encodeURIComponent(
        sessionId
      )}/start`,
      {
        attemptId,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to start Viva."
    );
  }
};

// =====================================================
// 10.7.2
// GET CURRENT QUESTION
// =====================================================

export const getCurrentVivaQuestion = async (
  sessionId,
  attemptId
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  if (!attemptId) {
    throw new Error(
      "Viva attempt ID is required."
    );
  }

  try {
    const response = await axios.get(
      `${API}/${encodeURIComponent(
        sessionId
      )}/question`,
      {
        params: {
          attemptId,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to load Viva question."
    );
  }
};

// =====================================================
// 10.7.5
// SAVE STUDENT ANSWER
// =====================================================

export const saveStudentAnswer = async (
  sessionId,
  attemptId,
  answer
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  if (!attemptId) {
    throw new Error(
      "Viva attempt ID is required."
    );
  }

  if (!answer?.questionId && !answer?.questionNumber) {
    throw new Error(
      "Question information is required."
    );
  }

  try {
    const response = await axios.post(
      `${API}/${encodeURIComponent(
        sessionId
      )}/answer`,
      {
        attemptId,
        questionId:
          answer.questionId || null,
        questionNumber:
          answer.questionNumber,
        question:
          answer.question || "",
        transcript:
          answer.transcript || "",
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to save your answer."
    );
  }
};

// =====================================================
// 10.7.6
// NEXT QUESTION
// =====================================================

export const nextVivaQuestion = async (
  sessionId,
  attemptId
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  if (!attemptId) {
    throw new Error(
      "Viva attempt ID is required."
    );
  }

  try {
    const response = await axios.post(
      `${API}/${encodeURIComponent(
        sessionId
      )}/next`,
      {
        attemptId,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to load next question."
    );
  }
};

// =====================================================
// 10.7.7
// COMPLETE VIVA
// =====================================================

export const completePublicViva = async (
  sessionId,
  attemptId
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  if (!attemptId) {
    throw new Error(
      "Viva attempt ID is required."
    );
  }

  try {
    const response = await axios.post(
      `${API}/${encodeURIComponent(
        sessionId
      )}/complete`,
      {
        attemptId,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to complete Viva."
    );
  }
};

// =====================================================
// COMPATIBILITY ALIASES
// =====================================================

export const startViva = startPublicViva;
export const joinViva = joinPublicViva;
export const getVivaSession = getPublicVivaSession;
export const completeViva = completePublicViva;