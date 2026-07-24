import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";

import ChartCard from "./ChartCard";

import {
  getClassesPerDepartment,
} from "../../../services/reportApi";

const ClassesChart = () => {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetchChart();
  }, []);

  const fetchChart = async () => {

    try {

      const res =
        await getClassesPerDepartment();

      if (res.success) {
        setData(res.data);
      }

    } catch (error) {

      console.error(error);

    }

  };

  return (
    <ChartCard title="Classes per Department">

      <ResponsiveContainer
        width="100%"
        height={280}
      >

        <AreaChart data={data}>

          <defs>

            <linearGradient
              id="colorClasses"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >

              <stop
                offset="5%"
                stopColor="#10b981"
                stopOpacity={0.8}
              />

              <stop
                offset="95%"
                stopColor="#10b981"
                stopOpacity={0}
              />

            </linearGradient>

          </defs>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="department" />

          <YAxis />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="classes"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorClasses)"
          />

        </AreaChart>

      </ResponsiveContainer>

    </ChartCard>
  );

};

export default ClassesChart;