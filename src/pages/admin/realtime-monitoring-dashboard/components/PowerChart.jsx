import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

const PowerChart = ({ powerHistory }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Công suất theo thời gian (20 điểm gần nhất)
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={powerHistory}>
            <defs>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              stroke="#888"
              style={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#888"
              style={{ fontSize: 12 }}
              label={{ value: "kW", angle: -90, position: "insideLeft" }}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
              formatter={(value) => [`${value.toFixed(1)} kW`, "Công suất"]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="power"
              stroke="#8884d8"
              fill="url(#colorPower)"
              strokeWidth={2}
              name="Công suất"
              dot={{ fill: "#8884d8", r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PowerChart;