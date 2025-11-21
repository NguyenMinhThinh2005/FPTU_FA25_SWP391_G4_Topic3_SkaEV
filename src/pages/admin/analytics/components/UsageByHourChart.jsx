import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import PropTypes from 'prop-types';

const UsageByHourChart = ({ peakHoursData, colors }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Phân bố sử dụng theo giờ 
        </Typography>
        <Box sx={{ height: 320 }}>
          {peakHoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={peakHoursData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}h`}
                  tick={{ fontSize: 12 }}
                  interval={1}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  labelFormatter={(hour) => `Khung giờ ${hour}:00 - ${hour}:59`}
                  formatter={(value) => [value, "Số phiên sạc"]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px'
                  }}
                />
                <Bar
                  dataKey="sessionCount"
                  fill={colors.info}
                  name="Số phiên sạc"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
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

UsageByHourChart.propTypes = {
  peakHoursData: PropTypes.array.isRequired,
  colors: PropTypes.object.isRequired,
};

export default UsageByHourChart;
