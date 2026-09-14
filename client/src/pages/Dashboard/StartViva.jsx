import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVivaConfiguration } from "../../services/vivaConfigurationApi";
import "./StartViva.css";

const StartViva = () => {
  const navigate = useNavigate();

  // ================================
  // Class
  // ================================

  const [selectedClass, setSelectedClass] = useState(null);

  // ================================
  // Feedback & Saving State
  // ================================

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // ================================
  // Modal
  // ================================

  const [showModal, setShowModal] = useState(false);

  // ================================
  // 8.2 Target Students (Option A vs Option B)
  // ================================

  const [studentSelectionMode, setStudentSelectionMode] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState([]);

  // ================================
  // 8.3 Students Per Viva
  // ================================

  const [studentsPerViva, setStudentsPerViva] = useState(1);

  // ================================
  // 8.4 Number Of Questions
  // ================================

  const [numberOfQuestions, setNumberOfQuestions] = useState(10);

  // ================================
  // 8.5 Difficulty
  // ================================

  const [difficulty, setDifficulty] = useState("Medium");

  // ================================
  // 8.6 Question Type
  // ================================

  const [questionType, setQuestionType] = useState("Mixed");

  // ================================
  // 8.7 Time Limit
  // ================================

  const [timeLimit, setTimeLimit] = useState(5);

  // ================================
  // 8.8 Total Marks
  // ================================

  const [totalMarks, setTotalMarks] = useState(20);

  // ================================
  // 8.9 Language
  // ================================

  const [language, setLanguage] = useState("English");

  // ================================
  // 8.10 Viva Rules
  // ================================

  const [randomQuestions, setRandomQuestions] = useState(true);
  const [noRepeatedQuestions, setNoRepeatedQuestions] = useState(true);
  const [allowSkip, setAllowSkip] = useState(true);
  const [followUpQuestions, setFollowUpQuestions] = useState(true);
  const [hintMode, setHintMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  // ================================
  // 8.11 AI Settings
  // ================================

  const [voice, setVoice] = useState("Female");
  const [speechSpeed, setSpeechSpeed] = useState("Normal");
  const [aiPersonality, setAiPersonality] = useState("Professional");

  // ================================
  // Load Selected Class & Students
  // ================================

  useEffect(() => {
    const storedClass = localStorage.getItem("selectedClass");

    if (!storedClass) {
      navigate("/teacher/assigned-classes");
      return;
    }

    try {
      const parsedClass = JSON.parse(storedClass);
      setSelectedClass(parsedClass);
    } catch (error) {
      console.error("Failed to read selected class:", error);
      localStorage.removeItem("selectedClass");
      navigate("/teacher/assigned-classes");
      return;
    }

    // Load selected students if any were chosen from StudentManagement
    const storedStudents = localStorage.getItem("selectedStudents");
    if (storedStudents) {
      try {
        const parsedStudents = JSON.parse(storedStudents);
        if (Array.isArray(parsedStudents) && parsedStudents.length > 0) {
          setSelectedStudents(parsedStudents);
          setStudentSelectionMode("selected");
        }
      } catch (err) {
        console.error("Failed to parse selectedStudents:", err);
      }
    }
  }, [navigate]);

  // ================================
  // Load Existing Configuration
  // ================================

  useEffect(() => {
    const storedConfig = localStorage.getItem("vivaConfig");
    if (!storedConfig) return;

    try {
      const config = JSON.parse(storedConfig);

      if (config.studentSelectionMode) {
        setStudentSelectionMode(config.studentSelectionMode);
      }

      if (Array.isArray(config.selectedStudents) && config.selectedStudents.length > 0) {
        setSelectedStudents(config.selectedStudents);
      }

      if (config.studentsPerViva) {
        setStudentsPerViva(Number(config.studentsPerViva));
      }

      if (config.numberOfQuestions) {
        setNumberOfQuestions(Number(config.numberOfQuestions));
      }

      if (config.difficulty) {
        setDifficulty(config.difficulty);
      }

      if (config.questionType) {
        setQuestionType(config.questionType);
      }

      if (config.timeLimit) {
        setTimeLimit(Number(config.timeLimit));
      }

      if (config.totalMarks) {
        setTotalMarks(Number(config.totalMarks));
      }

      if (config.language) {
        setLanguage(config.language);
      }

      // 8.10 Rules
      if (typeof config.randomQuestions === "boolean") {
        setRandomQuestions(config.randomQuestions);
      }
      if (typeof config.noRepeatedQuestions === "boolean") {
        setNoRepeatedQuestions(config.noRepeatedQuestions);
      }
      if (typeof config.allowSkip === "boolean") {
        setAllowSkip(config.allowSkip);
      }
      if (typeof config.followUpQuestions === "boolean") {
        setFollowUpQuestions(config.followUpQuestions);
      }
      if (typeof config.hintMode === "boolean") {
        setHintMode(config.hintMode);
      }
      if (typeof config.autoSave === "boolean") {
        setAutoSave(config.autoSave);
      }

      // 8.11 AI Settings
      if (config.voice) setVoice(config.voice);
      if (config.speechSpeed) setSpeechSpeed(config.speechSpeed);
      if (config.aiPersonality) setAiPersonality(config.aiPersonality);
    } catch (error) {
      console.error("Failed to load Viva configuration:", error);
    }
  }, []);

  // Remove individual student from selection
  const handleRemoveStudent = (studentId) => {
    setSelectedStudents((prev) => {
      const updated = prev.filter((s) => (s._id || s) !== studentId);
      if (updated.length === 0) {
        setStudentSelectionMode("all");
      }
      localStorage.setItem("selectedStudents", JSON.stringify(updated));
      return updated;
    });
  };

  // ================================
  // Validate Configuration
  // ================================

  const validateConfiguration = () => {
    setError("");

    if (!selectedClass) {
      setError("Please select an assigned class first.");
      return false;
    }

    if (studentSelectionMode === "selected" && selectedStudents.length === 0) {
      setError(
        "Option A (Specific Students) is selected, but no students are selected. Please select at least one student or choose Option B (Entire Class)."
      );
      return false;
    }

    if (!numberOfQuestions || Number(numberOfQuestions) < 1) {
      setError("Number of questions must be at least 1.");
      return false;
    }

    if (!timeLimit || Number(timeLimit) < 1) {
      setError("Time limit must be at least 1 minute.");
      return false;
    }

    if (!totalMarks || Number(totalMarks) < 1) {
      setError("Total marks must be greater than 0.");
      return false;
    }

    return true;
  };

  // ================================
  // Get Configuration Payload
  // ================================

  const getPayload = () => {
    const studentIds = selectedStudents
      .map((s) => (typeof s === "object" ? s._id : s))
      .filter(Boolean);

    const assignmentId = selectedClass?._id;
    const classId =
      selectedClass?.class?._id ||
      selectedClass?.classId ||
      selectedClass?.class;

    return {
      assignmentId,
      classId,
      studentSelectionMode,
      selectedStudents: studentSelectionMode === "selected" ? studentIds : [],
      students: studentSelectionMode === "selected" ? studentIds : [],
      studentsPerViva,
      numberOfQuestions: Number(numberOfQuestions),
      difficulty,
      questionType,
      timeLimit: Number(timeLimit),
      timeType: "perStudent",
      totalMarks: Number(totalMarks),
      language,
      rules: {
        randomQuestions,
        noRepeatedQuestions,
        allowSkip,
        followUpQuestions,
        hintMode,
        autoSave,
      },
      aiSettings: {
        voice,
        speechSpeed,
        personality: aiPersonality,
      },
    };
  };

  // ================================
  // Save Configuration (Draft / Persist)
  // ================================

  const handleSaveConfiguration = async () => {
    if (!validateConfiguration()) {
      return false;
    }

    try {
      setSaving(true);
      setError("");

      const payload = getPayload();
      const response = await createVivaConfiguration(payload);

      const configId =
        response?.configuration?._id ||
        response?.data?.configuration?._id;

      const storedConfig = {
        ...payload,
        vivaConfigurationId: configId,
        _id: configId,
        className: selectedClass?.class?.name || "",
        subject: selectedClass?.subject?.name || "",
        department: selectedClass?.department?.name || "",
        semester: selectedClass?.class?.semester || "",
        selectedStudents,
      };

      localStorage.setItem("vivaConfig", JSON.stringify(storedConfig));

      setSuccessMessage("✓ Viva configuration saved successfully.");
      setTimeout(() => setSuccessMessage(""), 3500);

      return true;
    } catch (err) {
      console.error("Save Viva Configuration Error:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save viva configuration."
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // Open Confirmation Modal
  // ================================

  const handleOpenConfirm = () => {
    if (!validateConfiguration()) {
      return;
    }
    setShowModal(true);
  };

  // ================================
  // Save & Continue to Study Material (Phase 9)
  // ================================

  const handleSaveAndContinue = async () => {
    const success = await handleSaveConfiguration();
    if (success) {
      setShowModal(false);
      navigate("/teacher/study-material");
    }
  };

  // ================================
  // Loading
  // ================================

  if (!selectedClass) {
    return (
      <div className="start-viva-loading">
        Loading Viva Configuration...
      </div>
    );
  }

  // ================================
  // JSX
  // ================================

  return (
    <div className="start-viva-page">
      <div className="start-viva-card">

        {/* =========================
            Header
        ========================== */}

        <div className="start-viva-header">
          <span className="configuration-badge">
            VIVA CONFIGURATION
          </span>

          <h1>
            Configure Viva Session
          </h1>

          <p className="subtitle">
            Configure all settings required
            before starting the AI viva
            examination.
          </p>
        </div>

        {/* =========================
            Class Information
        ========================== */}

        <div className="section-title">
          <h2>Selected Class</h2>

          <p>
            The viva will be conducted for
            this assigned class.
          </p>
        </div>

        <div className="details-grid">

          <div className="detail-box">
            <span>Class</span>

            <h3>
              {selectedClass.class?.name ||
                "N/A"}
            </h3>
          </div>

          <div className="detail-box">
            <span>Department</span>

            <h3>
              {selectedClass.department?.name ||
                "N/A"}
            </h3>
          </div>

          <div className="detail-box">
            <span>Subject</span>

            <h3>
              {selectedClass.subject?.name ||
                "N/A"}
            </h3>
          </div>

          <div className="detail-box">
            <span>Semester</span>

            <h3>
              {selectedClass.class?.semester ||
                "N/A"}
            </h3>
          </div>

          <div className="detail-box">
            <span>Academic Year</span>

            <h3>
              {selectedClass.class
                ?.academicYear ||
                selectedClass.academicYear ||
                "N/A"}
            </h3>
          </div>

          <div className="detail-box">
            <span>Status</span>

            <h3>
              {selectedClass.status ||
                "Active"}
            </h3>
          </div>

        </div>

        {/* =========================
            Configuration
        ========================== */}

        <div className="configuration-section">

          {/* =========================
              8.3 Students Per Viva
          ========================== */}

          <div className="section-title">
            <h2>
              Students Per Viva
            </h2>

            <p>
              Select how many students
              participate in one viva.
            </p>
          </div>

          <div className="question-options">

            {[
              {
                value: 1,
                title: "Individual",
                description:
                  "One student per viva",
              },
              {
                value: 2,
                title: "Pair",
                description:
                  "Two students per viva",
              },
              {
                value: 3,
                title: "Group of 3",
                description:
                  "Three students per viva",
              },
              {
                value: 4,
                title: "Group of 4",
                description:
                  "Four students per viva",
              },
            ].map((option) => (
              <label
                key={option.value}
                className={`question-option ${studentsPerViva ===
                    option.value
                    ? "selected"
                    : ""
                  }`}
              >
                <input
                  type="radio"
                  name="studentsPerViva"
                  value={option.value}
                  checked={
                    studentsPerViva ===
                    option.value
                  }
                  onChange={() =>
                    setStudentsPerViva(
                      option.value
                    )
                  }
                />

                <div>
                  <strong>
                    {option.title}
                  </strong>

                  <span>
                    {option.description}
                  </span>
                </div>
              </label>
            ))}

          </div>

          {/* =========================
              8.4 Number Of Questions
          ========================== */}

          <div className="config-control">
            <div className="section-title">
              <h2>
                Number of Questions
              </h2>

              <p>
                Select how many questions
                the AI should ask.
              </p>
            </div>

            <select
              value={numberOfQuestions}
              onChange={(e) =>
                setNumberOfQuestions(
                  Number(e.target.value)
                )
              }
            >
              <option value={5}>
                5 Questions
              </option>

              <option value={10}>
                10 Questions
              </option>

              <option value={15}>
                15 Questions
              </option>

              <option value={20}>
                20 Questions
              </option>
            </select>
          </div>

          {/* =========================
              8.5 Difficulty
          ========================== */}

          <div className="config-control">

            <div className="section-title">
              <h2>
                Difficulty Level
              </h2>

              <p>
                Choose the difficulty of
                generated questions.
              </p>
            </div>

            <div className="difficulty-options">

              {[
                {
                  value: "Easy",
                  description:
                    "Basic questions focused on fundamental concepts.",
                },
                {
                  value: "Medium",
                  description:
                    "Balanced questions testing understanding and application.",
                },
                {
                  value: "Hard",
                  description:
                    "Advanced questions requiring deeper knowledge.",
                },
                {
                  value: "Mixed",
                  description:
                    "Combination of easy, medium and hard questions.",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`difficulty-option ${difficulty ===
                      option.value
                      ? "selected"
                      : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={option.value}
                    checked={
                      difficulty ===
                      option.value
                    }
                    onChange={() =>
                      setDifficulty(
                        option.value
                      )
                    }
                  />

                  <div className="difficulty-content">
                    <strong>
                      {option.value}
                    </strong>

                    <span>
                      {option.description}
                    </span>
                  </div>
                </label>
              ))}

            </div>

            <div className="selected-difficulty-info">

              <div className="difficulty-icon">
                {difficulty
                  .substring(0, 1)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {difficulty} Difficulty
                </strong>

                <p>
                  AI will generate questions
                  according to this difficulty
                  level.
                </p>
              </div>

            </div>

          </div>

          {/* =========================
              8.6 Question Type
          ========================== */}

          <div className="config-control">

            <div className="section-title">
              <h2>
                Question Type
              </h2>

              <p>
                Select the type of questions
                the AI should generate.
              </p>
            </div>

            <div className="question-type-options">

              {[
                {
                  value: "Theory",
                  description:
                    "Conceptual and theoretical questions.",
                },
                {
                  value: "Practical",
                  description:
                    "Questions based on practical implementation.",
                },
                {
                  value: "Conceptual",
                  description:
                    "Questions focused on understanding concepts.",
                },
                {
                  value: "Programming",
                  description:
                    "Programming and coding related questions.",
                },
                {
                  value: "Mixed",
                  description:
                    "Combination of different question types.",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`question-type-option ${questionType ===
                      option.value
                      ? "selected"
                      : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="questionType"
                    value={option.value}
                    checked={
                      questionType ===
                      option.value
                    }
                    onChange={() =>
                      setQuestionType(
                        option.value
                      )
                    }
                  />

                  <div>
                    <strong>
                      {option.value}
                    </strong>

                    <span>
                      {option.description}
                    </span>
                  </div>
                </label>
              ))}

            </div>

          </div>

          {/* =========================
              8.7 Time Limit
          ========================== */}

          <div className="config-control">

            <div className="section-title">
              <h2>
                Time Per Student
              </h2>

              <p>
                Set the maximum time allowed
                for each student.
              </p>
            </div>

            <select
              value={timeLimit}
              onChange={(e) =>
                setTimeLimit(
                  Number(e.target.value)
                )
              }
            >
              <option value={2}>
                2 Minutes
              </option>

              <option value={5}>
                5 Minutes
              </option>

              <option value={10}>
                10 Minutes
              </option>
            </select>

          </div>

          {/* =========================
              8.8 Total Marks
          ========================== */}

          <div className="config-control">

            <div className="section-title">
              <h2>
                Total Marks
              </h2>

              <p>
                Set the maximum marks for
                this viva.
              </p>
            </div>

            <div className="marks-options">

              {[20, 30, 50, 100].map(
                (marks) => (
                  <label
                    key={marks}
                    className={`marks-option ${totalMarks === marks
                        ? "selected"
                        : ""
                      }`}
                  >
                    <input
                      type="radio"
                      name="totalMarks"
                      value={marks}
                      checked={
                        totalMarks === marks
                      }
                      onChange={() =>
                        setTotalMarks(
                          marks
                        )
                      }
                    />

                    <span>
                      {marks}
                    </span>
                  </label>
                )
              )}

            </div>

          </div>

          {/* =========================
              8.9 Language
          ========================== */}

          <div className="config-control">

            <div className="section-title">
              <h2>
                Language
              </h2>

              <p>
                Select the language used
                during the AI viva.
              </p>
            </div>

            <div className="language-options">

              {[
                "English",
                "Gujarati",
                "Hindi",
              ].map((item) => (
                <label
                  key={item}
                  className={`language-option ${language === item
                      ? "selected"
                      : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={item}
                    checked={
                      language === item
                    }
                    onChange={() =>
                      setLanguage(item)
                    }
                  />

                  <span>
                    {item}
                  </span>
                </label>
              ))}

            </div>

          </div>

          {/* =========================
              8.10 Viva Rules
          ========================== */}

          <div className="config-control">

            <div className="section-title">
              <h2>
                Viva Rules
              </h2>

              <p>
                Configure how the AI should
                conduct the viva.
              </p>
            </div>

            <div className="rules-grid">

              <label className="rule-option">
                <input
                  type="checkbox"
                  checked={
                    randomQuestions
                  }
                  onChange={(e) =>
                    setRandomQuestions(
                      e.target.checked
                    )
                  }
                />

                <div>
                  <strong>
                    Random Questions
                  </strong>

                  <span>
                    Randomize questions for
                    every viva.
                  </span>
                </div>
              </label>

              <label className="rule-option">
                <input
                  type="checkbox"
                  checked={
                    noRepeatedQuestions
                  }
                  onChange={(e) =>
                    setNoRepeatedQuestions(
                      e.target.checked
                    )
                  }
                />

                <div>
                  <strong>
                    No Repeated Questions
                  </strong>

                  <span>
                    Avoid asking the same
                    question again.
                  </span>
                </div>
              </label>

              <label className="rule-option">
                <input
                  type="checkbox"
                  checked={allowSkip}
                  onChange={(e) =>
                    setAllowSkip(
                      e.target.checked
                    )
                  }
                />

                <div>
                  <strong>
                    Allow Skip
                  </strong>

                  <span>
                    Allow students to skip
                    difficult questions.
                  </span>
                </div>
              </label>

              <label className="rule-option">
                <input
                  type="checkbox"
                  checked={
                    followUpQuestions
                  }
                  onChange={(e) =>
                    setFollowUpQuestions(
                      e.target.checked
                    )
                  }
                />

                <div>
                  <strong>
                    Follow-up Questions
                  </strong>

                  <span>
                    AI can ask follow-up
                    questions.
                  </span>
                </div>
              </label>

              <label className="rule-option">
                <input
                  type="checkbox"
                  checked={hintMode}
                  onChange={(e) =>
                    setHintMode(
                      e.target.checked
                    )
                  }
                />

                <div>
                  <strong>
                    Hint Mode
                  </strong>

                  <span>
                    Allow AI to provide hints.
                  </span>
                </div>
              </label>

              <label className="rule-option">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) =>
                    setAutoSave(
                      e.target.checked
                    )
                  }
                />

                <div>
                  <strong>
                    Auto Save
                  </strong>

                  <span>
                    Automatically save viva
                    progress.
                  </span>
                </div>
              </label>

            </div>

          </div>

          {/* =========================
              8.11 AI Settings
          ========================== */}

          <div className="config-control ai-settings-section">

            <div className="section-title">
              <h2>
                AI Settings
              </h2>

              <p>
                Configure the voice and
                personality of the AI during
                the viva.
              </p>
            </div>

            {/* Voice */}

            <div className="ai-setting-group">

              <h3>Voice</h3>

              <p>
                Select the AI voice used to
                ask questions.
              </p>

              <div className="ai-options">

                {[
                  "Male",
                  "Female",
                ].map((item) => (
                  <label
                    key={item}
                    className={`ai-option ${voice === item
                        ? "selected"
                        : ""
                      }`}
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={item}
                      checked={
                        voice === item
                      }
                      onChange={() =>
                        setVoice(item)
                      }
                    />

                    <div>
                      <strong>
                        {item}
                      </strong>

                      <span>
                        {item} AI voice
                      </span>
                    </div>
                  </label>
                ))}

              </div>

            </div>

            {/* Speech Speed */}

            <div className="ai-setting-group">

              <h3>
                Speech Speed
              </h3>

              <p>
                Control how quickly the AI
                speaks during the viva.
              </p>

              <div className="ai-options">

                {[
                  {
                    value: "Slow",
                    description:
                      "AI speaks slowly and clearly.",
                  },
                  {
                    value: "Normal",
                    description:
                      "Standard speaking speed.",
                  },
                  {
                    value: "Fast",
                    description:
                      "AI speaks at a faster speed.",
                  },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`ai-option ${speechSpeed ===
                        item.value
                        ? "selected"
                        : ""
                      }`}
                  >
                    <input
                      type="radio"
                      name="speechSpeed"
                      value={item.value}
                      checked={
                        speechSpeed ===
                        item.value
                      }
                      onChange={() =>
                        setSpeechSpeed(
                          item.value
                        )
                      }
                    />

                    <div>
                      <strong>
                        {item.value}
                      </strong>

                      <span>
                        {item.description}
                      </span>
                    </div>
                  </label>
                ))}

              </div>

            </div>

            {/* AI Personality */}

            <div className="ai-setting-group">

              <h3>
                AI Personality
              </h3>

              <p>
                Choose how the AI interacts
                with students.
              </p>

              <div className="ai-options">

                {[
                  {
                    value:
                      "Professional",
                    description:
                      "Formal and examination-focused.",
                  },
                  {
                    value: "Friendly",
                    description:
                      "Friendly and comfortable interaction.",
                  },
                  {
                    value: "Strict",
                    description:
                      "Strict and examination-oriented.",
                  },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`ai-option ${aiPersonality ===
                        item.value
                        ? "selected"
                        : ""
                      }`}
                  >
                    <input
                      type="radio"
                      name="aiPersonality"
                      value={item.value}
                      checked={
                        aiPersonality ===
                        item.value
                      }
                      onChange={() =>
                        setAiPersonality(
                          item.value
                        )
                      }
                    />

                    <div>
                      <strong>
                        {item.value}
                      </strong>

                      <span>
                        {item.description}
                      </span>
                    </div>
                  </label>
                ))}

              </div>

            </div>

            {/* Selected AI Settings */}

            <div className="selected-ai-info">

              <div className="ai-icon">
                AI
              </div>

              <div>
                <strong>
                  Current AI Configuration
                </strong>

                <p>
                  {voice} voice •{" "}
                  {speechSpeed} speech •{" "}
                  {aiPersonality} personality
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* =========================
            Warning
        ========================== */}

        <div className="warning-box">

          <strong>
            ⚠ Important
          </strong>

          <p>
            These settings will be used by
            the AI question generator,
            voice assistant and evaluation
            system during this viva session.
          </p>

        </div>

        {/* =========================
            Actions
        ========================== */}

        <div className="actions">

          <button
            className="cancel-btn"
            onClick={() =>
              navigate(
                "/teacher/assigned-classes"
              )
            }
            disabled={saving}
          >
            ← Cancel
          </button>

          <button
            className="start-btn"
            onClick={handleOpenConfirm}
            disabled={saving}
          >
            Save & Continue →
          </button>

        </div>

      </div>

      {/* =========================
          Confirmation Modal
      ========================== */}

      {showModal && (
        <div className="modal-overlay">

          <div className="modal">

            <h2>
              Confirm Viva Configuration
            </h2>

            <p>
              Please review your configuration
              before continuing.
            </p>

            <div className="confirmation-list">

              <div>
                <span>
                  Class
                </span>

                <strong>
                  {selectedClass.class?.name ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>
                  Students / Viva
                </span>

                <strong>
                  {studentsPerViva}
                </strong>
              </div>

              <div>
                <span>
                  Questions
                </span>

                <strong>
                  {numberOfQuestions}
                </strong>
              </div>

              <div>
                <span>
                  Difficulty
                </span>

                <strong>
                  {difficulty}
                </strong>
              </div>

              <div>
                <span>
                  Question Type
                </span>

                <strong>
                  {questionType}
                </strong>
              </div>

              <div>
                <span>
                  Time
                </span>

                <strong>
                  {timeLimit} Minutes
                </strong>
              </div>

              <div>
                <span>
                  Total Marks
                </span>

                <strong>
                  {totalMarks}
                </strong>
              </div>

              <div>
                <span>
                  Language
                </span>

                <strong>
                  {language}
                </strong>
              </div>

              <div>
                <span>
                  AI Voice
                </span>

                <strong>
                  {voice}
                </strong>
              </div>

              <div>
                <span>
                  Speech Speed
                </span>

                <strong>
                  {speechSpeed}
                </strong>
              </div>

              <div>
                <span>
                  AI Personality
                </span>

                <strong>
                  {aiPersonality}
                </strong>
              </div>

            </div>

            <div className="modal-actions">

              <button
                className="cancel-btn"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={saving}
              >
                Back
              </button>

              <button
                className="start-btn"
                onClick={
                  handleSaveAndContinue
                }
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Configuration →"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default StartViva; 