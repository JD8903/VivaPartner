const axios = require("axios");

const generateQuestions = async (req, res) => {
  try {
    const { studyContent, difficulty, questionCount } = req.body;

    if (!studyContent || studyContent.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Study content is required.",
      });
    }

    const prompt = `
You are an expert university viva examiner.

Study Material:
${studyContent}

Generate exactly ${questionCount} viva questions.

Selected Difficulty: ${difficulty}

Difficulty Guidelines:

Easy:
- Ask basic definition questions.
- Focus on simple concepts.
- Short and direct questions.

Medium:
- Ask conceptual questions.
- Include explanation and application.
- Moderate difficulty.

Hard:
- Ask analytical, comparison-based, scenario-based and advanced conceptual questions.
- Require deep understanding.

Rules:
1. Generate exactly ${questionCount} questions.
2. Questions must ONLY come from the study material.
3. Do NOT repeat questions.
4. Every question must have the selected difficulty.
5. Return ONLY a valid JSON array.
6. Do NOT include markdown, explanation or extra text.

Return this exact format:

[
  {
    "question": "What is Cloud Computing?",
    "difficulty": "${difficulty}"
  },
  {
    "question": "Explain Virtualization.",
    "difficulty": "${difficulty}"
  }
]
`;

    const response = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: "llama3.1:8b",
        stream: false,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }
    );

    let content = response.data.message.content;

    console.log("\n========== OLLAMA RESPONSE ==========\n");
    console.log(content);
    console.log("\n=====================================\n");

    // Remove markdown
    content = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Extract JSON array
    const start = content.indexOf("[");
    const end = content.lastIndexOf("]");

    if (start === -1 || end === -1) {
      return res.status(500).json({
        success: false,
        message: "AI did not return a valid JSON array.",
        raw: content,
      });
    }

    const jsonString = content.substring(start, end + 1);

    let questions = JSON.parse(jsonString);

    // Validate & normalize
    questions = questions.map((item) => ({
      question: item.question || "",
      difficulty: item.difficulty || difficulty,
    }));

    questions = questions.map((item) => ({
  question: item.question || "",
  difficulty: item.difficulty || difficulty,
}));

// Randomize Questions
for (let i = questions.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));

  [questions[i], questions[j]] = [
    questions[j],
    questions[i],
  ];
}

// ===========================
// Assign IDs
// ===========================


questions = questions.map((q, index) => ({
  id: index + 1,
  question: q.question,
  difficulty: q.difficulty,
}));


    res.json({
      success: true,
      difficulty,
      totalQuestions: questions.length,
      questions,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to generate questions.",
      error: err.message,
    });
  }
};

module.exports = {
  generateQuestions,
};