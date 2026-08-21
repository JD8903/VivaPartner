import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import {
  getPublicVivaSession,
  joinPublicViva,
  startPublicViva,
  getCurrentVivaQuestion,
  saveStudentAnswer,
  nextVivaQuestion,
  completePublicViva,
} from "../../services/publicVivaApi";

const StudentViva = () => {
  const { sessionId } = useParams();

  // =====================================================
  // BASIC STATES
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [joining, setJoining] =
    useState(false);

  const [starting, setStarting] =
    useState(false);

  const [questionLoading, setQuestionLoading] =
    useState(false);

  const [savingAnswer, setSavingAnswer] =
    useState(false);

  const [movingNext, setMovingNext] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  // =====================================================
  // DATA
  // =====================================================

  const [session, setSession] =
    useState(null);

  const [student, setStudent] =
    useState(null);

  const [attempt, setAttempt] =
    useState(null);

  const [currentQuestion, setCurrentQuestion] =
    useState(null);

  // =====================================================
  // VIVA STATE
  // =====================================================

  const [vivaStarted, setVivaStarted] =
    useState(false);

  const [vivaCompleted, setVivaCompleted] =
    useState(false);

  const [answerSaved, setAnswerSaved] =
    useState(false);

  // =====================================================
  // JOIN
  // =====================================================

  const [enrollmentNumber, setEnrollmentNumber] =
    useState("");

  // =====================================================
  // ERRORS
  // =====================================================

  const [error, setError] =
    useState("");

  // =====================================================
  // SPEECH RECOGNITION
  // =====================================================

  const [isListening, setIsListening] =
    useState(false);

  const [transcript, setTranscript] =
    useState("");

  const [interimTranscript, setInterimTranscript] =
    useState("");

  const [speechSupported, setSpeechSupported] =
    useState(true);

  const recognitionRef =
    useRef(null);

  // =====================================================
  // TEXT TO SPEECH
  // =====================================================

  const [ttsSupported, setTtsSupported] =
    useState(true);

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  // =====================================================
  // LOAD SESSION
  // =====================================================

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // =====================================================
  // SPEECH RECOGNITION SETUP
  // =====================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.lang =
      getSpeechLanguage(
        session?.language
      );

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let temporaryText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i];

        const text =
          result[0].transcript;

        if (result.isFinal) {
          finalText +=
            text + " ";
        } else {
          temporaryText +=
            text;
        }
      }

      if (finalText) {
        setTranscript(
          (previous) =>
            `${previous} ${finalText}`
              .replace(/\s+/g, " ")
              .trim()
        );
      }

      setInterimTranscript(
        temporaryText
      );
    };

    recognition.onerror = (
      event
    ) => {
      console.error(
        "Speech Recognition Error:",
        event.error
      );

      setIsListening(false);

      if (
        event.error ===
        "not-allowed"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (
        event.error ===
        "no-speech"
      ) {
        setError(
          "No speech was detected. Please speak clearly."
        );
      } else if (
        event.error ===
        "audio-capture"
      ) {
        setError(
          "No microphone was detected. Please check your microphone."
        );
      } else {
        setError(
          "Speech recognition could not start. Please try again."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        // Already stopped.
      }

      recognitionRef.current =
        null;
    };
  }, [session?.language]);

  // =====================================================
  // TTS SUPPORT
  // =====================================================

  useEffect(() => {
    if (
      !("speechSynthesis" in window)
    ) {
      setTtsSupported(false);
    }
  }, []);

  // =====================================================
  // LOAD SESSION
  // =====================================================

  const loadSession = async () => {
    try {
      setLoading(true);
      setError("");

      if (!sessionId) {
        setError(
          "Invalid Viva link."
        );
        return;
      }

      const response =
        await getPublicVivaSession(
          sessionId
        );

      if (
        !response?.success ||
        !response?.session
      ) {
        setError(
          response?.message ||
            "Unable to load Viva Session."
        );
        return;
      }

      setSession(
        response.session
      );

      // =================================================
      // RESTORE STUDENT
      // =================================================

      const savedStudent =
        JSON.parse(
          sessionStorage.getItem(
            `vivaStudent_${sessionId}`
          ) || "null"
        );

      const savedAttempt =
        JSON.parse(
          sessionStorage.getItem(
            `vivaAttempt_${sessionId}`
          ) || "null"
        );

      const savedCompleted =
        sessionStorage.getItem(
          `vivaCompleted_${sessionId}`
        );

      if (savedStudent) {
        setStudent(
          savedStudent
        );
      }

      if (savedAttempt) {
        setAttempt(
          savedAttempt
        );
      }

      if (
        savedCompleted ===
        "true"
      ) {
        setVivaCompleted(
          true
        );
      }
    } catch (err) {
      console.error(
        "Load Viva Session Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load Viva Session."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD CURRENT QUESTION
  // =====================================================

  const loadCurrentQuestion = async (
    activeAttempt = attempt
  ) => {
    try {
      if (
        !activeAttempt?.attemptId
      ) {
        setError(
          "Viva attempt was not found."
        );
        return;
      }

      setQuestionLoading(true);
      setError("");
      setAnswerSaved(false);

      stopListening();
      stopQuestionSpeech();

      const response =
        await getCurrentVivaQuestion(
          sessionId,
          activeAttempt.attemptId
        );

      if (
        !response?.success
      ) {
        setError(
          response?.message ||
            "Unable to load question."
        );
        return;
      }

      if (
        response.completed
      ) {
        setCurrentQuestion(
          null
        );

        setVivaStarted(
          false
        );

        return;
      }

      setCurrentQuestion(
        response.question
      );

      setTranscript("");
      setInterimTranscript("");

      setVivaStarted(
        true
      );

      // =================================================
      // 10.7.4 AI TTS
      // =================================================

      setTimeout(() => {
        speakQuestion(
          response.question?.question
        );
      }, 250);
    } catch (err) {
      console.error(
        "Load Current Question Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load current question."
      );
    } finally {
      setQuestionLoading(
        false
      );
    }
  };

  // =====================================================
  // JOIN VIVA
  // =====================================================

  const handleJoin = async (
    e
  ) => {
    e.preventDefault();

    if (
      !enrollmentNumber.trim()
    ) {
      setError(
        "Please enter your enrollment number."
      );
      return;
    }

    try {
      setJoining(true);
      setError("");

      const response =
        await joinPublicViva(
          sessionId,
          enrollmentNumber
        );

      if (
        !response?.success
      ) {
        setError(
          response?.message ||
            "Unable to join Viva."
        );
        return;
      }

      const studentData =
        response.student;

      const attemptData =
        response.attempt;

      setStudent(
        studentData
      );

      setAttempt(
        attemptData
      );

      sessionStorage.setItem(
        `vivaStudent_${sessionId}`,
        JSON.stringify(
          studentData
        )
      );

      sessionStorage.setItem(
        `vivaAttempt_${sessionId}`,
        JSON.stringify(
          attemptData
        )
      );
    } catch (err) {
      console.error(
        "Join Viva Error:",
        err
      );

      setError(
        err.message ||
          "Unable to join Viva."
      );
    } finally {
      setJoining(false);
    }
  };

  // =====================================================
  // START VIVA
  // =====================================================

  const handleStart = async () => {
    if (
      !attempt?.attemptId
    ) {
      setError(
        "Viva attempt was not found. Please join again."
      );
      return;
    }

    try {
      setStarting(true);
      setError("");

      const response =
        await startPublicViva(
          sessionId,
          attempt.attemptId
        );

      if (
        !response?.success
      ) {
        setError(
          response?.message ||
            "Unable to start Viva."
        );
        return;
      }

      const updatedAttempt =
        response.attempt;

      setAttempt(
        updatedAttempt
      );

      sessionStorage.setItem(
        `vivaAttempt_${sessionId}`,
        JSON.stringify(
          updatedAttempt
        )
      );

      await loadCurrentQuestion(
        updatedAttempt
      );
    } catch (err) {
      console.error(
        "Start Viva Error:",
        err
      );

      setError(
        err.message ||
          "Unable to start Viva."
      );
    } finally {
      setStarting(false);
    }
  };

  // =====================================================
  // RESTORE ACTIVE ATTEMPT
  // =====================================================

  useEffect(() => {
    if (
      attempt?.status ===
        "Active" &&
      session?.status ===
        "Active" &&
      !vivaCompleted
    ) {
      loadCurrentQuestion(
        attempt
      );
    }
  }, [
    attempt?.attemptId,
    attempt?.status,
    session?.status,
  ]);

  // =====================================================
  // START MICROPHONE
  // =====================================================

  const startListening = () => {
    setError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(
        false
      );

      setError(
        "Speech recognition is not supported. Please use Google Chrome or Microsoft Edge."
      );

      return;
    }

    if (
      !recognitionRef.current
    ) {
      setError(
        "Speech recognition is not ready. Please refresh the page."
      );
      return;
    }

    if (isListening) {
      return;
    }

    setTranscript("");
    setInterimTranscript("");

    recognitionRef.current.lang =
      getSpeechLanguage(
        session?.language
      );

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error(
        "Start microphone error:",
        error
      );

      setError(
        "Microphone could not be started. Please try again."
      );
    }
  };

  // =====================================================
  // STOP MICROPHONE
  // =====================================================

  const stopListening = () => {
    if (
      !recognitionRef.current
    ) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error(
        "Stop microphone error:",
        error
      );
    }

    setIsListening(false);
    setInterimTranscript("");
  };

  // =====================================================
  // CLEAR ANSWER
  // =====================================================

  const clearAnswer = () => {
    stopListening();

    setTranscript("");
    setInterimTranscript("");
    setError("");
    setAnswerSaved(false);
  };

  // =====================================================
  // 10.7.4
  // TEXT TO SPEECH
  // =====================================================

  const speakQuestion = (
    text
  ) => {
    if (
      !text ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          text
        );

      utterance.lang =
        getSpeechLanguage(
          session?.language
        );

      utterance.rate =
        getSpeechRate(
          session?.aiSettings
            ?.speechSpeed
        );

      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsSpeaking(
          true
        );
      };

      utterance.onend = () => {
        setIsSpeaking(
          false
        );
      };

      utterance.onerror = () => {
        setIsSpeaking(
          false
        );
      };

      window.speechSynthesis.speak(
        utterance
      );
    } catch (error) {
      console.error(
        "TTS Error:",
        error
      );

      setIsSpeaking(false);
    }
  };

  const stopQuestionSpeech =
    () => {
      if (
        "speechSynthesis" in
        window
      ) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(false);
    };

  // =====================================================
  // 10.7.5
  // SAVE ANSWER
  // =====================================================

  const handleSaveAnswer =
    async () => {
      if (
        !attempt?.attemptId
      ) {
        setError(
          "Viva attempt was not found."
        );
        return false;
      }

      if (
        !currentQuestion
      ) {
        setError(
          "Current question was not found."
        );
        return false;
      }

      const finalTranscript =
        `${transcript} ${interimTranscript}`
          .replace(/\s+/g, " ")
          .trim();

      if (!finalTranscript) {
        setError(
          "Please answer the question before continuing."
        );
        return false;
      }

      try {
        setSavingAnswer(
          true
        );
        setError("");

        stopListening();

        const response =
          await saveStudentAnswer(
            sessionId,
            attempt.attemptId,
            {
              questionId:
                currentQuestion.id,

              questionNumber:
                currentQuestion.questionNumber,

              question:
                currentQuestion.question,

              transcript:
                finalTranscript,
            }
          );

        if (
          !response?.success
        ) {
          setError(
            response?.message ||
              "Unable to save your answer."
          );

          return false;
        }

        setAnswerSaved(
          true
        );

        return true;
      } catch (err) {
        console.error(
          "Save Answer Error:",
          err
        );

        setError(
          err.message ||
            "Unable to save your answer."
        );

        return false;
      } finally {
        setSavingAnswer(
          false
        );
      }
    };

  // =====================================================
  // 10.7.6
  // NEXT QUESTION
  // =====================================================

  const handleNextQuestion =
    async () => {
      if (
        savingAnswer ||
        movingNext ||
        completing
      ) {
        return;
      }

      try {
        setMovingNext(true);
        setError("");

        // -----------------------------------------------
        // Save answer first
        // -----------------------------------------------

        const saved =
          answerSaved
            ? true
            : await handleSaveAnswer();

        if (!saved) {
          return;
        }

        stopListening();
        stopQuestionSpeech();

        // -----------------------------------------------
        // Last question?
        // -----------------------------------------------

        const isLastQuestion =
          currentQuestion?.questionNumber >=
          currentQuestion?.totalQuestions;

        if (isLastQuestion) {
          await handleCompleteViva();
          return;
        }

        // -----------------------------------------------
        // Ask backend for next question
        // -----------------------------------------------

        const response =
          await nextVivaQuestion(
            sessionId,
            attempt.attemptId
          );

        if (
          !response?.success
        ) {
          setError(
            response?.message ||
              "Unable to load next question."
          );
          return;
        }

        if (
          response.completed
        ) {
          await handleCompleteViva();
          return;
        }

        // -----------------------------------------------
        // Update current question
        // -----------------------------------------------

        setCurrentQuestion(
          response.question
        );

        setTranscript("");
        setInterimTranscript("");
        setAnswerSaved(
          false
        );

        // -----------------------------------------------
        // Update local attempt
        // -----------------------------------------------

        const updatedAttempt = {
          ...attempt,
          currentQuestionIndex:
            response.question
              .questionNumber - 1,
        };

        setAttempt(
          updatedAttempt
        );

        sessionStorage.setItem(
          `vivaAttempt_${sessionId}`,
          JSON.stringify(
            updatedAttempt
          )
        );

        // -----------------------------------------------
        // Read next question
        // -----------------------------------------------

        setTimeout(() => {
          speakQuestion(
            response.question
              ?.question
          );
        }, 250);
      } catch (err) {
        console.error(
          "Next Question Error:",
          err
        );

        setError(
          err.message ||
            "Unable to move to next question."
        );
      } finally {
        setMovingNext(false);
      }
    };

  // =====================================================
  // 10.7.7
  // COMPLETE VIVA
  // =====================================================

  const handleCompleteViva =
    async () => {
      if (
        !attempt?.attemptId
      ) {
        setError(
          "Viva attempt was not found."
        );
        return;
      }

      try {
        setCompleting(true);
        setError("");

        stopListening();
        stopQuestionSpeech();

        // -----------------------------------------------
        // If final answer hasn't been saved yet
        // -----------------------------------------------

        if (!answerSaved) {
          const saved =
            await handleSaveAnswer();

          if (!saved) {
            return;
          }
        }

        // -----------------------------------------------
        // Complete backend attempt
        // -----------------------------------------------

        const response =
          await completePublicViva(
            sessionId,
            attempt.attemptId
          );

        if (
          !response?.success
        ) {
          setError(
            response?.message ||
              "Unable to complete Viva."
          );
          return;
        }

        // -----------------------------------------------
        // Local completed state
        // -----------------------------------------------

        const completedAttempt = {
          ...attempt,
          status:
            "Completed",
        };

        setAttempt(
          completedAttempt
        );

        setVivaCompleted(
          true
        );

        setVivaStarted(
          false
        );

        setCurrentQuestion(
          null
        );

        sessionStorage.setItem(
          `vivaAttempt_${sessionId}`,
          JSON.stringify(
            completedAttempt
          )
        );

        sessionStorage.setItem(
          `vivaCompleted_${sessionId}`,
          "true"
        );
      } catch (err) {
        console.error(
          "Complete Viva Error:",
          err
        );

        setError(
          err.message ||
            "Unable to complete Viva."
        );
      } finally {
        setCompleting(false);
      }
    };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={styles.centerPage}>
        <div style={styles.card}>
          <div
            style={styles.loader}
          >
            ⏳
          </div>

          <h2>
            Loading Viva...
          </h2>

          <p
            style={styles.muted}
          >
            Please wait while we
            verify your Viva session.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // SESSION ERROR
  // =====================================================

  if (
    error &&
    !session
  ) {
    return (
      <div
        style={
          styles.centerPage
        }
      >
        <div
          style={styles.card}
        >
          <div
            style={
              styles.errorIcon
            }
          >
            ⚠️
          </div>

          <h2>
            Viva Unavailable
          </h2>

          <p
            style={
              styles.errorText
            }
          >
            {error}
          </p>

          <button
            onClick={
              loadSession
            }
            style={
              styles.primaryButton
            }
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div style={styles.page}>
      <div
        style={styles.container}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={styles.header}
        >
          <div>
            <div
              style={styles.logo}
            >
              VivaPartner
            </div>

            <h1
              style={styles.title}
            >
              AI Voice Viva
            </h1>

            <p
              style={styles.subtitle}
            >
              Online Viva Examination
            </p>
          </div>

          <div
            style={styles.status}
          >
            ●{" "}
            {vivaCompleted
              ? "Completed"
              : session?.status}
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={
              styles.errorBox
            }
          >
            ⚠️ {error}
          </div>
        )}

        {/* =================================================
            COMPLETION
        ================================================= */}

        {vivaCompleted && (
          <div
            style={
              styles.card
            }
          >
            <div
              style={
                styles.successIcon
              }
            >
              ✓
            </div>

            <h2>
              Viva Completed
              Successfully
            </h2>

            <p
              style={styles.muted}
            >
              Thank you,{" "}
              {student?.name ||
                "Student"}.
            </p>

            <div
              style={
                styles.completionBox
              }
            >
              <strong>
                Your Viva has been
                submitted.
              </strong>

              <p>
                Your answers have been
                recorded successfully.
              </p>

              <p>
                Marks will be evaluated
                and handled by the
                teacher.
              </p>

              <strong>
                🔒 Your marks are not
                displayed here.
              </strong>
            </div>
          </div>
        )}

        {/* =================================================
            STUDENT JOIN
        ================================================= */}

        {!vivaCompleted &&
          !student &&
          !attempt && (
            <div
              style={styles.card}
            >
              <div
                style={styles.icon}
              >
                🎓
              </div>

              <h2>
                Welcome to Your Viva
              </h2>

              <p
                style={styles.muted}
              >
                Enter your enrollment
                number to continue.
              </p>

              <div
                style={
                  styles.sessionInfo
                }
              >
                <Info
                  label="Class"
                  value={
                    session?.class
                      ?.name || "—"
                  }
                />

                <Info
                  label="Subject"
                  value={
                    session?.subject
                      ?.name || "—"
                  }
                />

                <Info
                  label="Questions"
                  value={
                    session?.numberOfQuestions ||
                    "—"
                  }
                />

                <Info
                  label="Difficulty"
                  value={
                    session?.difficulty ||
                    "—"
                  }
                />

                <Info
                  label="Language"
                  value={
                    session?.language ||
                    "English"
                  }
                />
              </div>

              <form
                onSubmit={
                  handleJoin
                }
              >
                <label
                  style={
                    styles.label
                  }
                >
                  Enrollment Number
                </label>

                <input
                  type="text"
                  value={
                    enrollmentNumber
                  }
                  onChange={(e) =>
                    setEnrollmentNumber(
                      e.target.value
                    )
                  }
                  placeholder="Enter enrollment number"
                  autoComplete="off"
                  style={
                    styles.input
                  }
                />

                <button
                  type="submit"
                  disabled={joining}
                  style={{
                    ...styles.primaryButton,
                    opacity:
                      joining
                        ? 0.7
                        : 1,
                  }}
                >
                  {joining
                    ? "Joining..."
                    : "Continue →"}
                </button>
              </form>

              <p
                style={
                  styles.securityText
                }
              >
                🔒 Your marks will not
                be displayed during
                the Viva.
              </p>
            </div>
          )}

        {/* =================================================
            STUDENT READY
        ================================================= */}

        {!vivaCompleted &&
          student &&
          attempt &&
          !vivaStarted && (
            <div
              style={styles.card}
            >
              <div
                style={
                  styles.successIcon
                }
              >
                ✓
              </div>

              <h2>
                Welcome,{" "}
                {student.name ||
                  "Student"}
              </h2>

              <p
                style={styles.muted}
              >
                Your identity has
                been verified.
              </p>

              <div
                style={
                  styles.studentBox
                }
              >
                <Info
                  label="Student"
                  value={
                    student.name ||
                    "—"
                  }
                />

                <Info
                  label="Enrollment Number"
                  value={
                    student.enrollmentNumber ||
                    enrollmentNumber ||
                    "—"
                  }
                />

                <Info
                  label="Viva Status"
                  value={
                    attempt.status ||
                    "NotStarted"
                  }
                />
              </div>

              <div
                style={
                  styles.instructions
                }
              >
                <h3>
                  Before you start
                </h3>

                <ul>
                  <li>
                    Use a quiet place.
                  </li>

                  <li>
                    Allow microphone
                    access.
                  </li>

                  <li>
                    Answer clearly
                    and verbally.
                  </li>

                  <li>
                    Do not refresh the
                    page during your
                    Viva.
                  </li>

                  <li>
                    Your marks will
                    remain hidden.
                  </li>
                </ul>
              </div>

              {!speechSupported && (
                <div
                  style={
                    styles.warningBox
                  }
                >
                  ⚠️ Your browser does
                  not support Speech
                  Recognition.
                  Please use Google
                  Chrome or Microsoft
                  Edge.
                </div>
              )}

              {!ttsSupported && (
                <div
                  style={
                    styles.warningBox
                  }
                >
                  ⚠️ Text-to-speech is
                  not supported in
                  this browser.
                </div>
              )}

              <button
                onClick={
                  handleStart
                }
                disabled={
                  starting
                }
                style={{
                  ...styles.startButton,
                  opacity:
                    starting
                      ? 0.7
                      : 1,
                }}
              >
                {starting
                  ? "Starting Viva..."
                  : "🎙 Start Viva"}
              </button>
            </div>
          )}

        {/* =================================================
            CURRENT QUESTION
        ================================================= */}

        {!vivaCompleted &&
          vivaStarted && (
            <div
              style={
                styles.questionCard
              }
            >
              {questionLoading ? (
                <div
                  style={
                    styles.questionLoading
                  }
                >
                  <div
                    style={
                      styles.loader
                    }
                  >
                    ⏳
                  </div>

                  <h2>
                    Loading Question...
                  </h2>

                  <p
                    style={
                      styles.muted
                    }
                  >
                    Preparing your
                    next Viva question.
                  </p>
                </div>
              ) : currentQuestion ? (
                <>
                  {/* QUESTION HEADER */}

                  <div
                    style={
                      styles.questionHeader
                    }
                  >
                    <span>
                      Question{" "}
                      {
                        currentQuestion.questionNumber
                      }
                    </span>

                    <span>
                      {
                        currentQuestion.questionNumber
                      }{" "}
                      /{" "}
                      {
                        currentQuestion.totalQuestions
                      }
                    </span>
                  </div>

                  {/* QUESTION */}

                  <div
                    style={
                      styles.questionBody
                    }
                  >
                    <div
                      style={
                        styles.questionBadge
                      }
                    >
                      {
                        currentQuestion.difficulty
                      }
                    </div>

                    <h2
                      style={
                        styles.questionText
                      }
                    >
                      {
                        currentQuestion.question
                      }
                    </h2>

                    <div
                      style={
                        styles.ttsControls
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          speakQuestion(
                            currentQuestion.question
                          )
                        }
                        disabled={
                          isSpeaking
                        }
                        style={
                          styles.speakButton
                        }
                      >
                        🔊{" "}
                        {isSpeaking
                          ? "Speaking..."
                          : "Ask Question Again"}
                      </button>

                      {isSpeaking && (
                        <button
                          type="button"
                          onClick={
                            stopQuestionSpeech
                          }
                          style={
                            styles.stopSpeakButton
                          }
                        >
                          ⏹ Stop
                        </button>
                      )}
                    </div>
                  </div>

                  {/* =================================================
                      MICROPHONE
                  ================================================= */}

                  <div
                    style={
                      styles.microphoneCard
                    }
                  >
                    <div
                      style={
                        styles.microphoneTitle
                      }
                    >
                      🎙 Your Answer
                    </div>

                    {!speechSupported ? (
                      <div
                        style={
                          styles.warningBox
                        }
                      >
                        Speech recognition is
                        not supported in this
                        browser.
                        <br />
                        Please use Google
                        Chrome or Microsoft
                        Edge.
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            ...styles.micStatus,
                            ...(isListening
                              ? styles.micListening
                              : {}),
                          }}
                        >
                          <span
                            style={
                              styles.micIcon
                            }
                          >
                            {isListening
                              ? "🔴"
                              : "🎙️"}
                          </span>

                          <div>
                            <strong>
                              {isListening
                                ? "Listening..."
                                : "Microphone Ready"}
                            </strong>

                            <small>
                              {isListening
                                ? " Speak your answer clearly."
                                : " Click Start Answer to speak."}
                            </small>
                          </div>
                        </div>

                        <div
                          style={
                            styles.answerBox
                          }
                        >
                          {transcript ||
                          interimTranscript ? (
                            <>
                              <span>
                                {
                                  transcript
                                }
                              </span>

                              {interimTranscript && (
                                <span
                                  style={
                                    styles.interim
                                  }
                                >
                                  {" "}
                                  {
                                    interimTranscript
                                  }
                                </span>
                              )}
                            </>
                          ) : (
                            <span
                              style={
                                styles.placeholder
                              }
                            >
                              Your spoken
                              answer will
                              appear here...
                            </span>
                          )}
                        </div>

                        {/* MICROPHONE BUTTONS */}

                        <div
                          style={
                            styles.microphoneButtons
                          }
                        >
                          {!isListening ? (
                            <button
                              type="button"
                              onClick={
                                startListening
                              }
                              disabled={
                                savingAnswer ||
                                movingNext ||
                                completing
                              }
                              style={
                                styles.startMicButton
                              }
                            >
                              🎙 Start Answer
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={
                                stopListening
                              }
                              style={
                                styles.stopMicButton
                              }
                            >
                              ⏹ Stop Answer
                            </button>
                          )}

                          {transcript && (
                            <button
                              type="button"
                              onClick={
                                clearAnswer
                              }
                              style={
                                styles.clearButton
                              }
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* =================================================
                      ANSWER STATUS
                  ================================================= */}

                  {answerSaved && (
                    <div
                      style={
                        styles.savedBox
                      }
                    >
                      ✓ Answer saved
                      successfully.
                    </div>
                  )}

                  {/* =================================================
                      ACTION BUTTONS
                  ================================================= */}

                  <div
                    style={
                      styles.actionButtons
                    }
                  >
                    <button
                      type="button"
                      onClick={
                        handleSaveAnswer
                      }
                      disabled={
                        savingAnswer ||
                        answerSaved ||
                        !transcript.trim()
                      }
                      style={{
                        ...styles.saveButton,
                        opacity:
                          savingAnswer ||
                          answerSaved
                            ? 0.6
                            : 1,
                      }}
                    >
                      {savingAnswer
                        ? "Saving..."
                        : answerSaved
                        ? "✓ Answer Saved"
                        : "💾 Save Answer"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleNextQuestion
                      }
                      disabled={
                        savingAnswer ||
                        movingNext ||
                        completing
                      }
                      style={{
                        ...styles.nextButton,
                        opacity:
                          movingNext ||
                          completing
                            ? 0.6
                            : 1,
                      }}
                    >
                      {movingNext
                        ? "Loading..."
                        : currentQuestion.questionNumber >=
                          currentQuestion.totalQuestions
                        ? "✓ Complete Viva"
                        : "Next Question →"}
                    </button>
                  </div>

                  <p
                    style={
                      styles.securityText
                    }
                  >
                    🔒 Your answer is securely
                    stored. Marks are hidden
                    from students.
                  </p>
                </>
              ) : (
                <div
                  style={
                    styles.completedBox
                  }
                >
                  ✓ Viva questions
                  completed.
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

// =====================================================
// SPEECH LANGUAGE
// =====================================================

const getSpeechLanguage = (
  language
) => {
  switch (language) {
    case "Gujarati":
      return "gu-IN";

    case "Hindi":
      return "hi-IN";

    case "English":
    default:
      return "en-IN";
  }
};

// =====================================================
// TTS SPEED
// =====================================================

const getSpeechRate = (
  speed
) => {
  switch (speed) {
    case "Slow":
      return 0.8;

    case "Fast":
      return 1.15;

    case "Normal":
    default:
      return 1;
  }
};

// =====================================================
// INFO COMPONENT
// =====================================================

const Info = ({
  label,
  value,
}) => {
  return (
    <div
      style={
        styles.infoItem
      }
    >
      <span
        style={
          styles.infoLabel
        }
      >
        {label}
      </span>

      <strong
        style={
          styles.infoValue
        }
      >
        {value}
      </strong>
    </div>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc, #eef2ff)",
    padding: "30px 20px",
    boxSizing: "border-box",
  },

  centerPage: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc, #eef2ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "30px",
  },

  logo: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "8px",
    color: "#64748b",
  },

  status: {
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "35px",
    boxShadow:
      "0 15px 40px rgba(15, 23, 42, 0.08)",
    border:
      "1px solid #e2e8f0",
  },

  icon: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    marginBottom: "20px",
  },

  successIcon: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "20px",
  },

  errorIcon: {
    fontSize: "45px",
    marginBottom: "15px",
  },

  muted: {
    color: "#64748b",
    lineHeight: "1.6",
  },

  sessionInfo: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    margin: "25px 0",
  },

  studentBox: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    margin: "25px 0",
  },

  infoItem: {
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px",
  },

  infoLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "5px",
  },

  infoValue: {
    color: "#0f172a",
    wordBreak: "break-word",
  },

  label: {
    display: "block",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: "10px",
    border:
      "1px solid #cbd5e1",
    outline: "none",
    fontSize: "16px",
    marginBottom: "15px",
  },

  primaryButton: {
    width: "100%",
    padding: "14px 20px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  startButton: {
    width: "100%",
    padding: "16px 20px",
    border: "none",
    borderRadius: "10px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "700",
    cursor: "pointer",
  },

  securityText: {
    textAlign: "center",
    marginTop: "18px",
    fontSize: "13px",
    color: "#64748b",
  },

  instructions: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "25px",
    color: "#475569",
  },

  completedBox: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "700",
  },

  completionBox: {
    marginTop: "25px",
    padding: "20px",
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    lineHeight: "1.7",
    color: "#334155",
  },

  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border:
      "1px solid #fecaca",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  errorText: {
    color: "#b91c1c",
    lineHeight: "1.6",
    marginBottom: "20px",
  },

  warningBox: {
    background: "#fffbeb",
    color: "#92400e",
    border:
      "1px solid #fde68a",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
    lineHeight: "1.5",
  },

  loader: {
    fontSize: "40px",
    marginBottom: "15px",
  },

  questionCard: {
    marginTop: "25px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "30px",
    boxShadow:
      "0 15px 40px rgba(15, 23, 42, 0.08)",
    border:
      "1px solid #e2e8f0",
  },

  questionLoading: {
    textAlign: "center",
    padding: "30px",
  },

  questionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "25px",
    color: "#64748b",
    fontWeight: "700",
  },

  questionBody: {
    background: "#f8fafc",
    borderRadius: "15px",
    padding: "25px",
  },

  questionBadge: {
    display: "inline-block",
    background: "#2563eb",
    color: "#ffffff",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "15px",
  },

  questionText: {
    margin: 0,
    color: "#0f172a",
    lineHeight: "1.6",
    fontSize: "22px",
  },

  ttsControls: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    flexWrap: "wrap",
  },

  speakButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#7c3aed",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  stopSpeakButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  microphoneCard: {
    marginTop: "25px",
    padding: "22px",
    background: "#f8fafc",
    borderRadius: "15px",
    border:
      "1px solid #e2e8f0",
  },

  microphoneTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "15px",
  },

  micStatus: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "#ffffff",
    borderRadius: "12px",
    border:
      "1px solid #e2e8f0",
    marginBottom: "15px",
  },

  micListening: {
    border:
      "1px solid #fca5a5",
    background: "#fff7f7",
  },

  micIcon: {
    fontSize: "25px",
  },

  answerBox: {
    minHeight: "120px",
    padding: "18px",
    background: "#ffffff",
    border:
      "1px solid #cbd5e1",
    borderRadius: "12px",
    color: "#334155",
    lineHeight: "1.7",
    fontSize: "16px",
    boxSizing: "border-box",
  },

  placeholder: {
    color: "#94a3b8",
  },

  interim: {
    color: "#94a3b8",
    fontStyle: "italic",
  },

  microphoneButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
    flexWrap: "wrap",
  },

  startMicButton: {
    flex: 1,
    minWidth: "180px",
    padding: "14px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  stopMicButton: {
    flex: 1,
    minWidth: "180px",
    padding: "14px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  clearButton: {
    padding: "14px 18px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#475569",
    fontWeight: "700",
    cursor: "pointer",
  },

  savedBox: {
    marginTop: "18px",
    padding: "13px 15px",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#166534",
    border:
      "1px solid #bbf7d0",
    fontWeight: "700",
    textAlign: "center",
  },

  actionButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap",
  },

  saveButton: {
    flex: 1,
    minWidth: "180px",
    padding: "15px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#0f766e",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  nextButton: {
    flex: 1,
    minWidth: "180px",
    padding: "15px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default StudentViva;