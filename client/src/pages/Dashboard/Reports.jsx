import { useEffect, useState } from "react";

import ReportsHeader from "../../components/Reports/ReportsHeader";
import StatisticsGrid from "../../components/Reports/StatisticsGrid";
import ChartsGrid from "../../components/Reports/Charts/ChartsGrid";
import ActivityTimeline from "../../components/Reports/ActivityTimeline";

import {
  getDashboardStatistics,
  getRecentActivities,
} from "../../services/reportApi";

import "./Reports.css";

const Reports = () => {
  const [statistics, setStatistics] = useState({});
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [stats, recent] = await Promise.all([
        getDashboardStatistics(),
        getRecentActivities(),
      ]);

      if (stats.success) {
        setStatistics(stats.statistics);
      }

      if (recent.success) {
        setActivities(recent.activities);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">

      <ReportsHeader />

      <StatisticsGrid
        statistics={statistics}
        loading={loading}
      />

      <ChartsGrid />

      <ActivityTimeline
        activities={activities}
        loading={loading}
      />

    </div>
  );
};

export default Reports;