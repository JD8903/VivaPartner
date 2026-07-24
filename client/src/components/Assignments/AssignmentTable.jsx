import AssignmentRow from "./AssignmentRow";
import "./AssignmentTable.css";

const AssignmentTable = ({
  assignments,
  onDelete,
}) => {
  return (
    <div className="assignment-table-container">
      <table className="assignment-table">

        <thead>
          <tr>
            <th>Teacher</th>
            <th>Department</th>
            <th>Subject</th>
            <th>Class</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <AssignmentRow
                key={assignment._id}
                assignment={assignment}
                onDelete={onDelete}
              />
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                className="no-data"
              >
                No assignments found.
              </td>
            </tr>
          )}

        </tbody>

      </table>
    </div>
  );
};

export default AssignmentTable;