import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getPublicVivaSession,
  joinPublicViva,
  startPublicViva,
  getCurrentVivaQuestion,
  submitPublicVivaAnswer,
} from "../../services/publicVivaApi";

const StudentViva = () => {
  const { sessionId } = useParams();

  // =====================================================
  // SESSION / ATTEMPT STATES
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const [vivaStarted, setVivaStarted] = useState(false);

  const [enrollmentNumber, setEnrollmentNumber] =
    useState("");

  const [error, setError] = useState("");

  // =====================================================
  // 10.7.3 SPEECH RECOGNITION
  // =====================================================

  const [isListening, setIsListening] = useState(false);

  // =====================================================
  // 11.5 VOICE ANSWER UI STATE
  // =====================================================

  const [isSubmittingAnswer, setIsSubmittingAnswer] =
    useState(false);

  const [answerCaptured, setAnswerCaptured] =
    useState(false);

  const [voiceUiError, setVoiceUiError] =
    useState("");

  // =====================================================
  // 11.6 QUESTION -> SPEAK -> LISTEN FLOW
  // =====================================================

  const voiceCycleRef = useRef(0);
  const submissionLockRef = useRef(false);


  const [transcript, setTranscript] =
    useState("");

  const [interimTranscript, setInterimTranscript] =
    useState("");

  // =====================================================
  // 11.4 FINAL TRANSCRIPT / VALIDATION
  // =====================================================

  const finalTranscriptRef = useRef("");

  const [answerValidationError, setAnswerValidationError] =
    useState("");

  const [speechSupported, setSpeechSupported] =
    useState(true);

  const recognitionRef = useRef(null);

  // =====================================================
  // 10.7.4 TEXT TO SPEECH
  // =====================================================

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [speechFinished, setSpeechFinished] =
    useState(false);

  const [ttsSupported, setTtsSupported] =
    useState(true);

  // =====================================================
  // 11.2 TEXT-TO-SPEECH CONTROL
  // =====================================================
  const speechUtteranceRef = useRef(null);
  const speechRequestRef = useRef(0);

  // =====================================================
  // LOAD SESSION
  // =====================================================

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // =====================================================
  // 11.3 MICROPHONE / SPEECH RECOGNITION
  // =====================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      recognitionRef.current = null;
      return undefined;
    }

    setSpeechSupported(true);

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
      setAnswerValidationError("");
    };

    // =====================================================
    // 11.4 SPEECH-TO-TEXT RESULT HANDLING
    // =====================================================

    recognition.onresult = (event) => {
      let finalText = "";
      let temporaryText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];
        const text =
          result?.[0]?.transcript || "";

        if (result.isFinal) {
          finalText += `${text} `;
        } else {
          temporaryText += text;
        }
      }

      // Final transcript is permanently accumulated.
      if (finalText.trim()) {
        finalTranscriptRef.current =
          `${finalTranscriptRef.current} ${finalText}`
            .replace(/\\s+/g, " ")
            .trim();

        setTranscript(
          finalTranscriptRef.current
        );
        setAnswerCaptured(true);
        setVoiceUiError("");

        setAnswerValidationError("");
      }

      // Interim speech is displayed immediately,
      // but is not treated as the final answer yet.
      setInterimTranscript(
        temporaryText.trim()
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech Recognition Error:",
        event?.error
      );

      setIsListening(false);

      switch (event?.error) {
        case "not-allowed":
        case "service-not-allowed":
          setError(
            "Microphone permission was denied. Please allow microphone access and try again."
          );
          break;

        case "no-speech":
          setError(
            "No speech was detected. Please speak clearly."
          );
          break;

        case "audio-capture":
          setError(
            "No microphone was detected. Please check your microphone."
          );
          break;

        case "network":
          setError(
            "Speech recognition network error. Please check your internet connection and try again."
          );
          break;

        case "aborted":
          // Intentional stop: no error message.
          break;

        default:
          setError(
            "Speech recognition could not start. Please try again."
          );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      } catch (err) {
        // Recognition was already stopped.
      }

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      setIsListening(false);
    };
  }, [session?.language]);

  // =====================================================
  // CHECK TEXT TO SPEECH SUPPORT
  // =====================================================

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setTtsSupported(false);
    }
  }, []);

  // =====================================================
  // CHECK TEXT TO SPEECH SUPPORT
  // =====================================================

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof window.SpeechSynthesisUtterance === "undefined"
    ) {
      setTtsSupported(false);
      return;
    }

    setTtsSupported(true);

    try {
      window.speechSynthesis.getVoices();
    } catch (error) {
      console.warn("Unable to read browser TTS voices:", error);
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

      // Stop previous question voice
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

      // Reset answer for new question
      finalTranscriptRef.current = "";
      setTranscript("");
      setInterimTranscript("");
      setAnswerValidationError("");

      setSpeechFinished(false);

      setVivaStarted(
        true
      );
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

  const handleJoin = async (e) => {
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
          enrollmentNumber.trim()
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
        "Active"
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
  // 10.7.4 SPEAK QUESTION AUTOMATICALLY
  // =====================================================

  useEffect(() => {
    if (
      !currentQuestion?.question ||
      !vivaStarted
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        speakQuestion(
          currentQuestion.question
        );
      }, 600);

    return () => {
      clearTimeout(timer);
      stopQuestionSpeech();
    };
  }, [
    currentQuestion,
    vivaStarted,
  ]);

  // =====================================================
  // 11.2 TEXT-TO-SPEECH HELPERS
  // =====================================================

  const getPreferredVoice = (language, gender) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();

    if (!voices || voices.length === 0) {
      return null;
    }

    const languageCode = getSpeechLanguage(language).toLowerCase();
    const languagePrefix = languageCode.split("-")[0];
    const selectedGender = String(gender || "Female").toLowerCase();

    const languageVoices = voices.filter((voice) => {
      const voiceLanguage = String(voice.lang || "").toLowerCase();
      return (
        voiceLanguage === languageCode ||
        voiceLanguage.startsWith(`${languagePrefix}-`)
      );
    });

    const pool = languageVoices.length > 0 ? languageVoices : voices;

    const genderVoice = pool.find((voice) => {
      const name = String(voice.name || "").toLowerCase();

      if (selectedGender === "male") {
        return /male|man|david|mark|daniel|george|alex/.test(name);
      }

      return /female|woman|zira|samantha|victoria|susan|karen|hazel/.test(name);
    });

    return genderVoice || pool[0] || null;
  };

  const speakQuestion = (questionText) => {
    if (!questionText || !String(questionText).trim()) {
      return;
    }

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof window.SpeechSynthesisUtterance === "undefined"
    ) {
      setTtsSupported(false);
      setIsSpeaking(false);
      setSpeechFinished(false);
      setError(
        "Text-to-speech is not supported in this browser. You can still read the question and answer manually."
      );
      return;
    }

    const requestId = ++speechRequestRef.current;

    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      console.warn("Unable to cancel previous speech:", error);
    }

    setIsSpeaking(true);
    setSpeechFinished(false);
    setError("");

    const utterance = new window.SpeechSynthesisUtterance(
      String(questionText).trim()
    );

    const language = session?.language || "English";
    const selectedVoice = session?.aiSettings?.voice || "Female";
    const speechSpeed = session?.aiSettings?.speechSpeed || "Normal";

    utterance.lang = getSpeechLanguage(language);
    utterance.rate = getSpeechRate(speechSpeed);
    utterance.pitch = String(selectedVoice).toLowerCase() === "male" ? 0.95 : 1;
    utterance.volume = 1;

    const speak = () => {
      if (requestId !== speechRequestRef.current) {
        return;
      }

      const preferredVoice = getPreferredVoice(
        language,
        selectedVoice
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      speechUtteranceRef.current = utterance;

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Text-to-Speech Start Error:", error);
        speechUtteranceRef.current = null;
        setIsSpeaking(false);
        setSpeechFinished(false);
        setError(
          "Unable to speak the question. You can still read the question and answer manually."
        );
      }
    };

    utterance.onstart = () => {
      if (requestId !== speechRequestRef.current) return;
      setIsSpeaking(true);
      setSpeechFinished(false);
    };

    utterance.onend = () => {
      if (requestId !== speechRequestRef.current) return;
      speechUtteranceRef.current = null;
      setIsSpeaking(false);
      setSpeechFinished(true);
    };

    utterance.onerror = (event) => {
      if (requestId !== speechRequestRef.current) return;

      // Browser cancellation is intentional when another question loads.
      if (event?.error === "canceled" || event?.error === "interrupted") {
        return;
      }

      console.error("Text-to-Speech Error:", event);
      speechUtteranceRef.current = null;
      setIsSpeaking(false);
      setSpeechFinished(false);
      setError(
        "Unable to speak the question. You can still read the question and answer manually."
      );
    };

    // Chrome/Edge may populate voices asynchronously. Give the browser a
    // short opportunity to expose them, while still speaking even if no
    // voice list is available.
    const voicesReady = window.speechSynthesis.getVoices();

    if (voicesReady.length > 0) {
      speak();
    } else {
      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
        speak();
      };

      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged,
        { once: true }
      );

      // Fallback in browsers that never fire voiceschanged.
      window.setTimeout(() => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
        if (requestId === speechRequestRef.current && !speechUtteranceRef.current) {
          speak();
        }
      }, 250);
    }
  };

  // =====================================================
  // STOP QUESTION SPEECH
  // =====================================================

  const stopQuestionSpeech = () => {
    voiceCycleRef.current += 1;
    speechRequestRef.current += 1;

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        console.warn("Unable to stop question speech:", error);
      }
    }

    speechUtteranceRef.current = null;
    setIsSpeaking(false);
  };

  // =====================================================
  // 11.3 START MICROPHONE
  // =====================================================

  const startListening = () => {
    setError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);

      setError(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );

      return;
    }

    const recognition = recognitionRef.current;

    if (!recognition) {
      setError(
        "Speech recognition is not ready. Please refresh the page and try again."
      );

      return;
    }

    // Prevent multiple recording instances.
    if (isListening) {
      return;
    }

    // Invalidate any old voice cycle and stop AI speech before
    // opening the microphone so AI audio is never captured.
    voiceCycleRef.current += 1;
    submissionLockRef.current = false;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speechRequestRef.current += 1;
    speechUtteranceRef.current = null;
    setTtsStatus("idle");

    // Never allow AI question audio to be captured
    // as the student's answer.
    stopQuestionSpeech();

    // Start a clean answer for the current question.
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setAnswerValidationError("");
    setAnswerCaptured(false);
    setVoiceUiError("");
    submissionLockRef.current = false;

    recognition.lang =
      getSpeechLanguage(
        session?.language
      );

    try {
      recognition.start();
    } catch (err) {
      console.error(
        "Start microphone error:",
        err
      );

      if (
        err?.name === "InvalidStateError"
      ) {
        setIsListening(true);
        return;
      }

      setIsListening(false);

      setError(
        "Microphone could not be started. Please try again."
      );
    }
  };

  // =====================================================
  // 11.5 VOICE ANSWER UI STATES
  // =====================================================

  const isAiSpeaking =
    ttsStatus === "speaking";

  const hasAnswer =
    Boolean(
      finalTranscriptRef.current?.trim() ||
      transcript?.trim()
    );

  const voiceUiState =
    isSubmittingAnswer
      ? "submitting"
      : error || voiceUiError
      ? "error"
      : isAiSpeaking
      ? "ai-speaking"
      : isListening
      ? "listening"
      : hasAnswer
      ? "answer-captured"
      : "ready";

  const voiceUiLabel = {
    "ai-speaking":
      "🔊 AI is asking the question...",
    listening:
      "🔴 Listening... Speak your answer.",
    "answer-captured":
      "✅ Answer captured. Review your answer.",
    submitting:
      "⏳ Submitting your answer...",
    error:
      "⚠️ Something went wrong. Please try again.",
    ready:
      "🎙 Ready to answer.",
  }[voiceUiState];

  // =====================================================

  // =====================================================
  // 11.4 ANSWER VALIDATION
  // =====================================================

  const getAnswerText = () =>
    finalTranscriptRef.current
      .trim();

  const validateAnswerTranscript = () => {
    const answer =
      getAnswerText();

    if (!answer) {
      setAnswerValidationError(
        "Please answer the question before continuing."
      );

      setVoiceUiError(
        "Please provide an answer before submitting."
      );

      setAnswerCaptured(false);
      return false;
    }

    setAnswerValidationError("");
    setVoiceUiError("");
    setAnswerCaptured(true);
    return true;
  };

  // =====================================================
  // 11.7 SUBMIT SPOKEN ANSWER TO BACKEND
  // =====================================================

  const handleSubmitAnswerUI = async () => {
    if (
      isSubmittingAnswer ||
      submissionLockRef.current
    ) {
      return;
    }

    if (!sessionId) {
      setVoiceUiError("Invalid Viva session.");
      return;
    }

    if (!attempt?.attemptId) {
      setVoiceUiError(
        "Viva attempt was not found. Please join again."
      );
      return;
    }

    if (!currentQuestion) {
      setVoiceUiError("No active Viva question.");
      return;
    }

    if (isAiSpeaking) {
      setVoiceUiError(
        "Please wait until the AI finishes asking the question."
      );
      return;
    }

    if (isListening) {
      setVoiceUiError(
        "Please stop recording before submitting your answer."
      );
      return;
    }

    const finalAnswer =
      finalTranscriptRef.current?.trim() ||
      transcript?.trim() ||
      "";

    if (!finalAnswer) {
      setAnswerValidationError(
        "Please answer the question before continuing."
      );
      setVoiceUiError(
        "Please provide an answer before submitting."
      );
      setAnswerCaptured(false);
      return;
    }

    const cleanEnrollment =
      student?.enrollmentNumber ||
      student?.enrollmentNo ||
      enrollmentNumber.trim();

    if (!cleanEnrollment) {
      setVoiceUiError(
        "Student enrollment number was not found."
      );
      return;
    }

    submissionLockRef.current = true;
    setIsSubmittingAnswer(true);
    setVoiceUiError("");
    setError("");

    try {
      stopListening();
      stopQuestionSpeech();

      const response =
        await submitPublicVivaAnswer(
          sessionId,
          {
            attemptId: attempt.attemptId,
            enrollmentNo: cleanEnrollment,
            questionId:
              currentQuestion.id || null,
            question:
              currentQuestion.question || "",
            answer: finalAnswer,
            questionNumber:
              Number(
                currentQuestion.questionNumber
              ) || 0,
          }
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to save your answer."
        );
      }

      setAnswerCaptured(true);
      setVoiceUiError("");

      if (
        response.nextQuestionIndex !==
        undefined
      ) {
        const updatedAttempt = {
          ...attempt,
          currentQuestionIndex:
            response.nextQuestionIndex,
        };

        setAttempt(updatedAttempt);

        sessionStorage.setItem(
          `vivaAttempt_${sessionId}`,
          JSON.stringify(updatedAttempt)
        );
      }

      // Phase 11.7 only persists the answer.
      // Question navigation is handled separately.
    } catch (err) {
      console.error(
        "Submit Viva Answer Error:",
        err
      );

      setVoiceUiError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save your answer. Please try again."
      );
    } finally {
      setIsSubmittingAnswer(false);
      submissionLockRef.current = false;
    }
  };

  // =====================================================
  // 11.3 STOP MICROPHONE
  // =====================================================

  const stopListening = () => {
    const recognition =
      recognitionRef.current;

    if (!recognition) {
      setIsListening(false);
      setInterimTranscript("");
      validateAnswerTranscript();
      return;
    }

    try {
      recognition.stop();
    } catch (err) {
      console.error(
        "Stop microphone error:",
        err
      );
    }

    setIsListening(false);
    setInterimTranscript("");

    // Validate only the final transcript.
    validateAnswerTranscript();
  };

  // =====================================================
  // CLEAR ANSWER
  // =====================================================

  const clearAnswer = () => {
    if (isListening) {
      stopListening();
    }

    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setAnswerValidationError("");
    setAnswerCaptured(false);
    setVoiceUiError("");
    setError("");
  };

  // =====================================================
  // 11.3 CLEANUP ON PAGE EXIT
  // =====================================================

  useEffect(() => {
    return () => {
      speechRequestRef.current += 1;
      speechUtteranceRef.current = null;
      finalTranscriptRef.current = "";

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      try {
        recognitionRef.current?.stop();
      } catch (err) {
        // Already stopped.
      }
    };
  }, []);

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

          <p style={styles.muted}>
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
      <div style={styles.centerPage}>
        <div style={styles.card}>
          <div
            style={styles.errorIcon}
          >
            ⚠️
          </div>

          <h2>
            Viva Unavailable
          </h2>

          <p
            style={styles.errorText}
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
  // MAIN UI
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <div style={styles.logo}>
              VivaPartner
            </div>

            <h1 style={styles.title}>
              AI Voice Viva
            </h1>

            <p style={styles.subtitle}>
              Online Viva Examination
            </p>
          </div>

          <div style={styles.status}>
            ● {session?.status}
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* =================================================
            STUDENT JOIN
        ================================================= */}

        {!student &&
          !attempt && (
            <div style={styles.card}>
              <div style={styles.icon}>
                🎓
              </div>

              <h2>
                Welcome to Your Viva
              </h2>

              <p style={styles.muted}>
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
                  style={styles.label}
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
                  style={styles.input}
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

        {student &&
          attempt &&
          !vivaStarted && (
            <div style={styles.card}>
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

              <p style={styles.muted}>
                Your identity has been
                verified.
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
                    Answer clearly and
                    verbally.
                  </li>

                  <li>
                    Do not refresh the
                    page during your Viva.
                  </li>

                  <li>
                    Your marks will remain
                    hidden.
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
                  not support the required
                  Speech Recognition API.
                  Please use Google Chrome
                  or Microsoft Edge.
                </div>
              )}

              {!ttsSupported && (
                <div
                  style={
                    styles.warningBox
                  }
                >
                  ⚠️ Text-to-speech is not
                  supported in this browser.
                  You can still read the
                  questions manually.
                </div>
              )}

              {attempt.status !==
                "Completed" && (
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
              )}
            </div>
          )}

        {/* =================================================
            CURRENT QUESTION
        ================================================= */}

        {vivaStarted && (
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
                  style={styles.muted}
                >
                  Preparing your next
                  Viva question.
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
                </div>

                {/* =================================================
                    10.7.4 AI QUESTION VOICE
                ================================================= */}

                <div
                  style={
                    styles.voiceQuestionCard
                  }
                >
                  <div
                    style={
                      styles.voiceQuestionTop
                    }
                  >
                    <div>
                      <strong
                        style={
                          styles.voiceQuestionTitle
                        }
                      >
                        🔊 AI Question
                      </strong>

                      <span
                        style={
                          styles.voiceQuestionStatus
                        }
                      >
                        {isSpeaking
                          ? "AI is asking the question..."
                          : speechFinished
                          ? "Question finished. You can answer now."
                          : "Question ready"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        speakQuestion(
                          currentQuestion.question
                        )
                      }
                      disabled={
                        isSpeaking ||
                        !ttsSupported
                      }
                      style={{
                        ...styles.askAgainButton,
                        opacity:
                          isSpeaking ||
                          !ttsSupported
                            ? 0.6
                            : 1,
                        cursor:
                          isSpeaking ||
                          !ttsSupported
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isSpeaking
                        ? "🔊 Speaking..."
                        : "🔊 Ask Again"}
                    </button>
                  </div>

                  <div
                    style={
                      styles.voiceWave
                    }
                  >
                    {isSpeaking ? (
                      <>
                        <span>🔊</span>
                        <span>
                          AI is speaking...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>🔈</span>
                        <span>
                          Listen to the
                          question before
                          answering.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* =================================================
                    10.7.3 MICROPHONE SECTION
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
                      Please use Google Chrome
                      or Microsoft Edge.
                    </div>
                  ) : (
                    <>
                      {/* LISTENING STATUS */}

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

                      {/* ANSWER TEXT */}

                      <div
                        style={
                          styles.answerBox
                        }
                      >
                        {transcript ||
                        interimTranscript ? (
                          <>
                            <span>
                              {transcript}
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
                            Your spoken answer
                            will appear here...
                          </span>
                        )}
                      </div>

                      {answerValidationError && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            color: "#c2410c",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          ⚠️ {answerValidationError}
                        </div>
                      )}

                      {/* 11.5 VOICE ANSWER STATUS */}

                      <div
                        style={{
                          marginTop: "12px",
                          marginBottom: "12px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {voiceUiLabel}
                      </div>

                      {voiceUiError && (
                        <div
                          style={{
                            marginBottom: "12px",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            color: "#c2410c",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          ⚠️ {voiceUiError}
                        </div>
                      )}

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

                        {(transcript || interimTranscript) && (
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

                      <button
                        type="button"
                        onClick={handleSubmitAnswerUI}
                        disabled={
                          !hasAnswer ||
                          isListening ||
                          isAiSpeaking ||
                          isSubmittingAnswer
                        }
                        style={{
                          marginTop: "14px",
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border: "none",
                          cursor:
                            !hasAnswer ||
                            isListening ||
                            isAiSpeaking ||
                            isSubmittingAnswer
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            !hasAnswer ||
                            isListening ||
                            isAiSpeaking ||
                            isSubmittingAnswer
                              ? 0.55
                              : 1,
                          fontWeight: "700",
                        }}
                      >
                        {isSubmittingAnswer
                          ? "⏳ Submitting..."
                          : "Submit Answer →"}
                      </button>

                      <p
                        style={
                          styles.languageText
                        }
                      >
                        🎧 Recognition language:{" "}
                        {
                          session?.language ||
                          "English"
                        }
                      </p>
                    </>
                  )}
                </div>

                {/* PHASE STATUS */}

                <div
                  style={
                    styles.phaseNote
                  }
                >
                  <strong>
                    11.2 Complete
                  </strong>

                  <span>
                    AI can read each Viva question aloud using
                    the selected language, voice and speech speed.
                  </span>
                </div>
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
// SPEECH RECOGNITION LANGUAGE
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
// TEXT-TO-SPEECH SPEED
// =====================================================

const getSpeechRate = (
  speed
) => {
  switch (speed) {
    case "Slow":
      return 0.75;

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
    <div style={styles.infoItem}>
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
    justifyContent: "space-between",
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
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "700",
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
    justifyContent: "space-between",
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

  // ===================================================
  // 10.7.4 QUESTION VOICE
  // ===================================================

  voiceQuestionCard: {
    marginTop: "20px",
    padding: "18px",
    background: "#eff6ff",
    borderRadius: "14px",
    border:
      "1px solid #bfdbfe",
  },

  voiceQuestionTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
  },

  voiceQuestionTitle: {
    display: "block",
    color: "#1e3a8a",
    marginBottom: "5px",
    fontSize: "17px",
  },

  voiceQuestionStatus: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
  },

  askAgainButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  voiceWave: {
    marginTop: "15px",
    padding: "12px",
    background: "#ffffff",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#475569",
    fontSize: "13px",
  },

  // ===================================================
  // MICROPHONE
  // ===================================================

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
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#475569",
    fontWeight: "700",
    cursor: "pointer",
  },

  languageText: {
    marginTop: "12px",
    marginBottom: 0,
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
  },

  phaseNote: {
    marginTop: "20px",
    padding: "12px 15px",
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
  },
};

export default StudentViva;
