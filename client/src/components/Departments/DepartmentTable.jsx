import DepartmentRow from "./DepartmentRow";
import "./DepartmentTable.css";

const DepartmentTable = ({
  departments,
  onDelete,
}) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {departments.map((department) => (
            <DepartmentRow
              key={department._id}
              department={department}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentTable;