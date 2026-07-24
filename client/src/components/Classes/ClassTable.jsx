import ClassRow from "./ClassRow";
import "./ClassTable.css";

const ClassTable = ({
  classes,
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
            <th>Academic Year</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {classes.map((classItem) => (
            <ClassRow
              key={classItem._id}
              classItem={classItem}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassTable;