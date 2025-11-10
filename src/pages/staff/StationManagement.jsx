/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  ToggleButtonGroup,
  ToggleButton,
  Drawer,
  Divider,
  Stack,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  TablePagination,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  TableChart,
  ViewModule,
  Map as MapIcon,
  Close,
  FileDownload,
  PowerSettingsNew,
  Build,
  Delete,
  Warning,
  Info,
  CheckCircle,
} from "@mui/icons-material";
import {
  StationFilters,
  StationTable,
  StationCard,
} from "../../components/staff";
import useStationStore from '../../store/stationStore';
import useAuthStore from '../../store/authStore';

const StationManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Stores
  const stationStore = useStationStore();
  const authStore = useAuthStore();

  // Local helper states
  const [viewMode, setViewMode] = useState("table"); // table | card | map
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedStations, setSelectedStations] = useState([]);
  const { stations, loading } = stationStore;
  const [selectedStation, setSelectedStation] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [maintenanceDialog, setMaintenanceDialog] = useState({ open: false, station: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, station: null });

  // If staff/admin, load appropriate stations from store

  useEffect(() => {
    const load = async () => {
      if (authStore && typeof authStore.isAdmin === 'function' && authStore.isAdmin()) {
        await stationStore.fetchAdminStations();
      } else {
        await stationStore.fetchStations();
      }
    };

    load();
    
    // Check if navigated from dashboard with selected station
    if (location.state?.selectedStation) {
      handleOpenDetail(location.state.selectedStation);
    }
    
    // Check if filtered by status
    if (location.state?.filterStatus) {
      setStatusFilter(location.state.filterStatus);
    }
  }, []);

  // Station data is loaded from store (see useEffect)

  const filteredStations = (stations || []).filter((station) => {
    const matchSearch =
      !searchQuery ||
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || station.status === statusFilter;
    const matchLocation =
      locationFilter === "all" ||
      station.location.address.includes(locationFilter);

    return matchSearch && matchStatus && matchLocation;
  });

  const sortedStations = [...filteredStations].sort((a, b) => {
    const isAsc = order === "asc";
    if (orderBy === "name") {
      return isAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (orderBy === "status") {
      return isAsc
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    if (orderBy === "utilization") {
      const aUtil = a.charging.totalPorts > 0
        ? ((a.charging.totalPorts - a.charging.availablePorts) / a.charging.totalPorts) * 100
        : 0;
      const bUtil = b.charging.totalPorts > 0
        ? ((b.charging.totalPorts - b.charging.availablePorts) / b.charging.totalPorts) * 100
        : 0;
      return isAsc ? aUtil - bUtil : bUtil - aUtil;
    }
    return 0;
  });

  const paginatedStations = sortedStations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleOpenDetail = (station) => {
    setSelectedStation(station);
    setDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedStation(null), 300);
  };

  const handleToggleStation = (station) => {
    setSnackbar({
      open: true,
      message: `Đã ${station.status === "operational" ? "tắt" : "bật"} trạm ${station.name}`,
      severity: "success",
    });
  };

  const handleOpenMaintenance = (station) => {
    setMaintenanceDialog({ open: true, station });
  };

  const handleScheduleMaintenance = () => {
    setSnackbar({
      open: true,
      message: `Đã lên lịch bảo trì cho ${maintenanceDialog.station.name}`,
      severity: "success",
    });
    setMaintenanceDialog({ open: false, station: null });
  };

  const handleDeleteStation = (station) => {
    setDeleteDialog({ open: true, station });
  };

  const handleConfirmDelete = () => {
    setSnackbar({
      open: true,
      message: `Đã xóa trạm ${deleteDialog.station.name}`,
      severity: "success",
    });
    (async () => {
      try {
        await stationStore.deleteStation(deleteDialog.station.id);
        if (authStore && typeof authStore.isAdmin === 'function' && authStore.isAdmin()) {
          await stationStore.fetchAdminStations();
        } else {
          await stationStore.fetchStations();
        }
      } catch (err) {
        console.error('Delete station failed:', err);
      }
    })();
    setDeleteDialog({ open: false, station: null });
  };

  const handleExportCSV = () => {
    setSnackbar({
      open: true,
      message: "Đang xuất dữ liệu...",
      severity: "info",
    });
  };

  const handleSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setLocationFilter("all");
  };

  const locations = [...new Set((stations || []).map((s) => (s.location?.address || '').split(",").pop().trim()))];

  return (
    <Container maxWidth="xl">
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Quản lý trạm sạc
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Quản lý chi tiết {(stations || []).length} trạm
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleExportCSV}
            >
              Xuất CSV
            </Button>
            {selectedStations.length > 0 && (
              <Chip
                label={`${selectedStations.length} trạm được chọn`}
                color="primary"
                onDelete={() => setSelectedStations([])}
              />
            )}
          </Stack>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <StationFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
              locations={locations}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {paginatedStations.length} / {filteredStations.length} trạm
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="table">
              <TableChart fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card">
              <ViewModule fontSize="small" />
            </ToggleButton>
            <ToggleButton value="map">
              <MapIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Content */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {viewMode === "table" && (
              <>
                <StationTable
                  rows={paginatedStations}
                  selected={selectedStations}
                  onSelectOne={setSelectedStations}
                  onSelectAll={setSelectedStations}
                  onToggle={handleToggleStation}
                  onOpen={handleOpenDetail}
                  onMaintenance={handleOpenMaintenance}
                  onDelete={handleDeleteStation}
                  orderBy={orderBy}
                  order={order}
                  onSort={handleSort}
                  showActions={true}
                  showSelection={true}
                />
                <TablePagination
                  component="div"
                  count={filteredStations.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  labelRowsPerPage="Số hàng mỗi trang:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} trong ${count}`
                  }
                />
              </>
            )}

            {viewMode === "card" && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {paginatedStations.map((station) => (
                    <Grid item xs={12} md={6} lg={4} key={station.id}>
                      <StationCard
                        station={station}
                        compact={false}
                        onOpen={handleOpenDetail}
                        showActions={true}
                      />
                    </Grid>
                  ))}
                </Grid>
                <TablePagination
                  component="div"
                  count={filteredStations.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  labelRowsPerPage="Số hàng mỗi trang:"
                />
              </Box>
            )}

            {viewMode === "map" && (
              <Box sx={{ p: 3, textAlign: "center", minHeight: 400 }}>
                <MapIcon sx={{ fontSize: 64, color: "action.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Chế độ xem bản đồ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tính năng đang được phát triển
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Detail Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleCloseDetail}
          sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 480 } } }}
        >
          {selectedStation && (
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                borderBottom={1}
                borderColor="divider"
              >
                <Typography variant="h6" fontWeight={600}>
                  Chi tiết trạm
                </Typography>
                <IconButton onClick={handleCloseDetail}>
                  <Close />
                </IconButton>
              </Box>

              <Box p={3}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {selectedStation.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedStation.location.address}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Tabs value={0} sx={{ mb: 2 }}>
                  <Tab label="Thông tin" />
                  <Tab label="Cổng sạc" />
                  <Tab label="Bảo trì" />
                </Tabs>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Trạng thái
                    </Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={selectedStation.statusLabel}
                        color={
                          selectedStation.status === "operational"
                            ? "success"
                            : selectedStation.status === "maintenance"
                            ? "warning"
                            : "error"
                        }
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Cổng sạc
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedStation.charging.availablePorts}/{selectedStation.charging.totalPorts} cổng
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Doanh thu tháng
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedStation.monthlyRevenue.toLocaleString("vi-VN")} VNĐ
                    </Typography>
                  </Box>

                  {selectedStation.alerts?.length > 0 && (
                    <Alert severity="warning" icon={<Warning />}>
                      <Typography variant="body2">
                        {selectedStation.alerts[0].message}
                      </Typography>
                    </Alert>
                  )}

                  <Divider />

                  <Stack spacing={1}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PowerSettingsNew />}
                      onClick={() => handleToggleStation(selectedStation)}
                    >
                      Bật/Tắt trạm
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Build />}
                      onClick={() => handleOpenMaintenance(selectedStation)}
                    >
                      Lên lịch bảo trì
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          )}
        </Drawer>

        {/* Maintenance Dialog */}
        <Dialog
          open={maintenanceDialog.open}
          onClose={() => setMaintenanceDialog({ open: false, station: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Lên lịch bảo trì</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Tên trạm"
                value={maintenanceDialog.station?.name || ""}
                disabled
              />
              <TextField
                fullWidth
                label="Ngày bảo trì"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Thời gian"
                type="time"
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Mức độ ưu tiên</InputLabel>
                <Select label="Mức độ ưu tiên" defaultValue="medium">
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                  <MenuItem value="urgent">Khẩn cấp</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMaintenanceDialog({ open: false, station: null })}>
              Hủy
            </Button>
            <Button variant="contained" onClick={handleScheduleMaintenance}>
              Xác nhận
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, station: null })}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Hành động này không thể hoàn tác!
            </Alert>
            <Typography>
              Bạn có chắc chắn muốn xóa trạm{" "}
              <strong>{deleteDialog.station?.name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, station: null })}>
              Hủy
            </Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default StationManagement;
