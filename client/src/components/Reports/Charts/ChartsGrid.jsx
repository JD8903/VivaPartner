import TeachersChart from "./TeachersChart";
import SubjectsChart from "./SubjectsChart";
import ClassesChart from "./ClassesChart";
import AssignmentsChart from "./AssignmentsChart";

import "./Charts.css";

const ChartsGrid = () => {
  return (
    <section className="charts-section">
      <div className="charts-header">
        <h2>Analytics Overview</h2>
        <p>Visual insights of departments, teachers, classes and assignments.</p>
      </div>

      <div className="charts-grid">
        <TeachersChart />
        <SubjectsChart />
        <ClassesChart />
        <AssignmentsChart />
      </div>
    </section>
  );
};

export default ChartsGrid;