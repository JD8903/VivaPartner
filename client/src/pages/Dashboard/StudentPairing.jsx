import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents } from "../../services/studentApi";
import { generateGroups } from "../../services/studentGroupApi";
import "./StudentPairing.css";

const StudentPairing = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);

  const [pairType, setPairType] = useState("pair");
  const [groupSize, setGroupSize] = useState(2);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const selectedClass = JSON.parse(
    localStorage.getItem("selectedClass")
  );

  // =============================
  // Load Students From MongoDB
  // =============================

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const response = await getStudents(
        "",
        selectedClass?.class?._id || "",
        "",
        1,
        1000
      );

      if (response.data.success) {
        setStudents(response.data.students);
      } else {
        setError("Failed to load students.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // Generate Groups
  // =============================

  const handleGenerateGroups = async () => {
    try {
      setGenerating(true);
      setError("");

      const response = await generateGroups({
        classId: selectedClass?.class?._id,
        studentsPerViva: groupSize,
      });

      if (response.data.success) {
        setGroups(response.data.groups);

        localStorage.setItem(
          "studentGroups",
          JSON.stringify(response.data.groups)
        );
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to generate student groups."
      );
    } finally {
      setGenerating(false);
    }
  };

  // =============================
  // Auto Generate
  // =============================

  useEffect(() => {
    if (students.length > 0) {
      handleGenerateGroups();
    }
  }, [groupSize, students]);

  // =============================
  // Pair Type
  // =============================

  const handlePairType = (type) => {
    setPairType(type);

    switch (type) {
      case "individual":
        setGroupSize(1);
        break;

      case "pair":
        setGroupSize(2);
        break;

      case "group3":
        setGroupSize(3);
        break;

      case "group4":
        setGroupSize(4);
        break;

      case "custom":
        break;

      default:
        setGroupSize(2);
    }
  };
  
const handleContinue = () => {
  if (groups.length === 0) {
    setError("Please generate student groups first.");
    return;
  }

  localStorage.setItem(
    "studentGroups",
    JSON.stringify(groups)
  );

  navigate("/teacher/study-material");
};
  return (
  <div className="pairing-page">
    <div className="pairing-header">
      <h1>Student Pairing</h1>

      <p>
        Select how students should be grouped for the viva examination.
      </p>
    </div>

    {error && (
      <div className="upload-error">
        {error}
      </div>
    )}

    {loading ? (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          fontSize: "18px",
        }}
      >
        Loading students...
      </div>
    ) : (
      <>
        {/* Statistics */}

        <div className="stats-container">
          <div className="stat-card">
            <h2>{students.length}</h2>
            <span>Total Students</span>
          </div>

          <div className="stat-card">
            <h2>{groups.length}</h2>
            <span>Total Groups</span>
          </div>

          <div className="stat-card">
            <h2>{groupSize}</h2>
            <span>Students / Group</span>
          </div>
        </div>

        {/* Pairing */}

        <div className="pairing-options">
          <h2>Pairing Mode</h2>

          <label>
            <input
              type="radio"
              checked={pairType === "individual"}
              onChange={() =>
                handlePairType("individual")
              }
            />
            Individual
          </label>

          <label>
            <input
              type="radio"
              checked={pairType === "pair"}
              onChange={() =>
                handlePairType("pair")
              }
            />
            Pair
          </label>

          <label>
            <input
              type="radio"
              checked={pairType === "group3"}
              onChange={() =>
                handlePairType("group3")
              }
            />
            Group of 3
          </label>

          <label>
            <input
              type="radio"
              checked={pairType === "group4"}
              onChange={() =>
                handlePairType("group4")
              }
            />
            Group of 4
          </label>

          <label>
            <input
              type="radio"
              checked={pairType === "custom"}
              onChange={() =>
                handlePairType("custom")
              }
            />
            Custom
          </label>

          {pairType === "custom" && (
            <input
              type="number"
              min="1"
              max="4"
              value={groupSize}
              onChange={(e) =>
                setGroupSize(Number(e.target.value))
              }
            />
          )}
        </div>

        {/* Toolbar */}

        <div className="pairing-toolbar">
          <button
            onClick={handleGenerateGroups}
            disabled={generating}
          >
            {generating
              ? "Generating..."
              : "🔀 Regenerate Groups"}
          </button>
        </div>

        {/* Preview */}

        <div className="preview-section">
          <h2>Generated Groups</h2>

          {groups.length === 0 ? (
            <p>No students available.</p>
          ) : (
            <div className="groups-container">
              {groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="group-card"
                >
                  <h3>
                    Group {group.groupNumber}
                  </h3>

                  {group.students.map(
                    (student, studentIndex) => (
                      <div
                        key={studentIndex}
                        className="student-item"
                      >
                        <div>
                          <strong>
                            {student.name}
                          </strong>

                          <br />

                          <span>
                            {student.enrollment}
                          </span>
                        </div>
                        <div className="student-actions">
  <span
    style={{
      fontSize: "13px",
      color: "#666",
    }}
  >
    Student {studentIndex + 1}
  </span>
</div>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}

        <div className="pairing-actions">
          <button
            onClick={() =>
              navigate("/teacher/upload-students")
            }
            disabled={generating}
          >
            ← Back
          </button>

          <button
            onClick={handleContinue}
            disabled={
              generating ||
              groups.length === 0
            }
          >
            Continue →
          </button>
        </div>
      </>
    )}
  </div>
);

};

export default StudentPairing;