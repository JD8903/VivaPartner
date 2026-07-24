import SubjectRow from "./SubjectRow";
import "./SubjectTable.css";

const SubjectTable = ({
  subjects,
  onDelete,
}) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Department</th>
            <th>Semester</th>
            <th>Credits</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {subjects.map((subject) => (
            <SubjectRow
              key={subject._id}
              subject={subject}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectTable;