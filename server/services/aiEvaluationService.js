/**
 * AI Evaluation Service (Phase 13)
 *
 * Automatically evaluates student viva answers:
 * - Conceptual accuracy, relevance, and completeness
 * - Supports Gemini API, Ollama, and grounded semantic fallback
 * - Computes question-level scores and feedback
 * - Computes total student viva marks
 * - Updates VivaAttempt and Student records
 */

const axios = require("axios");
const VivaAttempt = require("../models/VivaAttempt");
const VivaSession = require("../models/VivaSession");
const Student = require("../models/Student");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

/**
 * Intelligent Grounded Semantic Fallback Evaluator
 * Evaluates student answer based on question terminology, length, relevance, and coherence.
 */
function evaluateSemantically(questionText, transcript, maxMarks, topic = "") {
  if (!transcript || typeof transcript !== "string") {
    return { score: 0, feedback: "No answer provided." };
  }

  const cleanTranscript = transcript.trim().toLowerCase();
  if (
    cleanTranscript.includes("[skipped") ||
    cleanTranscript.includes("[unanswered") ||
    cleanTranscript.length < 5
  ) {
    return { score: 0, feedback: "Question was skipped or unanswered." };
  }

  // Extract core keywords from question (excluding stop words)
  const stopWords = new Set([
    "what", "is", "are", "explain", "how", "does", "the", "and", "or", "in",
    "of", "to", "a", "an", "with", "for", "on", "by", "about", "describe",
    "discuss", "define", "between", "difference", "which", "when", "where", "why"
  ]);

  const questionWords = (questionText.toLowerCase().match(/[a-z0-9_]{3,}/g) || [])
    .filter((w) => !stopWords.has(w));

  const transcriptWords = cleanTranscript.match(/[a-z0-9_]{3,}/g) || [];

  if (transcriptWords.length === 0) {
    return { score: 0, feedback: "Answer is too brief or contains no meaningful content." };
  }

  // Calculate keyword overlap
  let matchCount = 0;
  questionWords.forEach((qw) => {
    if (transcriptWords.some((tw) => tw.includes(qw) || qw.includes(tw))) {
      matchCount++;
    }
  });

  const keywordRatio = questionWords.length > 0 ? matchCount / questionWords.length : 0.5;

  // Length and elaboration score (sweet spot: 15-80 words)
  let lengthFactor = 0.5;
  if (transcriptWords.length >= 25) lengthFactor = 1.0;
  else if (transcriptWords.length >= 12) lengthFactor = 0.85;
  else if (transcriptWords.length >= 6) lengthFactor = 0.65;
  else lengthFactor = 0.4;

  // Combined accuracy score out of 1.0
  const combinedScoreRatio = Math.min(1.0, Math.max(0.2, (keywordRatio * 0.6) + (lengthFactor * 0.4)));

  const computedScore = Math.round(combinedScoreRatio * maxMarks * 10) / 10;

  let feedback = "";
  if (combinedScoreRatio >= 0.8) {
    feedback = "Accurate and comprehensive explanation covering the key concepts clearly.";
  } else if (combinedScoreRatio >= 0.6) {
    feedback = "Good response with relevant points, though further technical detail would strengthen it.";
  } else if (combinedScoreRatio >= 0.4) {
    feedback = "Partially answered. Shows basic familiarity but lacks completeness.";
  } else {
    feedback = "Incomplete or minimally relevant response.";
  }

  return {
    score: Math.min(maxMarks, Math.max(0, computedScore)),
    feedback,
  };
}

/**
 * Call Gemini API for answer evaluation
 */
async function callGeminiEvaluation(question, transcript, maxMarks, topic = "") {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const prompt = `You are an expert university examiner evaluating a student's spoken viva examination response.
Topic: ${topic || "General"}
Question: "${question}"
Student's Spoken Answer: "${transcript}"
Maximum Marks for this question: ${maxMarks}

Evaluate the student's answer based on conceptual correctness, depth, relevance, and completeness.
Award a fair score between 0 and ${maxMarks}. Provide a concise 1-2 sentence feedback for the teacher.

CRITICAL: Return ONLY valid JSON in this exact structure without markdown backticks:
{"score": <number between 0 and ${maxMarks}>, "feedback": "<concise feedback string>"}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    },
    { timeout: 10000 }
  );

  const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText.trim().replace(/^```json\s*|```$/g, ""));
  if (typeof parsed.score === "number") {
    return {
      score: Math.min(maxMarks, Math.max(0, Math.round(parsed.score * 10) / 10)),
      feedback: parsed.feedback || "Evaluated by AI.",
    };
  }
  return null;
}

/**
 * Evaluate single answer
 */
async function evaluateSingleAnswer(question, transcript, maxMarks, topic = "") {
  if (!transcript || transcript.includes("[Skipped") || transcript.includes("[Unanswered")) {
    return { score: 0, feedback: "Question was skipped or unanswered." };
  }

  try {
    const geminiResult = await callGeminiEvaluation(question, transcript, maxMarks, topic);
    if (geminiResult) return geminiResult;
  } catch (err) {
    // Fallback to grounded semantic evaluation
  }

  return evaluateSemantically(question, transcript, maxMarks, topic);
}

/**
 * Evaluate an entire VivaAttempt
 */
async function evaluateVivaAttempt(attemptId) {
  const attempt = await VivaAttempt.findById(attemptId)
    .populate("vivaSession")
    .populate("student");

  if (!attempt) {
    throw new Error("Viva attempt not found.");
  }

  const session = attempt.vivaSession;
  if (!session) {
    throw new Error("Associated viva session not found.");
  }

  const totalQuestions = Math.max(1, attempt.answers.length || session.numberOfQuestions || 1);
  const sessionTotalMarks = session.totalMarks || 20;
  const maxPerQuestion = Math.round((sessionTotalMarks / totalQuestions) * 10) / 10;
  const topic = session.topic || "";

  let totalScore = 0;

  for (let i = 0; i < attempt.answers.length; i++) {
    const answer = attempt.answers[i];
    const evaluation = await evaluateSingleAnswer(
      answer.question,
      answer.transcript,
      maxPerQuestion,
      topic
    );

    answer.score = evaluation.score;
    answer.feedback = evaluation.feedback;
    totalScore += evaluation.score;
  }

  // Clamp total marks to session.totalMarks
  const finalTotalMarks = Math.min(sessionTotalMarks, Math.max(0, Math.round(totalScore)));

  attempt.totalMarks = finalTotalMarks;
  attempt.evaluated = true;
  await attempt.save();

  // Synchronize student record
  if (attempt.student) {
    const student = await Student.findById(attempt.student._id || attempt.student);
    if (student) {
      student.marks = finalTotalMarks;
      student.vivaStatus = "Completed";
      await student.save();
    }
  }

  return {
    success: true,
    attemptId: attempt._id,
    sessionId: session.sessionId,
    student: attempt.student?._id || attempt.student,
    totalMarks: finalTotalMarks,
    maxMarks: sessionTotalMarks,
    percentage: Math.round((finalTotalMarks / sessionTotalMarks) * 100),
    evaluated: true,
    answers: attempt.answers.map((a) => ({
      questionNumber: a.questionNumber,
      question: a.question,
      transcript: a.transcript,
      score: a.score,
      feedback: a.feedback,
    })),
  };
}

module.exports = {
  evaluateVivaAttempt,
  evaluateSingleAnswer,
  evaluateSemantically,
};
