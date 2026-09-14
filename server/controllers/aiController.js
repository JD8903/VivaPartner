const axios = require("axios");

// ======================================================
// Ollama Configuration
// ======================================================

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "llama3.1:8b";

// Maximum content sent to the model.
// Keeps very large documents from breaking the request.
const MAX_CONTENT_LENGTH = 60000;

// ======================================================
// Helper: Clean AI JSON
// ======================================================

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

  // Try to locate JSON object.
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd !== -1) {
    const objectText = cleaned.substring(
      objectStart,
      objectEnd + 1
    );

    try {
      return JSON.parse(objectText);
    } catch (error) {
      // Continue to array parsing.
    }
  }

  // Try to locate JSON array.
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");

  if (arrayStart !== -1 && arrayEnd !== -1) {
    const arrayText = cleaned.substring(
      arrayStart,
      arrayEnd + 1
    );

    try {
      return {
        questions: JSON.parse(arrayText),
      };
    } catch (error) {
      throw new Error(
        "AI returned invalid JSON."
      );
    }
  }

  throw new Error(
    "AI did not return a valid JSON response."
  );
};

// ======================================================
// Helper: Normalize Questions
// ======================================================

const normalizeQuestions = (
  rawQuestions,
  difficulty,
  questionCount
) => {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  const normalized = rawQuestions
    .map((item) => {
      if (typeof item === "string") {
        return {
          question: item.trim(),
          difficulty,
        };
      }

      return {
        question:
          typeof item?.question === "string"
            ? item.question.trim()
            : "",

        difficulty:
          typeof item?.difficulty === "string"
            ? item.difficulty
            : difficulty,
      };
    })
    .filter(
      (item) =>
        item.question &&
        item.question.length >= 5
    );

  // Remove duplicate questions.
  const uniqueQuestions = [];

  const seen = new Set();

  for (const item of normalized) {
    const key = item.question
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(item);
    }
  }

  // Limit to requested number.
  return uniqueQuestions
    .slice(0, questionCount)
    .map((item, index) => ({
      id: index + 1,
      question: item.question,
      difficulty,
    }));
};

// ======================================================
// Grounded Semantic Question Generator (Fallback)
// Generates questions strictly based on currentContent
// ======================================================

const generateGroundedQuestions = (
  studyContent,
  topic,
  difficulty,
  count
) => {
  const words = studyContent.match(/\b[A-Za-z0-9_-]{4,}\b/g) || [];
  const freq = {};
  const stopWords = new Set([
    "this", "that", "with", "from", "have", "were", "what", "which",
    "there", "their", "about", "could", "would", "should", "other",
    "these", "those", "using", "being", "under", "after", "before",
    "study", "material", "topic", "current"
  ]);

  words.forEach((w) => {
    const lw = w.toLowerCase();
    if (!stopWords.has(lw) && isNaN(lw)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const sortedTerms = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const primaryTopic = topic || sortedTerms[0] || "the provided subject material";
  const terms = sortedTerms.length > 0 ? sortedTerms.slice(0, 25) : [primaryTopic];

  const questionTemplates = {
    Easy: [
      (t) => `Define ${t} and explain its primary objective as presented in the study material.`,
      (t) => `What are the core characteristics and fundamental components of ${t}?`,
      (t) => `Explain the basic concept and role of ${t} in this domain.`,
      (t) => `List the main features and standard use cases of ${t}.`,
    ],
    Medium: [
      (t) => `How does ${t} operate in practice, and what is its working mechanism?`,
      (t) => `Explain the implementation process and key operational steps for ${t}.`,
      (t) => `What are the advantages, trade-offs, and limitations associated with ${t}?`,
      (t) => `Describe how ${t} interacts with other related components discussed in the material.`,
    ],
    Hard: [
      (t) => `Critically analyze the architectural decisions, edge cases, and failure modes of ${t}.`,
      (t) => `Compare and contrast ${t} with alternative techniques described in the text.`,
      (t) => `How would you diagnose performance bottlenecks and optimize ${t} in a production environment?`,
      (t) => `Evaluate the security, fault-tolerance, and scalability considerations when employing ${t}.`,
    ],
  };

  const getDiffForIndex = (i, total, diffSetting) => {
    if (diffSetting === "Mixed") {
      if (i < Math.ceil(total * 0.35)) return "Easy";
      if (i < Math.ceil(total * 0.70)) return "Medium";
      return "Hard";
    }
    return diffSetting;
  };

  const generated = [];
  for (let i = 0; i < count; i++) {
    const diff = getDiffForIndex(i, count, difficulty);
    const targetTerm = terms[i % terms.length];
    const templates = questionTemplates[diff] || questionTemplates.Medium;
    const template = templates[i % templates.length];
    generated.push({
      id: i + 1,
      question: template(targetTerm),
      difficulty: diff,
    });
  }

  return generated;
};

// ======================================================
// POST /api/ai/generate-questions
// ======================================================

const generateQuestions = async (req, res) => {
  try {
    const {
      studyContent,
      difficulty = "Medium",
      questionCount = 10,
      topic = "",
      materialType = "",
      fileName = "",
    } = req.body;

    // ==================================================
    // Validate Request
    // ==================================================

    if (
      !studyContent ||
      typeof studyContent !== "string" ||
      !studyContent.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current study material content is required.",
      });
    }

    const allowedDifficulties = [
      "Easy",
      "Medium",
      "Hard",
      "Mixed",
    ];

    const selectedDifficulty =
      allowedDifficulties.includes(difficulty)
        ? difficulty
        : "Medium";

    const requestedCount = Number(questionCount);

    const safeQuestionCount =
      Number.isInteger(requestedCount) &&
      requestedCount >= 1 &&
      requestedCount <= 30
        ? requestedCount
        : 10;

    // ==================================================
    // IMPORTANT:
    // Only use CURRENT material supplied by frontend.
    // No old file/localStorage content is used here.
    // ==================================================

    let currentContent = studyContent.trim();

    if (
      currentContent.length >
      MAX_CONTENT_LENGTH
    ) {
      currentContent = currentContent.substring(
        0,
        MAX_CONTENT_LENGTH
      );
    }

    console.log(
      "\n=========================================="
    );

    console.log(
      "9.6 AI QUESTION GENERATION"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "Material:",
      fileName || "Topic"
    );

    console.log(
      "Type:",
      materialType || "Unknown"
    );

    console.log(
      "Topic:",
      topic || "None"
    );

    console.log(
      "Difficulty:",
      selectedDifficulty
    );

    console.log(
      "Question Count:",
      safeQuestionCount
    );

    console.log(
      "Current Content Length:",
      currentContent.length
    );

    console.log(
      "==========================================\n"
    );

    // ==================================================
    // AI PROMPT
    // ==================================================

    const prompt = `
You are VivaPartner's university viva question generator.

IMPORTANT:
The study material below is the ONLY source of knowledge you may use.

Do NOT use:
- Previous uploaded files
- Previous conversations
- Your own unrelated knowledge
- Examples from previous requests
- Internet knowledge
- Any old cached material

Generate questions ONLY from the CURRENT MATERIAL provided below.

CURRENT MATERIAL INFORMATION
--------------------------------
File Name:
${fileName || "Manual Topic"}

Material Type:
${materialType || "Unknown"}

Topic:
${topic || "Not provided"}

CURRENT STUDY MATERIAL
--------------------------------
${currentContent}
--------------------------------

TASK:

Generate exactly ${safeQuestionCount} viva questions.

Selected difficulty:
${selectedDifficulty}

STRICT RULES:
1. Every question MUST be based directly on the CURRENT STUDY MATERIAL.
2. Do not create questions from knowledge outside the material.
3. Do not use previous uploaded material.
4. Do not repeat questions.
5. Return JSON only with format: { "questions": [{ "question": "...", "difficulty": "..." }] }
`;

    // Check for Google Gemini API key
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const geminiResponse = await axios.post(
          geminiUrl,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          },
          { timeout: 30000 }
        );

        const rawText =
          geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          const parsed = cleanAIResponse(rawText);
          const rawQuestions = Array.isArray(parsed) ? parsed : parsed?.questions;
          const questions = normalizeQuestions(
            rawQuestions,
            selectedDifficulty,
            safeQuestionCount
          );

          if (questions.length > 0) {
            return res.status(200).json({
              success: true,
              source: "gemini",
              difficulty: selectedDifficulty,
              totalQuestions: questions.length,
              questions,
            });
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, attempting Ollama / fallback:", geminiError.message);
      }
    }

    // ==================================================
    // Call Ollama with Grounded Fallback
    // ==================================================

    let ollamaResponse = null;

    try {
      ollamaResponse = await axios.post(
        `${OLLAMA_URL}/api/chat`,
        {
          model: OLLAMA_MODEL,
          stream: false,
          format: "json",
          keep_alive: "10m",
          options: {
            temperature: 0.2,
            top_p: 0.9,
          },
          messages: [
            {
              role: "system",
              content:
                "You generate university viva questions strictly from the supplied study material. Return valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          timeout: 8000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (ollamaError) {
      console.warn(
        "Ollama unavailable or timed out. Utilizing grounded semantic generator from current study material."
      );

      // Fallback directly to content-grounded question generator
      const fallbackQuestions = generateGroundedQuestions(
        currentContent,
        topic,
        selectedDifficulty,
        safeQuestionCount
      );

      return res.status(200).json({
        success: true,
        source: "grounded_semantic",
        difficulty: selectedDifficulty,
        totalQuestions: fallbackQuestions.length,
        questions: fallbackQuestions,
      });
    }

    // ==================================================
    // Validate Ollama Response
    // ==================================================

    const aiContent =
      ollamaResponse?.data?.message?.content;

    if (
      !aiContent ||
      typeof aiContent !== "string"
    ) {
      console.error(
        "Invalid Ollama response:",
        ollamaResponse?.data
      );

      return res.status(502).json({
        success: false,
        code: "INVALID_AI_RESPONSE",
        message:
          "Ollama returned an empty or invalid response.",
      });
    }

    console.log(
      "\n========== OLLAMA RAW RESPONSE =========="
    );

    console.log(aiContent);

    console.log(
      "==========================================\n"
    );

    // ==================================================
    // Parse JSON
    // ==================================================

    let parsed;

    try {
      parsed = cleanAIResponse(
        aiContent
      );
    } catch (parseError) {
      console.error(
        "AI JSON parsing error:",
        parseError.message
      );

      return res.status(502).json({
        success: false,
        code: "INVALID_AI_JSON",
        message:
          "AI returned an invalid question format. Please try generating again.",
      });
    }

    // ==================================================
    // Get Questions
    // ==================================================

    const rawQuestions =
      Array.isArray(parsed)
        ? parsed
        : parsed?.questions;

    const questions =
      normalizeQuestions(
        rawQuestions,
        selectedDifficulty,
        safeQuestionCount
      );

    // ==================================================
    // Validate Question Count
    // ==================================================

    if (!questions.length) {
      return res.status(502).json({
        success: false,
        code: "NO_QUESTIONS",
        message:
          "AI could not generate valid questions from the current study material.",
      });
    }

    // ==================================================
    // Randomize
    // ==================================================

    for (
      let i = questions.length - 1;
      i > 0;
      i--
    ) {
      const j = Math.floor(
        Math.random() * (i + 1)
      );

      [
        questions[i],
        questions[j],
      ] = [
        questions[j],
        questions[i],
      ];
    }

    // Reassign IDs.
    const finalQuestions =
      questions.map(
        (question, index) => ({
          ...question,
          id: index + 1,
        })
      );

    // ==================================================
    // Success
    // ==================================================

    console.log(
      `Generated ${finalQuestions.length} questions successfully.`
    );

    return res.status(200).json({
      success: true,
      difficulty: selectedDifficulty,
      totalQuestions:
        finalQuestions.length,
      questions: finalQuestions,
    });
  } catch (error) {
    console.error(
      "\n========== AI CONTROLLER ERROR =========="
    );

    console.error(error);

    console.error(
      "==========================================\n"
    );

    return res.status(500).json({
      success: false,
      code: "AI_GENERATION_ERROR",
      message:
        error.message ||
        "Failed to generate viva questions.",
    });
  }
};

module.exports = {
  generateQuestions,
};