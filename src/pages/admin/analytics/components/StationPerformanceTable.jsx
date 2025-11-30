import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableFooter,
  TableRow,
  LinearProgress,
  Chip,
  Avatar,
} from "@mui/material";
import { ElectricCar } from "@mui/icons-material";
import PropTypes from 'prop-types';
import { formatCurrency } from "../../../../utils/helpers";

const StationPerformanceTable = ({ topStations, tableTotals }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Bảng xếp hạng hiệu suất trạm sạc (Top 10)
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Xếp hạng</TableCell>
                <TableCell>Trạm sạc</TableCell>
                <TableCell align="center">Doanh thu</TableCell>
                <TableCell align="center">Năng lượng (kWh)</TableCell>
                <TableCell align="center">Phiên sạc</TableCell>
                <TableCell align="center">Tỷ lệ sử dụng</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topStations.length > 0 ? (
                topStations.map((station, index) => (
                    <TableRow key={station.stationId} hover>
                      <TableCell>
                        <Chip
                          label={`#${index + 1}`}
                          color={
                            index === 0
                              ? "primary"
                              : index === 1
                              ? "secondary"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 32,
                              height: 32,
                            }}
                          >
                            <ElectricCar sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {station.stationName || `Trạm ${station.stationId}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {station.stationId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(station.totalRevenue || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {(station.totalEnergyDelivered || 0).toFixed(1)}
                      </TableCell>
                      <TableCell align="center">
                        {station.completedSessions || 0}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ minWidth: 60 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(station.utilizationRate || 0, 100)}
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption">
                            {(station.utilizationRate || 0).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={station.status === "active" ? "Hoạt động" : "Không hoạt động"}
                          color={
                            station.status === "active" ? "success" : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="subtitle2" fontWeight="bold">Tổng (Top 10)</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {formatCurrency(tableTotals.revenue)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {tableTotals.energy.toFixed(1)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {tableTotals.sessions}
                  </Typography>
                </TableCell>
                <TableCell align="center">&nbsp;</TableCell>
                <TableCell align="center">&nbsp;</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

StationPerformanceTable.propTypes = {
  topStations: PropTypes.array.isRequired,
  tableTotals: PropTypes.shape({
    revenue: PropTypes.number,
    energy: PropTypes.number,
    sessions: PropTypes.number,
  }).isRequired,
};

export default StationPerformanceTable;
