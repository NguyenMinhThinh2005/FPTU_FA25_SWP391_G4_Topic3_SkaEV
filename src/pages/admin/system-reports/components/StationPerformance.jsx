import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  LinearProgress,
  Chip
} from "@mui/material";
import { LocationOn } from "@mui/icons-material";

const StationPerformance = ({ loading, stationUsage }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Hiệu suất trạm (Dữ liệu thật)
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : stationUsage.length === 0 ? (
              <Alert severity="info">Chưa có dữ liệu sử dụng trạm trong khoảng thời gian này</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên trạm</TableCell>
                      <TableCell align="center">Tỷ lệ sử dụng</TableCell>
                      <TableCell align="center">Tổng booking</TableCell>
                      <TableCell align="center">Hoàn thành</TableCell>
                      <TableCell align="center">Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stationUsage.map((station, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <LocationOn
                              sx={{ mr: 1, color: "text.secondary" }}
                            />
                            {station.stationName}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(station.utilizationRate || 0, 100)}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                mr: 1,
                              }}
                            />
                            <Typography variant="body2">
                              {(station.utilizationRate || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {station.totalBookings}
                        </TableCell>
                        <TableCell align="center">
                          {station.completedSessions}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              station.utilizationRate > 80
                                ? "Sử dụng cao"
                                : station.utilizationRate > 60
                                ? "Sử dụng bình thường"
                                : "Sử dụng thấp"
                            }
                            color={
                              station.utilizationRate > 80
                                ? "success"
                                : station.utilizationRate > 60
                                ? "info"
                                : "warning"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StationPerformance;
