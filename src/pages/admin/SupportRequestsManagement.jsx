import React from "react";
import { Box, Container, Alert, Snackbar, CircularProgress } from "@mui/material";
import { useSupportRequestsManagement } from "./support-requests-management/hooks/useSupportRequestsManagement";
import SupportRequestHeader from "./support-requests-management/components/SupportRequestHeader";
import SupportRequestStats from "./support-requests-management/components/SupportRequestStats";
import SupportRequestFilters from "./support-requests-management/components/SupportRequestFilters";
import SupportRequestTable from "./support-requests-management/components/SupportRequestTable";
import { 
  SupportRequestDetailDialog, 
  AssignStaffDialog, 
  ResolveDialog 
} from "./support-requests-management/components/SupportRequestDialog";

const SupportRequestsManagement = () => {
  const {
    loading,
    staff,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    selectedRequest,
    setSelectedRequest,
    detailDialogOpen,
    setDetailDialogOpen,
    assignDialogOpen,
    setAssignDialogOpen,
    resolveDialogOpen,
    setResolveDialogOpen,
    selectedStaffId,
    setSelectedStaffId,
    resolutionNotes,
    setResolutionNotes,
    snackbar,
    setSnackbar,
    handleAssignStaff,
    handleResolve,
    getUserName,
    getStaffName,
    filteredRequests,
    stats,
    fetchRequests
  } = useSupportRequestsManagement();

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const handleOpenAssign = (request) => {
    setSelectedRequest(request);
    setSelectedStaffId(request.assignedTo || "");
    setAssignDialogOpen(true);
  };

  const handleOpenResolve = (request) => {
    setSelectedRequest(request);
    setResolutionNotes(request.resolutionNotes || "");
    setResolveDialogOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <SupportRequestHeader onRefresh={() => fetchRequests && fetchRequests()} />

      <SupportRequestStats stats={stats} />

      <SupportRequestFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      ) : (
        <SupportRequestTable
          requests={filteredRequests}
          getUserName={getUserName}
          getStaffName={getStaffName}
          onViewDetail={handleViewDetail}
          onAssign={handleOpenAssign}
          onResolve={handleOpenResolve}
        />
      )}

      <SupportRequestDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        request={selectedRequest}
        getUserName={getUserName}
        getStaffName={getStaffName}
      />

      <AssignStaffDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        staffList={staff}
        selectedStaffId={selectedStaffId}
        setSelectedStaffId={setSelectedStaffId}
        onConfirm={handleAssignStaff}
      />

      <ResolveDialog
        open={resolveDialogOpen}
        onClose={() => setResolveDialogOpen(false)}
        resolutionNotes={resolutionNotes}
        setResolutionNotes={setResolutionNotes}
        onConfirm={handleResolve}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SupportRequestsManagement;
