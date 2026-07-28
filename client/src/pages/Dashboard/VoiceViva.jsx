import { useEffect, useState } from "react";

const VoiceViva = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const savedQuestions =
      JSON.parse(localStorage.getItem("generatedQuestions")) || [];

    setQuestions(savedQuestions);
  }, []);

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "30px",
      }}
    >
      <h1>🎙 AI Voice Viva</h1>

      <p>
        Questions Ready : <strong>{questions.length}</strong>
      </p>

      <hr />

      {questions.map((q) => (
        <div
          key={q.id}
          style={{
            marginBottom: "20px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h3>Question {q.id}</h3>

          <p>{q.question}</p>

          <span
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "5px 10px",
              borderRadius: "20px",
            }}
          >
            {q.difficulty}
          </span>
        </div>
      ))}
    </div>
  );
};

export default VoiceViva;