import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import PropTypes from 'prop-types';
import { formatCurrency } from "../../../../utils/helpers";

const EnergyUtilizationChart = ({ energyUtilizationData, colors }) => {
  const formatTooltipValue = (value, name) => {
    if (name === "revenue" || name.includes("Doanh thu")) return formatCurrency(value);
    if (name === "energy" || name.includes("Năng lượng")) return `${value.toFixed(1)} kWh`;
    if (name === "utilization" || name.includes("Sử dụng")) return `${value.toFixed(1)}%`;
    return value;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Năng lượng & Tỷ lệ sử dụng 
        </Typography>
        <Box sx={{ height: 320 }}>
          {energyUtilizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={energyUtilizationData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="dateLabel" 
                  angle={-15}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Năng lượng (kWh)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
                  }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Tỷ lệ sử dụng (%)', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
                  }}
                />
                <RechartsTooltip 
                  formatter={formatTooltipValue}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="energy"
                  fill={colors.success}
                  name="Năng lượng (kWh)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="utilization"
                  stroke={colors.warning}
                  strokeWidth={3}
                  name="Tỷ lệ sử dụng (%)"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <Typography color="text.secondary">Chưa có dữ liệu</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

EnergyUtilizationChart.propTypes = {
  energyUtilizationData: PropTypes.array.isRequired,
  colors: PropTypes.object.isRequired,
};

export default EnergyUtilizationChart;
