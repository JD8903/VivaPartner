import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VivaSetup.css";

const VivaSetup = () => {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [studentsPerViva, setStudentsPerViva] = useState(2);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // =====================================================
  // LOAD EXISTING DATA
  // =====================================================

  useEffect(() => {
    try {
      const storedClass = localStorage.getItem("selectedClass");

      const storedStudents =
        localStorage.getItem("selectedStudents");

      const storedConfig =
        localStorage.getItem("vivaConfig");

      // -----------------------------------------------
      // Class is required
      // -----------------------------------------------

      if (!storedClass) {
        navigate("/teacher/assigned-classes");
        return;
      }

      const parsedClass = JSON.parse(storedClass);

      setSelectedClass(parsedClass);

      // -----------------------------------------------
      // Load selected students
      // -----------------------------------------------

      if (storedStudents) {
        const parsedStudents =
          JSON.parse(storedStudents);

        if (Array.isArray(parsedStudents)) {
          setSelectedStudents(parsedStudents);
        }
      }

      // -----------------------------------------------
      // Load existing Viva Configuration
      // -----------------------------------------------

      if (storedConfig) {
        const config = JSON.parse(storedConfig);

        if (config.studentsPerViva) {
          setStudentsPerViva(
            Number(config.studentsPerViva)
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to load Viva configuration:",
        error
      );

      setError(
        "Unable to load Viva configuration."
      );
    }
  }, [navigate]);

  // =====================================================
  // SELECT STUDENTS PER VIVA
  // =====================================================

  const handleStudentsPerViva = (value) => {
    setStudentsPerViva(value);

    setSaved(false);
    setError("");
  };

  // =====================================================
  // SAVE CONFIGURATION
  // =====================================================

  const saveConfigurationToLocalStorage = () => {
    try {
      setError("");

      // -----------------------------------------------
      // Validate class
      // -----------------------------------------------

      if (!selectedClass) {
        setError("Please select a class first.");
        return false;
      }

      // -----------------------------------------------
      // Validate students per Viva
      // -----------------------------------------------

      if (![1, 2, 3, 4].includes(studentsPerViva)) {
        setError(
          "Students per Viva must be between 1 and 4."
        );

        return false;
      }

      // -----------------------------------------------
      // Validate selected students
      // -----------------------------------------------

      if (
        selectedStudents.length > 0 &&
        studentsPerViva > selectedStudents.length
      ) {
        setError(
          `You have selected only ${selectedStudents.length} students. Students per Viva cannot be greater than the selected students.`
        );

        return false;
      }

      // -----------------------------------------------
      // Get existing configuration
      // -----------------------------------------------

      let existingConfig = {};

      const storedConfig =
        localStorage.getItem("vivaConfig");

      if (storedConfig) {
        try {
          existingConfig = JSON.parse(storedConfig);
        } catch (error) {
          console.warn(
            "Invalid stored Viva configuration. Creating a new one."
          );

          existingConfig = {};
        }
      }

      // -----------------------------------------------
      // Get Class ID
      // -----------------------------------------------

      const classId =
        selectedClass?.class?._id ||
        selectedClass?.classId ||
        selectedClass?._id ||
        "";

      // -----------------------------------------------
      // Updated configuration
      // -----------------------------------------------

      const updatedConfig = {
        ...existingConfig,

        classId,

        studentsPerViva,

        selectedStudents,

        studentSelectionMode:
          selectedStudents.length > 0
            ? "selected"
            : "all",

        // Keep configuration status
        configurationStep: "8.3",

        configurationCompleted: true,
      };

      // -----------------------------------------------
      // Save
      // -----------------------------------------------

      localStorage.setItem(
        "vivaConfig",
        JSON.stringify(updatedConfig)
      );

      return true;
    } catch (error) {
      console.error(
        "Save Viva Configuration Error:",
        error
      );

      setError(
        "Failed to save Viva configuration."
      );

      return false;
    }
  };

  // =====================================================
  // SAVE BUTTON
  // =====================================================

  const handleSaveConfiguration = () => {
    const success =
      saveConfigurationToLocalStorage();

    if (!success) {
      return;
    }

    setSaved(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  // =====================================================
  // CONTINUE TO STUDY MATERIAL
  // =====================================================

  const handleContinue = () => {
    setError("");

    // -----------------------------------------------
    // Save configuration before moving forward
    // -----------------------------------------------

    const success =
      saveConfigurationToLocalStorage();

    if (!success) {
      return;
    }

    // -----------------------------------------------
    // Mark configuration as completed
    // -----------------------------------------------

    const storedConfig =
      localStorage.getItem("vivaConfig");

    let config = {};

    try {
      config = storedConfig
        ? JSON.parse(storedConfig)
        : {};
    } catch (error) {
      config = {};
    }

    const updatedConfig = {
      ...config,

      configurationStep: "8.3",

      configurationCompleted: true,

      studyMaterialRequired: true,
    };

    localStorage.setItem(
      "vivaConfig",
      JSON.stringify(updatedConfig)
    );

    // -----------------------------------------------
    // GO TO PHASE 9
    // -----------------------------------------------

    navigate("/teacher/study-material");
  };

  // =====================================================
  // CLASS INFORMATION
  // =====================================================

  const className =
    selectedClass?.class?.name ||
    selectedClass?.className ||
    selectedClass?.name ||
    "Selected Class";

  const subjectName =
    selectedClass?.subject?.name ||
    selectedClass?.subjectName ||
    "N/A";

  const departmentName =
    selectedClass?.department?.name ||
    selectedClass?.departmentName ||
    "N/A";

  // =====================================================
  // LOADING
  // =====================================================

  if (!selectedClass) {
    return (
      <div className="viva-setup-loading">
        Loading Viva Configuration...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="viva-setup-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="viva-setup-header">
        <div>
          <h1>Viva Configuration</h1>

          <p>
            Configure the settings for your AI Viva
            examination.
          </p>
        </div>
      </div>

      {/* =================================================
          CLASS INFORMATION
      ================================================= */}

      <div className="viva-class-card">

        <div className="class-info">
          <span>Selected Class</span>
          <h2>{className}</h2>
        </div>

        <div className="class-info">
          <span>Department</span>
          <h3>{departmentName}</h3>
        </div>

        <div className="class-info">
          <span>Subject</span>
          <h3>{subjectName}</h3>
        </div>

        <div className="class-info">
          <span>Selected Students</span>

          <h3>
            {selectedStudents.length || "All"}
          </h3>
        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="viva-error">
          ⚠ {error}
        </div>
      )}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {saved && (
        <div className="viva-success">
          ✓ Students per Viva configuration saved
          successfully.
        </div>
      )}

      {/* =================================================
          STUDENTS PER VIVA
      ================================================= */}

      <div className="configuration-card">

        <div className="configuration-heading">

          <div>

            <span className="step-number">
              8.3
            </span>

            <div>
              <h2>Students Per Viva</h2>

              <p>
                Choose how many students should
                participate in one Viva session.
              </p>
            </div>

          </div>

        </div>

        {/* =================================================
            OPTIONS
        ================================================= */}

        <div className="students-per-viva-options">

          {/* -----------------------------------------------
              INDIVIDUAL
          ----------------------------------------------- */}

          <button
            type="button"
            className={`viva-option ${
              studentsPerViva === 1
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleStudentsPerViva(1)
            }
          >
            <div className="option-icon">
              1
            </div>

            <div className="option-content">
              <h3>Individual</h3>

              <p>
                One student per Viva
              </p>
            </div>

            <div className="radio-indicator">
              {studentsPerViva === 1
                ? "✓"
                : ""}
            </div>
          </button>

          {/* -----------------------------------------------
              PAIR
          ----------------------------------------------- */}

          <button
            type="button"
            className={`viva-option ${
              studentsPerViva === 2
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleStudentsPerViva(2)
            }
          >
            <div className="option-icon">
              2
            </div>

            <div className="option-content">
              <h3>Pair</h3>

              <p>
                Two students per Viva
              </p>
            </div>

            <div className="radio-indicator">
              {studentsPerViva === 2
                ? "✓"
                : ""}
            </div>
          </button>

          {/* -----------------------------------------------
              GROUP OF 3
          ----------------------------------------------- */}

          <button
            type="button"
            className={`viva-option ${
              studentsPerViva === 3
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleStudentsPerViva(3)
            }
          >
            <div className="option-icon">
              3
            </div>

            <div className="option-content">
              <h3>Group of 3</h3>

              <p>
                Three students per Viva
              </p>
            </div>

            <div className="radio-indicator">
              {studentsPerViva === 3
                ? "✓"
                : ""}
            </div>
          </button>

          {/* -----------------------------------------------
              GROUP OF 4
          ----------------------------------------------- */}

          <button
            type="button"
            className={`viva-option ${
              studentsPerViva === 4
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleStudentsPerViva(4)
            }
          >
            <div className="option-icon">
              4
            </div>

            <div className="option-content">
              <h3>Group of 4</h3>

              <p>
                Four students per Viva
              </p>
            </div>

            <div className="radio-indicator">
              {studentsPerViva === 4
                ? "✓"
                : ""}
            </div>
          </button>

        </div>

        {/* =================================================
            CURRENT SELECTION
        ================================================= */}

        <div className="selection-summary">

          <div>
            <span>
              Current Selection
            </span>

            <strong>
              {studentsPerViva === 1 &&
                "Individual"}

              {studentsPerViva === 2 &&
                "Pair (2 Students)"}

              {studentsPerViva === 3 &&
                "Group of 3"}

              {studentsPerViva === 4 &&
                "Group of 4"}
            </strong>
          </div>

          <div>
            <span>
              Students Per Viva
            </span>

            <strong>
              {studentsPerViva}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          EXAMPLE
      ================================================= */}

      <div className="example-card">

        <h3>
          Example
        </h3>

        {studentsPerViva === 1 && (
          <div className="example-groups">
            <div>
              Group 1 → Rahul
            </div>

            <div>
              Group 2 → Priya
            </div>

            <div>
              Group 3 → Jay
            </div>
          </div>
        )}

        {studentsPerViva === 2 && (
          <div className="example-groups">

            <div>
              Group 1 → Rahul + Priya
            </div>

            <div>
              Group 2 → Jay + Meet
            </div>

            <div>
              Group 3 → Riya + Dev
            </div>

          </div>
        )}

        {studentsPerViva === 3 && (
          <div className="example-groups">

            <div>
              Group 1 → Rahul + Priya + Jay
            </div>

            <div>
              Group 2 → Meet + Riya + Dev
            </div>

          </div>
        )}

        {studentsPerViva === 4 && (
          <div className="example-groups">

            <div>
              Group 1 → Rahul + Priya + Jay + Meet
            </div>

            <div>
              Group 2 → Riya + Dev + Yash + Krish
            </div>

          </div>
        )}

      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="viva-setup-actions">

        {/* BACK */}

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(
              "/teacher/student-pairing"
            )
          }
        >
          ← Back
        </button>

        {/* SAVE */}

        <button
          type="button"
          className="save-button"
          onClick={handleSaveConfiguration}
        >
          ✓ Save Configuration
        </button>

        {/* CONTINUE */}

        <button
          type="button"
          className="continue-button"
          onClick={handleContinue}
        >
          Continue →
        </button>

      </div>

    </div>
  );
};

export default VivaSetup;