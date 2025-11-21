import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import {
  Line,
  Area,
  BarChart,
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

const RevenueChart = ({
  shouldShowPerStation,
  stationBars,
  revenueSeries,
  revenueGranularity,
  colors
}) => {
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
          Xu hướng doanh thu & phiên sạc 
        </Typography>
        <Box sx={{ height: 350 }}>
          {shouldShowPerStation ? (
            stationBars.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stationBars} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <RechartsTooltip
                    formatter={(value, name, props) => [formatCurrency(value), props.dataKey || name]}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ddd', borderRadius: 8 }}
                  />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="revenue" fill={colors.primary} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="sessions" stroke={colors.info} strokeWidth={2} name="Số phiên" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Typography color="text.secondary">Chưa có dữ liệu</Typography>
              </Box>
            )
          ) : revenueSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={revenueSeries}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="dateISO"
                  angle={-15}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(iso) => {
                    if (!iso) return '';
                    const dt = new Date(iso);
                    if (revenueGranularity === 'daily') {
                      return dt.toLocaleDateString();
                    }
                    // monthly
                    return dt.toLocaleString(undefined, { month: 'short', year: 'numeric' });
                  }}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left"
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Doanh thu (VNĐ)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
                  }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Số phiên sạc', 
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
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="rect"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  fill={colors.primary}
                  fillOpacity={0.2}
                  stroke={colors.primary}
                  strokeWidth={3}
                  name="Doanh thu"
                />
                <Bar
                  yAxisId="right"
                  dataKey="sessions"
                  fill={colors.secondary}
                  name="Số phiên sạc"
                  radius={[4, 4, 0, 0]}
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

RevenueChart.propTypes = {
  shouldShowPerStation: PropTypes.bool.isRequired,
  stationBars: PropTypes.array.isRequired,
  revenueSeries: PropTypes.array.isRequired,
  revenueGranularity: PropTypes.string.isRequired,
  colors: PropTypes.object.isRequired,
};

export default RevenueChart;
