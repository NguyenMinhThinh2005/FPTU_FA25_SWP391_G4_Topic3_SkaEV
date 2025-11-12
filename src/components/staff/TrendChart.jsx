import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function TrendChart({ 
  title, 
  data = [], 
  dataKeys = [],
  period = "week",
  onPeriodChange,
  type = "line" 
}) {
  const ChartComponent = type === "bar" ? BarChart : LineChart;
  const DataComponent = type === "bar" ? Bar : Line;

  const colors = ["#1976d2", "#dc004e", "#4caf50", "#ff9800"];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          {onPeriodChange && (
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(e, value) => value && onPeriodChange(value)}
              size="small"
            >
              <ToggleButton value="day">Ngày</ToggleButton>
              <ToggleButton value="week">Tuần</ToggleButton>
              <ToggleButton value="month">Tháng</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              style={{ fontSize: '12px' }}
            />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <DataComponent
                key={key.key}
                type="monotone"
                dataKey={key.key}
                name={key.name}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                strokeWidth={2}
              />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
