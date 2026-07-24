import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useEffect, useState } from "react";

import ChartCard from "./ChartCard";

import {
  getSubjectsPerDepartment,
} from "../../../services/reportApi";

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#10b981",
  "#f97316",
  "#ef4444",
  "#06b6d4",
];

const SubjectsChart = () => {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetchChart();
  }, []);

  const fetchChart = async () => {

    try {

      const res =
        await getSubjectsPerDepartment();

      if (res.success) {
        setData(res.data);
      }

    } catch (error) {

      console.error(error);

    }

  };

  return (
    <ChartCard title="Subjects per Department">

      <ResponsiveContainer
        width="100%"
        height={280}
      >

        <PieChart>

          <Pie
            data={data}
            dataKey="subjects"
            nameKey="department"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  COLORS[
                    index % COLORS.length
                  ]
                }
              />
            ))}
          </Pie>

          <Tooltip />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

    </ChartCard>
  );

};

export default SubjectsChart;