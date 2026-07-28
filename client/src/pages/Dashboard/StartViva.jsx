import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVivaSession } from "../../services/vivaSessionApi";
import "./StartViva.css";

const StartViva = () => {
  const navigate = useNavigate();

  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const storedClass = localStorage.getItem("selectedClass");

    if (!storedClass) {
      navigate("/teacher/assigned-classes");
      return;
    }

    setSelectedClass(JSON.parse(storedClass));
  }, [navigate]);

  const handleStartSession = async () => {
    try {
      setCreating(true);

      // Get viva configuration if already available
      const vivaConfig = JSON.parse(
        localStorage.getItem("vivaConfig")
      ) || {};

      const response = await createVivaSession({
        assignmentId: selectedClass._id,
        studentsPerViva: vivaConfig.studentsPerViva || 1,
        numberOfQuestions: vivaConfig.numberOfQuestions || 5,
        difficulty: vivaConfig.difficulty || "Medium",
      });

      // Save created session
      localStorage.setItem(
        "vivaSession",
        JSON.stringify(response.session)
      );

      setShowModal(false);

      navigate("/teacher/viva-setup");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to create Viva Session."
      );
    } finally {
      setCreating(false);
    }
  };

  if (!selectedClass) return null;

  return (
    <div className="start-viva-page">
      <div className="start-viva-card">
        <h1>Start New Viva</h1>

        <p className="subtitle">
          Review the class details before starting the viva
          session.
        </p>

        <div className="details-grid">
          <div className="detail-box">
            <span>Class</span>
            <h3>{selectedClass.class?.name}</h3>
          </div>

          <div className="detail-box">
            <span>Department</span>
            <h3>{selectedClass.department?.name}</h3>
          </div>

          <div className="detail-box">
            <span>Subject</span>
            <h3>{selectedClass.subject?.name}</h3>
          </div>

          <div className="detail-box">
            <span>Semester</span>
            <h3>{selectedClass.class?.semester}</h3>
          </div>

          <div className="detail-box">
            <span>Academic Year</span>
            <h3>
              {selectedClass.class?.academicYear ||
                selectedClass.academicYear ||
                "N/A"}
            </h3>
          </div>

          <div className="detail-box">
            <span>Status</span>
            <h3>{selectedClass.status}</h3>
          </div>
        </div>

        <div className="warning-box">
          <strong>⚠ Important</strong>

          <p>
            Once the viva session starts, all uploaded
            students, generated questions, evaluations and
            results will belong to this session.
          </p>
        </div>

        <div className="actions">
          <button
            className="cancel-btn"
            onClick={() =>
              navigate("/teacher/assigned-classes")
            }
            disabled={creating}
          >
            ← Cancel
          </button>

          <button
            className="start-btn"
            onClick={() => setShowModal(true)}
            disabled={creating}
          >
            Start Viva
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Start Viva Session</h2>

            <p>
              Are you sure you want to start this viva
              session?
            </p>

            <ul>
              <li>
                <strong>Class:</strong>{" "}
                {selectedClass.class?.name}
              </li>

              <li>
                <strong>Subject:</strong>{" "}
                {selectedClass.subject?.name}
              </li>

              <li>
                <strong>Department:</strong>{" "}
                {selectedClass.department?.name}
              </li>

              <li>
                <strong>Semester:</strong>{" "}
                {selectedClass.class?.semester}
              </li>
            </ul>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                Cancel
              </button>

              <button
                className="start-btn"
                onClick={handleStartSession}
                disabled={creating}
              >
                {creating
                  ? "Creating Session..."
                  : "Start Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartViva;