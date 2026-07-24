import "./TeacherSearch.css";

const TeacherSearch = ({ value, onChange }) => {
  return (
    <div className="teacher-search">
      <input
        type="text"
        placeholder="Search by name, email or department..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TeacherSearch;