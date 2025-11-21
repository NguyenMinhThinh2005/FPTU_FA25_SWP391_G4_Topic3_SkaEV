import React from "react";
import { Box, Typography, Alert, Card, CardContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from "@mui/material";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";

const StationComparisonTab = ({ stationComparison, dateRangeLabel }) => {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        So sánh hiệu suất trạm sạc - {dateRangeLabel}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        So sánh các trạm sạc dựa trên số lượng phiên sạc, doanh thu và năng lượng tiêu thụ.
      </Alert>

      {stationComparison.length === 0 ? (
        <Alert severity="warning">Chưa có dữ liệu so sánh trạm sạc</Alert>
      ) : (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Biểu đồ so sánh số phiên sạc
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stationComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stationName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessionCount" name="Phiên sạc" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Bảng so sánh chi tiết
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Thứ hạng</TableCell>
                      <TableCell>Trạm sạc</TableCell>
                      <TableCell align="right">Phiên sạc</TableCell>
                      <TableCell align="right">Hoàn thành</TableCell>
                      <TableCell align="right">Tỷ lệ hoàn thành</TableCell>
                      <TableCell align="right">Hiệu suất</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stationComparison.map((station, index) => {
                      const completionRate =
                        station.sessionCount > 0
                          ? (station.completedCount / station.sessionCount) * 100
                          : 0;
                      return (
                        <TableRow key={station.stationId}>
                          <TableCell>
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              color={index < 3 ? "primary" : "default"}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {station.stationName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {station.city}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {station.sessionCount}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="success.main">
                              {station.completedCount}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${completionRate.toFixed(1)}%`}
                              size="small"
                              color={completionRate >= 90 ? "success" : completionRate >= 70 ? "warning" : "error"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={completionRate >= 90 ? "Xuất sắc" : completionRate >= 70 ? "Tốt" : "Cần cải thiện"}
                              size="small"
                              variant="outlined"
                              color={completionRate >= 90 ? "success" : completionRate >= 70 ? "info" : "warning"}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default StationComparisonTab;
