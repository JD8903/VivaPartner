import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { generateQuestions } from "../../../services/aiApi";
import { saveQuestionsToDB } from "../../../services/questionApi";

const QuestionGeneration = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);

  // =====================================================
  // Safely read localStorage
  // =====================================================

  const getStorageObject = (key) => {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        return {};
      }

      const parsed = JSON.parse(value);

      return parsed && typeof parsed === "object"
        ? parsed
        : {};
    } catch (error) {
      console.error(`Failed to read ${key}:`, error);
      return {};
    }
  };

  // =====================================================
  // Get Current Study Material
  // =====================================================

  const getCurrentStudyMaterial = () => {
    const possibleKeys = [
      "studyMaterial",
      "studyMaterialDraft",
    ];

    for (const key of possibleKeys) {
      const data = getStorageObject(key);

      if (
        data.topic ||
        data.fileName ||
        data.filePath
      ) {
        return data;
      }
    }

    return {};
  };

  // =====================================================
  // Get Current Viva Configuration
  // =====================================================

  const getVivaConfiguration = () => {
    const possibleKeys = [
      "vivaConfig",
      "vivaConfiguration",
    ];

    for (const key of possibleKeys) {
      const data = getStorageObject(key);

      if (Object.keys(data).length > 0) {
        return data;
      }
    }

    return {};
  };

  // =====================================================
  // Get Current Extracted Content
  // =====================================================

  const getCurrentExtractedContent = () => {
    const contentParts = [];

    const pdfText =
      localStorage.getItem("pdfText") || "";

    const docxText =
      localStorage.getItem("docxText") || "";

    const pptxText =
      localStorage.getItem("pptxText") || "";

    const txtText =
      localStorage.getItem("txtText") || "";

    if (pdfText.trim()) {
      contentParts.push(
        `PDF STUDY MATERIAL:\n${pdfText}`
      );
    }

    if (docxText.trim()) {
      contentParts.push(
        `DOCX STUDY MATERIAL:\n${docxText}`
      );
    }

    if (pptxText.trim()) {
      contentParts.push(
        `PPTX STUDY MATERIAL:\n${pptxText}`
      );
    }

    if (txtText.trim()) {
      contentParts.push(
        `TXT STUDY MATERIAL:\n${txtText}`
      );
    }

    return contentParts.join("\n\n");
  };

  // =====================================================
  // Generate Questions
  // =====================================================

  const generateAIQuestions = async () => {
    try {
      setGenerating(true);
      setLoading(true);
      setError("");
      setSaved(false);

      const study = getCurrentStudyMaterial();
      const viva = getVivaConfiguration();

      const extractedContent =
        getCurrentExtractedContent();

      const topic = (study.topic || "").trim();

      // =================================================
      // Build CURRENT study content only
      // =================================================

      const contentParts = [];

      if (topic) {
        contentParts.push(
          `CURRENT TOPIC:\n${topic}`
        );
      }

      if (extractedContent.trim()) {
        contentParts.push(extractedContent);
      }

      const studyContent =
        contentParts.join("\n\n").trim();

      console.log(
        "========== CURRENT 9.6 STUDY CONTENT =========="
      );
      console.log(studyContent);
      console.log(
        "==============================================="
      );

      // =================================================
      // Validate material
      // =================================================

      if (!studyContent) {
        setError(
          "No current study material was found. Please go back and enter a topic or upload study material."
        );

        setQuestions([]);
        setLoading(false);
        setGenerating(false);

        return;
      }

      // =================================================
      // Current Viva Configuration
      // =================================================

      const difficulty =
        viva.difficulty || "Medium";

      const questionCount = Number(
        viva.questionCount ||
          viva.numberOfQuestions ||
          10
      );

      const questionType =
        viva.questionType || "Mixed";

      // =================================================
      // Generate
      // =================================================

      const response = await generateQuestions({
        studyContent,
        difficulty,
        questionCount,
        questionType,
      });

      console.log(
        "========== 9.6 AI RESPONSE =========="
      );
      console.log(response);
      console.log(
        "====================================="
      );

      if (
        response &&
        response.success &&
        Array.isArray(response.questions)
      ) {
        const normalizedQuestions =
          response.questions
            .filter(
              (item) =>
                item &&
                typeof item.question === "string" &&
                item.question.trim()
            )
            .map((item, index) => ({
              id: index + 1,
              question: item.question.trim(),
              difficulty:
                item.difficulty || difficulty,
              questionType:
                item.questionType ||
                questionType,
            }));

        if (normalizedQuestions.length === 0) {
          setError(
            "AI did not generate valid questions."
          );

          setQuestions([]);
          setLoading(false);
          setGenerating(false);

          return;
        }

        setQuestions(normalizedQuestions);

        // Save ONLY the newly generated questions
        localStorage.setItem(
          "generatedQuestions",
          JSON.stringify(normalizedQuestions)
        );

        setSaved(false);
      } else {
        setError(
          response?.message ||
            "AI returned an invalid response."
        );

        setQuestions([]);
      }
    } catch (error) {
      console.error(
        "9.6 Generate Questions Error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while generating questions."
      );

      setQuestions([]);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  // =====================================================
  // Initial Load
  // =====================================================

  useEffect(() => {
    const existingQuestions =
      localStorage.getItem("generatedQuestions");

    if (existingQuestions) {
      try {
        const parsed =
          JSON.parse(existingQuestions);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          setQuestions(parsed);
          setSaved(true);
          setLoading(false);

          return;
        }
      } catch (error) {
        console.error(
          "Invalid saved questions:",
          error
        );
      }
    }

    generateAIQuestions();
  }, []);

  // =====================================================
  // Edit Question
  // =====================================================

  const editQuestion = (id, value) => {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === id
          ? {
              ...question,
              question: value,
            }
          : question
      )
    );

    setSaved(false);
  };

  // =====================================================
  // Delete Question
  // =====================================================

  const deleteQuestion = (id) => {
    const updatedQuestions = questions
      .filter((question) => question.id !== id)
      .map((question, index) => ({
        ...question,
        id: index + 1,
      }));

    setQuestions(updatedQuestions);
    setSaved(false);

    localStorage.setItem(
      "generatedQuestions",
      JSON.stringify(updatedQuestions)
    );
  };

  // =====================================================
  // Add Custom Question
  // =====================================================

  const addQuestion = () => {
    const cleanQuestion =
      newQuestion.trim();

    if (!cleanQuestion) {
      return;
    }

    const viva = getVivaConfiguration();

    const newItem = {
      id: questions.length + 1,
      question: cleanQuestion,
      difficulty:
        viva.difficulty || "Medium",
      questionType:
        viva.questionType || "Mixed",
    };

    const updatedQuestions = [
      ...questions,
      newItem,
    ];

    setQuestions(updatedQuestions);
    setNewQuestion("");
    setSaved(false);

    localStorage.setItem(
      "generatedQuestions",
      JSON.stringify(updatedQuestions)
    );
  };

  // =====================================================
  // Save Questions
  // =====================================================

  const saveQuestions = async () => {
    if (questions.length === 0) {
      setError(
        "There are no questions to save."
      );

      return false;
    }

    try {
      setSaving(true);
      setError("");

      const study = getCurrentStudyMaterial();
      const viva = getVivaConfiguration();

      const selectedClass =
        getStorageObject("selectedClass");

      const teacher =
        getStorageObject("teacher");

      const payload = {
        teacher:
          teacher._id ||
          teacher.id ||
          "",

        classId:
          selectedClass.class?._id ||
          selectedClass.class?.id ||
          selectedClass._id ||
          selectedClass.id ||
          "",

        subject:
          selectedClass.subject?.name ||
          selectedClass.subject ||
          "",

        topic: study.topic || "",

        difficulty:
          viva.difficulty || "Medium",

        questionType:
          viva.questionType || "Mixed",

        questions,
      };

      console.log(
        "========== 9.6 SAVE PAYLOAD =========="
      );
      console.log(payload);
      console.log(
        "======================================"
      );

      const response =
        await saveQuestionsToDB(payload);

      console.log(
        "========== 9.6 SAVE RESPONSE =========="
      );
      console.log(response);
      console.log(
        "======================================="
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to save questions."
        );
      }

      localStorage.setItem(
        "generatedQuestions",
        JSON.stringify(questions)
      );

      setSaved(true);

      return true;
    } catch (error) {
      console.error(
        "9.6 Save Questions Error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save questions."
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // Start Voice Viva
  // =====================================================

  const startVoiceViva = async () => {
    if (questions.length === 0) {
      setError(
        "Please generate questions before starting the voice viva."
      );

      return;
    }

    const success = await saveQuestions();

    if (!success) {
      return;
    }

    localStorage.setItem(
      "generatedQuestions",
      JSON.stringify(questions)
    );

    navigate("/teacher/voice-viva");
  };

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <div
          style={{
            fontSize: "42px",
          }}
        >
          🤖
        </div>

        <h2>
          {generating
            ? "Generating Viva Questions..."
            : "Loading Questions..."}
        </h2>

        <p
          style={{
            color: "#64748b",
          }}
        >
          Questions are being generated from the
          current study material.
        </p>
      </div>
    );
  }

  // =====================================================
  // Render
  // =====================================================

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "30px 20px 50px",
        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          Header
      ================================================= */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "30px",
            color: "#1e293b",
          }}
        >
          Generated Viva Questions
        </h1>

        <p
          style={{
            margin: 0,
            color: "#64748b",
          }}
        >
          Review and manage the questions generated
          from your current study material.
        </p>
      </div>

      {/* =================================================
          Error
      ================================================= */}

      {error && (
        <div
          style={{
            marginBottom: "25px",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* =================================================
          Summary
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <strong>Total Questions</strong>

          <div
            style={{
              marginTop: "8px",
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            {questions.length}
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <strong>Difficulty</strong>

          <div
            style={{
              marginTop: "8px",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            {questions[0]?.difficulty ||
              getVivaConfiguration()
                .difficulty ||
              "Medium"}
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <strong>Status</strong>

          <div
            style={{
              marginTop: "8px",
              fontSize: "18px",
              fontWeight: "700",
              color: saved
                ? "#16a34a"
                : "#f59e0b",
            }}
          >
            {saved ? "Saved" : "Unsaved"}
          </div>
        </div>
      </div>

      {/* =================================================
          Questions
      ================================================= */}

      {questions.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "#ffffff",
          }}
        >
          <h3>
            No Questions Generated
          </h3>

          <button
            type="button"
            onClick={generateAIQuestions}
            style={{
              marginTop: "15px",
              padding: "12px 22px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            🔄 Generate Questions
          </button>
        </div>
      ) : (
        questions.map((question) => (
          <div
            key={question.id}
            style={{
              marginBottom: "18px",
              padding: "20px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              boxShadow:
                "0 4px 15px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "15px",
                marginBottom: "15px",
                flexWrap: "wrap",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1e293b",
                }}
              >
                Question {question.id}
              </h3>

              <span
                style={{
                  padding: "6px 13px",
                  borderRadius: "20px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                {question.difficulty ||
                  "Medium"}
              </span>
            </div>

            <textarea
              rows={3}
              value={question.question}
              onChange={(event) =>
                editQuestion(
                  question.id,
                  event.target.value
                )
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                resize: "vertical",
                outline: "none",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "12px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  deleteQuestion(question.id)
                }
                style={{
                  padding: "9px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#dc2626",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* =================================================
          Add Custom Question
      ================================================= */}

      <div
        style={{
          marginTop: "30px",
          padding: "22px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Add Custom Question
        </h2>

        <textarea
          rows={4}
          value={newQuestion}
          onChange={(event) =>
            setNewQuestion(event.target.value)
          }
          placeholder="Enter your custom viva question..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "13px",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            resize: "vertical",
            fontSize: "15px",
          }}
        />

        <button
          type="button"
          onClick={addQuestion}
          disabled={!newQuestion.trim()}
          style={{
            marginTop: "12px",
            padding: "11px 20px",
            border: "none",
            borderRadius: "8px",
            background: newQuestion.trim()
              ? "#2563eb"
              : "#94a3b8",
            color: "#ffffff",
            cursor: newQuestion.trim()
              ? "pointer"
              : "not-allowed",
            fontWeight: "600",
          }}
        >
          ➕ Add Question
        </button>
      </div>

      {/* =================================================
          Actions
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "30px",
          paddingTop: "25px",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          onClick={generateAIQuestions}
          disabled={generating}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "9px",
            background: "#f59e0b",
            color: "#ffffff",
            cursor: generating
              ? "not-allowed"
              : "pointer",
            fontWeight: "600",
            opacity: generating ? 0.7 : 1,
          }}
        >
          {generating
            ? "Generating..."
            : "🔄 Regenerate"}
        </button>

        <button
          type="button"
          onClick={saveQuestions}
          disabled={
            saving || questions.length === 0
          }
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "9px",
            background: "#2563eb",
            color: "#ffffff",
            cursor:
              saving || questions.length === 0
                ? "not-allowed"
                : "pointer",
            fontWeight: "600",
            opacity:
              saving || questions.length === 0
                ? 0.6
                : 1,
          }}
        >
          {saving
            ? "Saving..."
            : saved
            ? "✓ Saved"
            : "💾 Save Questions"}
        </button>

        <button
          type="button"
          onClick={startVoiceViva}
          disabled={
            saving || questions.length === 0
          }
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "9px",
            background:
              questions.length === 0
                ? "#94a3b8"
                : "#16a34a",
            color: "#ffffff",
            cursor:
              saving || questions.length === 0
                ? "not-allowed"
                : "pointer",
            fontWeight: "600",
          }}
        >
          ▶ Start Voice Viva
        </button>
      </div>
    </div>
  );
};

export default QuestionGeneration;