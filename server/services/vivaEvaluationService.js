const axios = require("axios");
const StudyMaterial = require("../models/StudyMaterial");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

/**
 * Helper to clean and parse JSON response from Ollama
 */
const cleanAIResponse = (content) => {
  if (!content || typeof content !== "string") {
    throw new Error("AI returned an empty response.");
  }

  let cleaned = content.trim();

  // Remove markdown code fences.
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Locate JSON object
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd !== -1) {
    const objectText = cleaned.substring(objectStart, objectEnd + 1);
    return JSON.parse(objectText);
  }

  throw new Error("AI did not return a valid JSON response.");
};

/**
 * Evaluates a student's answer for a single question using Ollama.
 */
const evaluateAnswer = async ({
  question,
  studentAnswer,
  difficulty,
  maxMarks,
  studyMaterialText
}) => {
  try {
    const cleanAnswer = (studentAnswer || "").trim();

    if (!cleanAnswer) {
      return {
        score: 0,
        maxScore: maxMarks,
        status: "NO_ANSWER",
        correct: false,
        feedback: "No answer was provided by the student.",
        matchedConcepts: [],
        missingConcepts: ["All expected concepts"]
      };
    }

    const prompt = `
You are VivaPartner's university viva examiner and answer evaluator.
Evaluate the student's answer for the following question.

QUESTION INFORMATION:
- Question: "${question}"
- Difficulty: "${difficulty}"
- Maximum Marks: ${maxMarks}

STUDENT ANSWER:
"${cleanAnswer}"

REFERENCE STUDY MATERIAL (Context/Concepts source):
------------------------------------
${(studyMaterialText || "Use general computer science and academic knowledge.").substring(0, 10000)}
------------------------------------

INSTRUCTIONS:
1. Determine how well the student explained the concept or answered the question.
2. Compare the meaning and concepts of the student's answer to the expected answer/concepts in the reference study material or general subject knowledge.
3. Award partial marks out of the Maximum Marks (${maxMarks}) based on concept coverage.
4. Set status to one of: "CORRECT" (fully correct/almost fully correct), "PARTIALLY_CORRECT" (some details present), "INCORRECT" (wrong/unrelated answer), "UNCLEAR" (mumbled/gibberish answer).
5. Output matched concepts (key points they mentioned) and missing concepts (key points they missed).
6. Return a professional, student-friendly feedback string.
7. Return valid JSON only. Do not include markdown code fences, do not return explanations outside JSON.

Return exactly this JSON structure:
{
  "score": 4,
  "maxScore": ${maxMarks},
  "status": "PARTIALLY_CORRECT",
  "correct": false,
  "feedback": "The student explained the main concept correctly but missed...",
  "matchedConcepts": ["concept A", "concept B"],
  "missingConcepts": ["concept C"]
}
`;

    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: OLLAMA_MODEL,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
        messages: [
          {
            role: "system",
            content: "You are an academic evaluator. You assess student answers and return JSON results."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        timeout: 120000,
        headers: { "Content-Type": "application/json" }
      }
    );

    const aiContent = response?.data?.message?.content;
    const result = cleanAIResponse(aiContent);

    // Validate score boundaries
    if (typeof result.score !== "number" || isNaN(result.score)) {
      result.score = 0;
    }
    if (result.score > maxMarks) {
      result.score = maxMarks;
    }
    if (result.score < 0) {
      result.score = 0;
    }

    result.maxScore = maxMarks;
    result.correct = result.score >= maxMarks * 0.8;

    return result;
  } catch (error) {
    console.error("AI Evaluation Single Question Error:", error.message);
    // Return a safe fallback evaluation if AI fails so the request doesn't crash
    return {
      score: 0,
      maxScore: maxMarks,
      status: "UNCLEAR",
      correct: false,
      feedback: "AI Evaluation failed. Please review manually.",
      matchedConcepts: [],
      missingConcepts: ["Evaluation System Timeout/Error"]
    };
  }
};

/**
 * Evaluates the entire VivaAttempt (all questions)
 */
const evaluateVivaAttempt = async (attemptId) => {
  const VivaAttempt = require("../models/VivaAttempt");
  const VivaSession = require("../models/VivaSession");
  const Student = require("../models/Student");

  try {
    const attempt = await VivaAttempt.findById(attemptId);
    if (!attempt) {
      throw new Error("Viva Attempt not found");
    }

    const session = await VivaSession.findById(attempt.vivaSession);
    if (!session) {
      throw new Error("Viva Session not found");
    }

    // Load study material
    const studyMaterial = await StudyMaterial.findOne({ vivaSession: session._id });
    const studyMaterialText = studyMaterial ? studyMaterial.extractedText : "";

    const totalQuestions = session.numberOfQuestions || attempt.answers.length || 5;
    const maxMarksPerQuestion = (session.totalMarks || 20) / totalQuestions;

    let accumulatedScore = 0;
    const evaluatedAnswers = [];

    for (const ans of attempt.answers) {
      const evaluation = await evaluateAnswer({
        question: ans.question,
        studentAnswer: ans.transcript,
        difficulty: session.difficulty || "Medium",
        maxMarks: maxMarksPerQuestion,
        studyMaterialText
      });

      ans.score = evaluation.score;
      ans.maxScore = evaluation.maxScore;
      ans.status = evaluation.status;
      ans.feedback = evaluation.feedback;
      ans.matchedConcepts = evaluation.matchedConcepts;
      ans.missingConcepts = evaluation.missingConcepts;

      accumulatedScore += evaluation.score;
    }

    attempt.totalMarks = Math.round(accumulatedScore * 10) / 10;
    attempt.evaluated = true;
    attempt.status = "Completed";
    await attempt.save();

    // Also update Student marks and status
    const student = await Student.findById(attempt.student);
    if (student) {
      student.marks = attempt.totalMarks;
      student.vivaStatus = "Completed";
      await student.save();
    }

    return attempt;
  } catch (error) {
    console.error("AI Complete Evaluation Error:", error);
    throw error;
  }
};

module.exports = {
  evaluateAnswer,
  evaluateVivaAttempt
};
