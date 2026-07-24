import "./AssignmentSearch.css";

const AssignmentSearch = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="assignment-search">
      <input
        type="text"
        placeholder="Search by Teacher, Department, Subject or Class..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default AssignmentSearch;