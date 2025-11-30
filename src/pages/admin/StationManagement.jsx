import React from "react";
import { Box } from "@mui/material";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useStationManagement } from "./station-management/hooks/useStationManagement";
import StationManagementHeader from "./station-management/components/StationManagementHeader";
import StationStats from "./station-management/components/StationStats";
import StationTable from "./station-management/components/StationTable";
import StationDialog from "./station-management/components/StationDialog";


const StationManagement = () => {
  const {
    navigate,
    users,
    selectedStation,
    dialogOpen,
    setDialogOpen,
    filterStatus,
    setFilterStatus,
    deleteDialog,
    setDeleteDialog,
    stationForm,
    setStationForm,
    errors,
    setErrors,
    lastUpdated,
    staffUsers,
    filteredStations,
    handleStationClick,
    handleCreateNew,
    handleDeleteClick,
    handleDeleteConfirm,
    handleSaveStation,
    remoteDisableStation,
    remoteEnableStation
  } = useStationManagement();

  return (
    <Box>
      <StationManagementHeader 
        filterStatus={filterStatus} 
        setFilterStatus={setFilterStatus} 
        onCreateNew={handleCreateNew} 
      />

      <StationStats 
        filteredStations={filteredStations} 
        lastUpdated={lastUpdated} 
      />

      <StationTable 
        filteredStations={filteredStations}
        users={users}
        navigate={navigate}
        onStationClick={handleStationClick}
        onDeleteClick={handleDeleteClick}
        onRemoteDisable={remoteDisableStation}
        onRemoteEnable={remoteEnableStation}
      />

      <StationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedStation={selectedStation}
        stationForm={stationForm}
        setStationForm={setStationForm}
        errors={errors}
        setErrors={setErrors}
        staffUsers={staffUsers}
        handleSaveStation={handleSaveStation}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Xác nhận xóa (lưu trữ)"
        message={`Hành động này sẽ lưu trữ trạm sạc "${deleteDialog.stationName}" (soft-delete). Trạm có thể được khôi phục từ trang quản trị nếu cần.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, stationId: null, stationName: "" })}
      />
    </Box>
  );
};

export default StationManagement;
