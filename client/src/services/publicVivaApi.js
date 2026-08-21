// ============================================================
// VivaPartner - Public Viva API
// Phase 11.7 - Answer Submission API
// ============================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

// ============================================================
// COMMON REQUEST HELPER
// ============================================================

const request = async (
  path,
  options = {}
) => {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`
    );

    error.response = {
      status: response.status,
      data,
    };

    throw error;
  }

  return data;
};

// ============================================================
// GET PUBLIC VIVA SESSION
// ============================================================

export const getPublicVivaSession = async (
  sessionId
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  return request(
    `/viva/public/${encodeURIComponent(
      sessionId
    )}`
  );
};

// ============================================================
// JOIN PUBLIC VIVA
// ============================================================

export const joinPublicViva = async (
  sessionId,
  enrollmentNumber
) => {
  if (!sessionId) {
    throw new Error(
      "Viva Session ID is required."
    );
  }

  const cleanEnrollmentNumber =
    String(
      enrollmentNumber || ""
    ).trim();

  if (!cleanEnrollmentNumber) {
    throw new Error(
      "Enrollment number is required."
    );
  }

  return request(
    `/viva/public/${encodeURIComponent(
      sessionId
    )}/join`,
    {
      method: "POST",

      body: JSON.stringify({
        enrollmentNumber:
          cleanEnrollmentNumber,
      }),
    }
  );
};

// ============================================================
// START PUBLIC VIVA
// ============================================================

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

  return request(
    `/viva/public/${encodeURIComponent(
      sessionId
    )}/start`,
    {
      method: "POST",

      body: JSON.stringify({
        attemptId,
      }),
    }
  );
};

// ============================================================
// GET CURRENT VIVA QUESTION
// ============================================================

export const getCurrentVivaQuestion =
  async (
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

    const params =
      new URLSearchParams({
        attemptId:
          String(attemptId),
      });

    return request(
      `/viva/public/${encodeURIComponent(
        sessionId
      )}/question?${params.toString()}`
    );
  };

// ============================================================
// GET NEXT VIVA QUESTION
//
// Compatibility function for StudentViva.jsx.
//
// Backend uses the same current-question endpoint,
// because the backend determines the current question
// from the student's VivaAttempt.
// ============================================================

export const nextVivaQuestion = async (
  sessionId,
  attemptId
) => {
  return getCurrentVivaQuestion(
    sessionId,
    attemptId
  );
};

// ============================================================
// 11.7 — SUBMIT STUDENT ANSWER
// ============================================================
//
// Sends:
//
// sessionId
// attemptId
// enrollmentNo
// questionId
// question
// answer
// questionNumber
//
// Backend validates everything and permanently
// saves the answer inside VivaAttempt.
//
// Marks/evaluation are NEVER returned to the student.
// ============================================================

export const submitPublicVivaAnswer =
  async (
    sessionId,
    payload = {}
  ) => {
    // ----------------------------------------------------------
    // SESSION VALIDATION
    // ----------------------------------------------------------

    if (
      !sessionId ||
      !String(sessionId).trim()
    ) {
      throw new Error(
        "Viva Session ID is required."
      );
    }

    // ----------------------------------------------------------
    // ANSWER VALIDATION
    // ----------------------------------------------------------

    const answer =
      String(
        payload.answer || ""
      ).trim();

    if (!answer) {
      throw new Error(
        "Answer cannot be empty."
      );
    }

    // ----------------------------------------------------------
    // ENROLLMENT VALIDATION
    // ----------------------------------------------------------

    const enrollmentNo =
      String(
        payload.enrollmentNo || ""
      ).trim();

    if (!enrollmentNo) {
      throw new Error(
        "Enrollment number is required."
      );
    }

    // ----------------------------------------------------------
    // ATTEMPT VALIDATION
    // ----------------------------------------------------------

    const attemptId =
      payload.attemptId || "";

    if (!attemptId) {
      throw new Error(
        "Viva attempt ID is required."
      );
    }

    // ----------------------------------------------------------
    // QUESTION NUMBER VALIDATION
    // ----------------------------------------------------------

    const questionNumber =
      Number(
        payload.questionNumber
      );

    if (
      !Number.isInteger(
        questionNumber
      ) ||
      questionNumber < 1
    ) {
      throw new Error(
        "Valid question number is required."
      );
    }

    // ----------------------------------------------------------
    // SEND TO BACKEND
    // ----------------------------------------------------------

    return request(
      `/viva/public/${encodeURIComponent(
        sessionId
      )}/answer`,
      {
        method: "POST",

        body: JSON.stringify({
          attemptId,

          enrollmentNo,

          questionId:
            payload.questionId ||
            null,

          question:
            String(
              payload.question || ""
            ).trim(),

          answer,

          questionNumber,
        }),
      }
    );
  };

// ============================================================
// SAVE STUDENT ANSWER
//
// Compatibility alias for StudentViva.jsx.
//
// Both names use exactly the same backend API.
// ============================================================

export const saveStudentAnswer =
  async (
    sessionId,
    payload = {}
  ) => {
    return submitPublicVivaAnswer(
      sessionId,
      payload
    );
  };

// ============================================================
// COMPLETE PUBLIC VIVA
// ============================================================

export const completePublicViva =
  async (
    sessionId,
    enrollmentNo
  ) => {
    if (!sessionId) {
      throw new Error(
        "Viva Session ID is required."
      );
    }

    const cleanEnrollmentNo =
      String(
        enrollmentNo || ""
      ).trim();

    if (!cleanEnrollmentNo) {
      throw new Error(
        "Enrollment number is required."
      );
    }

    return request(
      `/viva/public/${encodeURIComponent(
        sessionId
      )}/complete`,
      {
        method: "POST",

        body: JSON.stringify({
          enrollmentNo:
            cleanEnrollmentNo,
        }),
      }
    );
  };

// ============================================================
// OPTIONAL COMPATIBILITY ALIASES
// ============================================================
//
// These aliases prevent import-name mismatch between
// different Phase 10/11 Student Viva implementations.
//
// ============================================================

export const startViva =
  startPublicViva;

export const joinViva =
  joinPublicViva;

export const getVivaSession =
  getPublicVivaSession;

export const completeViva =
  completePublicViva;