import TeacherRow from "./TeacherRow";
import "./TeacherTable.css";

const TeacherTable = ({
  teachers,
  onDelete,
}) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {teachers.map((teacher) => (
            <TeacherRow
              key={teacher._id}
              teacher={teacher}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherTable;