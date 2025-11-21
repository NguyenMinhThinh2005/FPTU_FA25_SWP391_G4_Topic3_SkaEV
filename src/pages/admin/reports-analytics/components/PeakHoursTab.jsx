import React from "react";
import { Box, Typography, Card, CardContent, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from "@mui/material";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";

const PeakHoursTab = ({ peakHoursData, dateRangeLabel }) => {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Giờ cao điểm - {dateRangeLabel}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Biểu đồ dưới đây hiển thị số lượng phiên sạc theo từng giờ trong ngày để xác định giờ cao điểm sử dụng.
      </Alert>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Phân bố phiên sạc theo giờ
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Số phiên sạc" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {peakHoursData.length > 0 && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Top giờ cao điểm
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thứ hạng</TableCell>
                    <TableCell>Khung giờ</TableCell>
                    <TableCell align="right">Số phiên sạc</TableCell>
                    <TableCell align="right">% Tổng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...peakHoursData]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((item, index) => {
                      const total = peakHoursData.reduce((sum, h) => sum + h.count, 0);
                      const percentage = total > 0 ? (item.count / total) * 100 : 0;
                      return (
                        <TableRow key={item.hour}>
                          <TableCell>
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              color={index === 0 ? "error" : "default"}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.hour}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {item.count}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{percentage.toFixed(1)}%</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PeakHoursTab;
