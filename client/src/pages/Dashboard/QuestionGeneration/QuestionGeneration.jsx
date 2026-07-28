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

  useEffect(() => {
    generateAIQuestions();
  }, []);

  // ============================================
  // Generate AI Questions
  // ============================================

  const generateAIQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      const study =
        JSON.parse(localStorage.getItem("studyMaterial")) || {};

      const viva =
        JSON.parse(localStorage.getItem("vivaConfig")) || {};

      const pdf = localStorage.getItem("pdfText") || "";
      const docx = localStorage.getItem("docxText") || "";
      const pptx = localStorage.getItem("pptxText") || "";
      const txt = localStorage.getItem("txtText") || "";

      const studyContent = `
Topic:
${study.topic || ""}

PDF Content:
${pdf}

DOCX Content:
${docx}

PPTX Content:
${pptx}

TXT Content:
${txt}
`;

      if (studyContent.trim() === "") {
        setError("No study material found.");
        setLoading(false);
        return;
      }

      const response = await generateQuestions({
        studyContent,
        difficulty: viva.difficulty || "Medium",
        questionCount: viva.questionCount || 10,
      });

      if (response.success) {
        setQuestions(response.questions);

        localStorage.setItem(
          "generatedQuestions",
          JSON.stringify(response.questions)
        );
      } else {
        setError(response.message || "Failed to generate questions.");
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Something went wrong while generating questions."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Edit Question
  // ============================================

  const editQuestion = (id, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              question: value,
            }
          : q
      )
    );
  };

  // ============================================
  // Delete Question
  // ============================================

  const deleteQuestion = (id) => {
    const updated = questions
      .filter((q) => q.id !== id)
      .map((q, index) => ({
        ...q,
        id: index + 1,
      }));

    setQuestions(updated);
  };

  // ============================================
  // Add Question
  // ============================================

  const addQuestion = () => {
    if (!newQuestion.trim()) return;

    setQuestions((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        question: newQuestion,
        difficulty: prev[0]?.difficulty || "Medium",
      },
    ]);

    setNewQuestion("");
  };

  // ============================================
  // Save Questions to Database
  // ============================================

  const saveQuestions = async () => {
    try {
      const study =
        JSON.parse(localStorage.getItem("studyMaterial")) || {};

      const viva =
        JSON.parse(localStorage.getItem("vivaConfig")) || {};

      const selectedClass =
        JSON.parse(localStorage.getItem("selectedClass")) || {};

      const teacher =
        JSON.parse(localStorage.getItem("teacher")) || {};

      const payload = {
        teacher: teacher._id || teacher.id || "",
        classId: selectedClass._id || "",
        subject: selectedClass.subject || "",
        topic: study.topic || "",
        difficulty: viva.difficulty || "Medium",
        questions,
      };

      const response = await saveQuestionsToDB(payload);

      if (response.success) {
        localStorage.setItem(
          "generatedQuestions",
          JSON.stringify(questions)
        );

        alert("Questions saved successfully to database.");
      } else {
        alert(response.message);
      }
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Unable to save questions."
      );
    }
  };

  const startVoiceViva = async () => {
  try {
    await saveQuestions();

    navigate("/teacher/voice-viva");
  } catch (err) {
    console.error(err);
    alert("Please save the questions before continuing.");
  }
};

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <div
        style={{
          padding: "60px",
          textAlign: "center",
          fontSize: "24px",
        }}
      >
        🤖 Generating Viva Questions...
      </div>
    );
  }

  // ============================================
  // Error
  // ============================================

  if (error) {
    return (
      <div
        style={{
          padding: "60px",
          color: "red",
          textAlign: "center",
        }}
      >
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }
    return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "10px" }}>
        Generated Viva Questions
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "25px",
        }}
      >
        Review, edit, add, delete and save the questions before starting
        the AI Voice Viva.
      </p>

      {/* Summary */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#f5f7fb",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <div>
          <strong>Total Questions</strong>
          <br />
          {questions.length}
        </div>

        <div>
          <strong>Difficulty</strong>
          <br />
          {questions[0]?.difficulty || "-"}
        </div>
      </div>

      {/* Questions */}

      {questions.length === 0 ? (
        <h3>No Questions Generated.</h3>
      ) : (
        questions.map((q) => (
          <div
            key={q.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3>Question {q.id}</h3>

              <span
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  padding: "5px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {q.difficulty}
              </span>
            </div>

            <textarea
              rows={3}
              value={q.question}
              onChange={(e) =>
                editQuestion(q.id, e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                resize: "vertical",
                fontSize: "16px",
                lineHeight: "24px",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "15px",
              }}
            >
              <button
                onClick={() => deleteQuestion(q.id)}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
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

      {/* Add Question */}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          background: "#fafafa",
        }}
      >
        <h2>Add Custom Question</h2>

        <textarea
          rows={4}
          value={newQuestion}
          onChange={(e) =>
            setNewQuestion(e.target.value)
          }
          placeholder="Enter a new viva question..."
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            resize: "vertical",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={addQuestion}
          style={{
            marginTop: "15px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "12px 22px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ➕ Add Question
        </button>
      </div>

      {/* Bottom Buttons */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "15px",
          marginTop: "40px",
        }}
      >
        <button
          onClick={generateAIQuestions}
          style={{
            background: "#f59e0b",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🔄 Regenerate Questions
        </button>

        <button
          onClick={saveQuestions}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          💾 Save to Database
        </button>

        <button
  onClick={startVoiceViva}
  style={{
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
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