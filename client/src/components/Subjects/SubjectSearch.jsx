import "./SubjectSearch.css";

const SubjectSearch = ({ value, onChange }) => {
  return (
    <input
      type="text"
      className="subject-search"
      placeholder="Search by name, code or department..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default SubjectSearch;