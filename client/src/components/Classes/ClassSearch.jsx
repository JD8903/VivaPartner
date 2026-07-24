import "./ClassSearch.css";

const ClassSearch = ({ value, onChange }) => {
  return (
    <input
      type="text"
      className="class-search"
      placeholder="Search by class, code, department..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default ClassSearch;