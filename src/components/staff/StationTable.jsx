import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Tooltip,
  Checkbox,
  TableSortLabel,
  Box,
  LinearProgress,
  Typography
} from "@mui/material";
import {
  Visibility,
  PowerSettingsNew,
  Build,
  Delete,
  Warning
} from "@mui/icons-material";

export default function StationTable({
  rows = [],
  selected = [],
  onToggle,
  onOpen,
  onMaintenance,
  onDelete,
  onSelectOne,
  onSelectAll,
  orderBy,
  order,
  onSort,
  showActions = true,
  showSelection = false
}) {
  const getStatusColor = (status) => {
    const statusMap = {
      operational: "success",
      charging: "info",
      available: "success",
      maintenance: "warning",
      offline: "error",
      warning: "warning",
      error: "error"
    };
    return statusMap[status] || "default";
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      onSelectAll?.(newSelected);
    } else {
      onSelectAll?.([]);
    }
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    onSelectOne?.(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const createSortHandler = (property) => (event) => {
    onSort?.(event, property);
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {showSelection && (
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selected.length > 0 && selected.length < rows.length}
                checked={rows.length > 0 && selected.length === rows.length}
                onChange={handleSelectAllClick}
              />
            </TableCell>
          )}
          <TableCell>
            <TableSortLabel
              active={orderBy === "name"}
              direction={orderBy === "name" ? order : "asc"}
              onClick={createSortHandler("name")}
            >
              Tên trạm
            </TableSortLabel>
          </TableCell>
          <TableCell>Địa chỉ</TableCell>
          <TableCell align="center">
            <TableSortLabel
              active={orderBy === "status"}
              direction={orderBy === "status" ? order : "asc"}
              onClick={createSortHandler("status")}
            >
              Trạng thái
            </TableSortLabel>
          </TableCell>
          <TableCell align="center">Cổng sạc</TableCell>
          <TableCell align="center">
            <TableSortLabel
              active={orderBy === "utilization"}
              direction={orderBy === "utilization" ? order : "asc"}
              onClick={createSortHandler("utilization")}
            >
              Sử dụng
            </TableSortLabel>
          </TableCell>
          <TableCell align="center">Cảnh báo</TableCell>
          {showActions && <TableCell align="center">Thao tác</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showSelection ? 8 : 7} align="center" sx={{ py: 5 }}>
              <Typography color="text.secondary">
                Không có trạm sạc nào
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((station) => {
            const isItemSelected = isSelected(station.id);
            const utilizationPercent = station.charging?.totalPorts > 0
              ? ((station.charging.totalPorts - station.charging.availablePorts) / station.charging.totalPorts * 100)
              : 0;

            return (
              <TableRow
                key={station.id}
                hover
                onClick={() => onOpen?.(station)}
                sx={{ cursor: "pointer" }}
                selected={isItemSelected}
              >
                {showSelection && (
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isItemSelected}
                      onChange={(event) => handleClick(event, station.id)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {station.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {station.location?.address || station.location || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={station.statusLabel || station.status}
                    color={getStatusColor(station.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {station.charging?.availablePorts || 0}/{station.charging?.totalPorts || 0}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ width: 80, mx: "auto" }}>
                    <LinearProgress
                      variant="determinate"
                      value={utilizationPercent}
                      color={
                        utilizationPercent > 80
                          ? "error"
                          : utilizationPercent > 50
                          ? "warning"
                          : "success"
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      {utilizationPercent.toFixed(0)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {station.alerts?.length > 0 ? (
                    <Chip
                      icon={<Warning />}
                      label={station.alerts.length}
                      size="small"
                      color="warning"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                {showActions && (
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton size="small" color="primary" onClick={() => onOpen?.(station)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bật/Tắt">
                      <IconButton size="small" onClick={() => onToggle?.(station)}>
                        <PowerSettingsNew fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bảo trì">
                      <IconButton size="small" color="warning" onClick={() => onMaintenance?.(station)}>
                        <Build fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton size="small" color="error" onClick={() => onDelete?.(station)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
