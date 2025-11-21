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
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PropTypes from 'prop-types';
import { formatCurrency } from "../../../../utils/helpers";

const RevenueByConnectorChart = ({ revenueByTypeData, colors, pieColors }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Doanh thu theo loại sạc
        </Typography>
        <Box sx={{ height: 350 }}>
          {revenueByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByTypeData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" width={160} />
                <RechartsTooltip 
                  formatter={(value, name, props) => [formatCurrency(value), props.payload.name]}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ddd', borderRadius: 8 }}
                />
                <Legend verticalAlign="top" />
                <Bar dataKey="revenue" fill={colors.primary} radius={[4, 4, 4, 4]} isAnimationActive={false}>
                  {revenueByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Bar>
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

RevenueByConnectorChart.propTypes = {
  revenueByTypeData: PropTypes.array.isRequired,
  colors: PropTypes.object.isRequired,
  pieColors: PropTypes.array.isRequired,
};

export default RevenueByConnectorChart;
