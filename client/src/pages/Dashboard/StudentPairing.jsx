import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentPairing.css";

const StudentPairing = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);

  const [pairType, setPairType] = useState("pair");
  const [groupSize, setGroupSize] = useState(2);

  // Load students
  useEffect(() => {
    const storedStudents =
      JSON.parse(localStorage.getItem("students")) || [];

    setStudents(storedStudents);
  }, []);

  // Generate Groups
  const generateGroups = (studentList, size) => {
    if (!studentList.length) {
      setGroups([]);
      return;
    }

    const generated = [];

    for (let i = 0; i < studentList.length; i += size) {
      generated.push(studentList.slice(i, i + size));
    }

    setGroups(generated);

    localStorage.setItem(
      "studentGroups",
      JSON.stringify(generated)
    );
  };

  // Auto Generate
  useEffect(() => {
    generateGroups(students, groupSize);
  }, [students, groupSize]);

  // Pair Type
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

  // Shuffle Students
  const shuffleGroups = () => {
    const shuffled = [...students];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [
        shuffled[j],
        shuffled[i],
      ];
    }

    generateGroups(shuffled, groupSize);
  };

  // Remove Student
  const removeStudent = (groupIndex, studentIndex) => {
    const updated = groups.map((group) => [...group]);

    updated[groupIndex].splice(studentIndex, 1);

    setGroups(updated);

    localStorage.setItem(
      "studentGroups",
      JSON.stringify(updated)
    );
  };

  // Move Student
  const moveStudent = (
    fromGroup,
    studentIndex,
    toGroup
  ) => {
    if (fromGroup === toGroup) return;

    const updated = groups.map((group) => [...group]);

    const student =
      updated[fromGroup].splice(studentIndex, 1)[0];

    if (!student) return;

    updated[toGroup].push(student);

    setGroups(updated);

    localStorage.setItem(
      "studentGroups",
      JSON.stringify(updated)
    );
  };

  // Continue
  const handleContinue = () => {
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
          Select how students should be grouped for the
          viva examination.
        </p>
      </div>

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
            min="2"
            value={groupSize}
            onChange={(e) =>
              setGroupSize(Number(e.target.value))
            }
          />
        )}
      </div>

      {/* Toolbar */}

      <div className="pairing-toolbar">
        <button onClick={shuffleGroups}>
          🔀 Shuffle Groups
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
                  Group {groupIndex + 1}
                </h3>

                {group.map((student, studentIndex) => (
                  <div
                    key={studentIndex}
                    className="student-item"
                  >
                    <div>
                      <strong>
                        {student.name ||
                          "Student"}
                      </strong>

                      <br />

                      <span>
                        {student.enrollmentNo ||
                          ""}
                      </span>
                    </div>

                    <div className="student-actions">
                      <select
                        defaultValue=""
                        onChange={(e) =>
                          moveStudent(
                            groupIndex,
                            studentIndex,
                            Number(e.target.value)
                          )
                        }
                      >
                        <option
                          value=""
                          disabled
                        >
                          Move
                        </option>

                        {groups.map(
                          (_, targetIndex) => (
                            <option
                              key={targetIndex}
                              value={targetIndex}
                            >
                              Group{" "}
                              {targetIndex + 1}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeStudent(
                            groupIndex,
                            studentIndex
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}

      <div className="pairing-actions">
        <button
          onClick={() =>
            navigate(
              "/teacher/upload-students"
            )
          }
        >
          ← Back
        </button>

        <button onClick={handleContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
};

export default StudentPairing;