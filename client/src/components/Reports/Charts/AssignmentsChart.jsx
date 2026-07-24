import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";

import ChartCard from "./ChartCard";

import {
  getAssignmentsPerTeacher,
} from "../../../services/reportApi";

const AssignmentsChart = () => {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetchChart();
  }, []);

  const fetchChart = async () => {

    try {

      const res =
        await getAssignmentsPerTeacher();

      if (res.success) {
        setData(res.data);
      }

    } catch (error) {

      console.error(error);

    }

  };

  return (
    <ChartCard title="Assignments per Teacher">

      <ResponsiveContainer
        width="100%"
        height={280}
      >

        <BarChart
          data={data}
          layout="vertical"
        >

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis type="number" />

          <YAxis
            dataKey="teacher"
            type="category"
            width={120}
          />

          <Tooltip />

          <Bar
            dataKey="assignments"
            fill="#f97316"
            radius={[0, 8, 8, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </ChartCard>
  );

};

export default AssignmentsChart;