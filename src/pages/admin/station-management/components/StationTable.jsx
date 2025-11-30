import React from "react";
import {
  Card,
  CardContent,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Avatar,
  Chip,
  IconButton,
} from "@mui/material";
import { ElectricCar, TrendingUp, Edit, PowerSettingsNew, Delete } from "@mui/icons-material";
import PropTypes from "prop-types";

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "success";
    case "maintenance":
      return "warning";
    case "offline":
      return "error";
    default:
      return "default";
  }
};

const StationTable = ({
  filteredStations,
  users,
  navigate,
  onStationClick,
  onDeleteClick,
  onRemoteDisable,
  onRemoteEnable,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Tổng quan trạm sạc
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="22%">Trạm sạc</TableCell>
                <TableCell align="center" width="8%">
                  Trạng thái
                </TableCell>
                <TableCell align="center" width="10%">
                  Cổng
                </TableCell>
                <TableCell width="18%">Nhân viên quản lý</TableCell>
                <TableCell align="center" width="8%">
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStations.map((station) => {
                const location = station.location ?? {};
                const charging = station.charging ?? {};

                // Prefer explicit manager info from API DTO; fall back to user store lookup when missing
                const managerFromUsers = users.find(
                  (u) =>
                    u.userId ===
                    (station.managerUserId ?? station.manager?.userId)
                );

                const managerName =
                  station.managerName ??
                  managerFromUsers?.fullName ??
                  station.manager?.name ??
                  null;
                const managerEmail =
                  station.managerEmail ??
                  managerFromUsers?.email ??
                  station.manager?.email ??
                  null;
                const managerPhone =
                  station.managerPhoneNumber ??
                  managerFromUsers?.phoneNumber ??
                  station.manager?.phone ??
                  null;
                const managerId =
                  station.managerUserId ??
                  station.manager?.userId ??
                  managerFromUsers?.userId ??
                  null;

                return (
                  <TableRow key={station.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          navigate(`/admin/stations/${station.id}/analytics`)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            navigate(`/admin/stations/${station.id}/analytics`);
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                          }}
                        >
                          <ElectricCar />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {station.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {location.address || "Địa chỉ chưa cập nhật"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={station.status}
                        color={getStatusColor(station.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {Number.isFinite(charging.availablePorts)
                          ? charging.availablePorts
                          : 0}
                        /
                        {Number.isFinite(charging.totalPorts)
                          ? charging.totalPorts
                          : Math.max(charging.availablePorts ?? 0, 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        có sẵn
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {managerName || managerEmail || managerPhone ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="medium">
                            {managerName || "Nhân viên chưa rõ"}
                          </Typography>
                          {managerEmail && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {managerEmail}
                            </Typography>
                          )}
                          {managerPhone && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {managerPhone}
                            </Typography>
                          )}
                          {managerId && (
                            <Chip
                              label={`ID: ${managerId}`}
                              size="small"
                              variant="outlined"
                              sx={{ alignSelf: "flex-start" }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Chip
                          label="Chưa phân công"
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            navigate(`/admin/stations/${station.id}/analytics`)
                          }
                          title="Xem phân tích chi tiết"
                        >
                          <TrendingUp />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onStationClick(station)}
                          title="Chỉnh sửa"
                        >
                          <Edit />
                        </IconButton>
                        {station.status !== "offline" ? (
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => onRemoteDisable(station.id)}
                            title="Tắt trạm"
                          >
                            <PowerSettingsNew />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onRemoteEnable(station.id)}
                            title="Bật trạm"
                          >
                            <PowerSettingsNew />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteClick(station)}
                          title="Xóa"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

StationTable.propTypes = {
  filteredStations: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  navigate: PropTypes.func.isRequired,
  onStationClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  onRemoteDisable: PropTypes.func.isRequired,
  onRemoteEnable: PropTypes.func.isRequired,
};

export default StationTable;
