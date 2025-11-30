import React from "react";
import {
  Box,
  Grid,
  LinearProgress,
  Alert,
  Snackbar,
  Fab,
  Container,
} from "@mui/material";
import { Notifications } from "@mui/icons-material";
import { useDashboardLogic } from "./dashboard/hooks/useDashboardLogic";
import DashboardHeader from "./dashboard/components/DashboardHeader";
import DashboardFilters from "./dashboard/components/DashboardFilters";
import StationList from "./dashboard/components/StationList";
import StationDetailsPanel from "./dashboard/components/StationDetailsPanel";
import QuickActions from "./dashboard/components/QuickActions";
import ActionDialogs from "./dashboard/components/ActionDialogs";

const AdminDashboard = () => {
  const {
    navigate,
    setOpenStationDialog,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedStationForDetail,
    setSelectedStationForDetail,
    actionDialog,
    setActionDialog,
    successMessage,
    showSuccess,
    setShowSuccess,
    dashboardLoading,
    dashboardError,
    filteredStations,
    handleActionComplete,
  } = useDashboardLogic();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <DashboardHeader />

      <DashboardFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {dashboardLoading && <LinearProgress color="primary" sx={{ mb: 2 }} />}

      {dashboardError && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">
            Lỗi tải dữ liệu tổng quan: {dashboardError?.message || dashboardError?.details || JSON.stringify(dashboardError)}
          </Alert>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={9}>
          <StationList
            filteredStations={filteredStations}
            selectedStationForDetail={selectedStationForDetail}
            navigate={navigate}
            setSelectedStationForDetail={setSelectedStationForDetail}
          />
        </Grid>

        <Grid item xs={12} lg={3}>
          <StationDetailsPanel
            selectedStationForDetail={selectedStationForDetail}
          />

          <QuickActions navigate={navigate} />
        </Grid>
      </Grid>

      <ActionDialogs
        actionDialog={actionDialog}
        setActionDialog={setActionDialog}
        handleActionComplete={handleActionComplete}
      />

      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setOpenStationDialog(true)}
      >
        <Notifications />
      </Fab>
    </Container>
  );
};

export default AdminDashboard;
