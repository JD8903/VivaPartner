import api from "./api";

// =====================================================
// Generate Viva Questions
// =====================================================

export const generateQuestions = async ({
  studyContent,
  topic = "",
  difficulty = "Medium",
  questionCount = 10,
}) => {
  if (!studyContent || !studyContent.trim()) {
    throw new Error("Study material content is empty.");
  }

  const cleanDifficulty =
    ["Easy", "Medium", "Hard", "Mixed"].includes(difficulty)
      ? difficulty
      : "Medium";

  const cleanQuestionCount = Number(questionCount);

  const count =
    Number.isInteger(cleanQuestionCount) &&
    cleanQuestionCount >= 1 &&
    cleanQuestionCount <= 50
      ? cleanQuestionCount
      : 10;

  const response = await api.post("/ai/generate-questions", {
    studyContent: studyContent.trim(),
    topic: topic.trim(),
    difficulty: cleanDifficulty,
    questionCount: count,
  });

  return response.data;
};