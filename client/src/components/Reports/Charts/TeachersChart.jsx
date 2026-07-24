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
  getTeachersPerDepartment,
} from "../../../services/reportApi";

const TeachersChart = () => {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetchChart();
  }, []);

  const fetchChart = async () => {
    try {
      const res = await getTeachersPerDepartment();

      console.log("Teachers Chart API:", res);

      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };
  

  return (
    <ChartCard title="Teachers per Department">

      <ResponsiveContainer
        width="100%"
        height={280}
      >

        <BarChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="department"
          />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="teachers"
            fill="#2563eb"
            radius={[8, 8, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </ChartCard>
  );

};

export default TeachersChart;