import "./DepartmentSearch.css";

const DepartmentSearch = ({ value, onChange }) => {
  return (
    <input
      type="text"
      className="department-search"
      placeholder="Search by name, code or description..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default DepartmentSearch;