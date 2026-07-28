import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VivaSetup.css";

const VivaSetup = () => {
  const navigate = useNavigate();

  const [selectedClass, setSelectedClass] = useState(null);

  const [vivaConfig, setVivaConfig] = useState({
    studentsPerViva: 2,
    numberOfQuestions: 5,
    difficulty: "Medium",
    timePerQuestion: 60,
    language: "English",
    negativeMarking: false,
  });

  const [error, setError] = useState("");

  // Load selected class
  useEffect(() => {
    const storedClass = localStorage.getItem("selectedClass");

    if (!storedClass) {
      navigate("/teacher/assigned-classes");
      return;
    }

    try {
      setSelectedClass(JSON.parse(storedClass));
    } catch (err) {
      console.error(err);
      localStorage.removeItem("selectedClass");
      navigate("/teacher/assigned-classes");
    }
  }, [navigate]);

  // Load previous configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem("vivaConfig");

    if (savedConfig) {
      try {
        setVivaConfig(JSON.parse(savedConfig));
      } catch (err) {
        console.error("Invalid viva config:", err);
      }
    }
  }, []);

  // Auto Save
  useEffect(() => {
    localStorage.setItem(
      "vivaConfig",
      JSON.stringify(vivaConfig)
    );
  }, [vivaConfig]);

  const handleContinue = () => {
    if (
      vivaConfig.studentsPerViva < 1 ||
      vivaConfig.studentsPerViva > 4
    ) {
      setError("Students per viva must be between 1 and 4.");
      return;
    }

    if (
      vivaConfig.numberOfQuestions < 1 ||
      vivaConfig.numberOfQuestions > 20
    ) {
      setError("Number of questions must be between 1 and 20.");
      return;
    }

    if (
      !["Easy", "Medium", "Hard"].includes(
        vivaConfig.difficulty
      )
    ) {
      setError("Invalid difficulty selected.");
      return;
    }

    setError("");

    localStorage.setItem(
      "vivaConfig",
      JSON.stringify(vivaConfig)
    );

    navigate("/teacher/upload-students");
  };

  if (!selectedClass) {
    return (
      <div className="viva-loading">
        <h2>Loading Viva Setup...</h2>
      </div>
    );
  }

  return (
    <div className="viva-setup-page">
      {/* Header */}

      <div className="viva-header">
        <div>
          <h1>Viva Setup</h1>

          <p>
            Configure your viva session before uploading
            students.
          </p>
        </div>
      </div>

      {/* Class Information */}

      <div className="class-info-card">
        <div className="class-info-header">
          <div>
            <h2>{selectedClass.class?.name}</h2>

            <span className="department-chip">
              {selectedClass.department?.name}
            </span>
          </div>

          <span className="semester-chip">
            Semester {selectedClass.class?.semester}
          </span>
        </div>

        <div className="class-info-grid">
          <div className="info-box">
            <label>Subject</label>

            <h4>{selectedClass.subject?.name}</h4>
          </div>

          <div className="info-box">
            <label>Academic Year</label>

            <h4>
              {selectedClass.class?.academicYear}
            </h4>
          </div>

          <div className="info-box">
            <label>Capacity</label>

            <h4>
              {selectedClass.class?.capacity} Students
            </h4>
          </div>

          <div className="info-box">
            <label>Status</label>

            <span className="status-badge">
              {selectedClass.status}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration */}

      <div className="config-card">
        <h2>Viva Configuration</h2>

        <div className="config-grid">
          {/* Students */}

          <div className="form-group">
            <label>Students Per Viva</label>

            <select
              value={vivaConfig.studentsPerViva}
              onChange={(e) =>
                setVivaConfig({
                  ...vivaConfig,
                  studentsPerViva: Number(
                    e.target.value
                  ),
                })
              }
            >
              <option value={1}>1 Student</option>
              <option value={2}>2 Students</option>
              <option value={3}>3 Students</option>
              <option value={4}>4 Students</option>
            </select>
          </div>

          {/* Questions */}

          <div className="form-group">
            <label>Number of Questions</label>

            <input
              type="number"
              min="1"
              max="20"
              value={vivaConfig.numberOfQuestions}
              onChange={(e) =>
                setVivaConfig({
                  ...vivaConfig,
                  numberOfQuestions: Number(
                    e.target.value
                  ),
                })
              }
            />
          </div>

          {/* Difficulty */}

          <div className="form-group">
            <label>Difficulty</label>

            <select
              value={vivaConfig.difficulty}
              onChange={(e) =>
                setVivaConfig({
                  ...vivaConfig,
                  difficulty: e.target.value,
                })
              }
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Time */}

          <div className="form-group">
            <label>Time Per Question</label>

            <select
              value={vivaConfig.timePerQuestion}
              onChange={(e) =>
                setVivaConfig({
                  ...vivaConfig,
                  timePerQuestion: Number(
                    e.target.value
                  ),
                })
              }
            >
              <option value={30}>
                30 Seconds
              </option>

              <option value={45}>
                45 Seconds
              </option>

              <option value={60}>
                60 Seconds
              </option>

              <option value={90}>
                90 Seconds
              </option>

              <option value={120}>
                120 Seconds
              </option>
            </select>
          </div>

          {/* Language */}

          <div className="form-group">
            <label>Language</label>

            <select
              value={vivaConfig.language}
              onChange={(e) =>
                setVivaConfig({
                  ...vivaConfig,
                  language: e.target.value,
                })
              }
            >
              <option value="English">
                English
              </option>

              <option value="Gujarati">
                Gujarati
              </option>

              <option value="Hindi">
                Hindi
              </option>
            </select>
          </div>

          {/* Negative Marking */}

          <div className="form-group">
            <label>Negative Marking</label>

            <div className="toggle-container">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={
                    vivaConfig.negativeMarking
                  }
                  onChange={(e) =>
                    setVivaConfig({
                      ...vivaConfig,
                      negativeMarking:
                        e.target.checked,
                    })
                  }
                />

                <span className="slider"></span>
              </label>

              <span className="toggle-text">
                {vivaConfig.negativeMarking
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="config-error">
            {error}
          </div>
        )}

        <div className="config-actions">
          <button
            className="continue-btn"
            onClick={handleContinue}
          >
            Continue to Student Upload →
          </button>
        </div>
      </div>
    </div>
  );
};

export default VivaSetup;