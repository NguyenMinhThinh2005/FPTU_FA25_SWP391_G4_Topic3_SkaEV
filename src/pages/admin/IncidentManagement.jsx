import React from 'react';
import { Box, Alert } from '@mui/material';
import { useIncidentManagement } from './incident-management/hooks/useIncidentManagement';
import IncidentManagementHeader from './incident-management/components/IncidentManagementHeader';
import IncidentStats from './incident-management/components/IncidentStats';
import IncidentFilters from './incident-management/components/IncidentFilters';
import IncidentTable from './incident-management/components/IncidentTable';
import IncidentDialog from './incident-management/components/IncidentDialog';

const IncidentManagementPage = () => {
  const {
    incidents,
    selectedIncident,
    stats,
    isLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    clearError,
    stations,
    openDialog,
    dialogMode,
    formData,
    setFormData,
    updateData,
    setUpdateData,
    staffOptions,
    teamOptions,
    handleOpenDialog,
    handleCloseDialog,
    handleCreateSubmit,
    handleUpdateSubmit
  } = useIncidentManagement();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <IncidentManagementHeader onCreate={() => handleOpenDialog('create')} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <IncidentStats stats={stats} />

      <IncidentFilters 
        filters={filters} 
        setFilters={setFilters} 
        clearFilters={clearFilters} 
      />

      <IncidentTable 
        incidents={incidents} 
        isLoading={isLoading} 
        onOpenDialog={handleOpenDialog} 
      />

      <IncidentDialog
        open={openDialog}
        onClose={handleCloseDialog}
        mode={dialogMode}
        selectedIncident={selectedIncident}
        formData={formData}
        setFormData={setFormData}
        updateData={updateData}
        setUpdateData={setUpdateData}
        stations={stations}
        staffOptions={staffOptions}
        teamOptions={teamOptions}
        onCreateSubmit={handleCreateSubmit}
        onUpdateSubmit={handleUpdateSubmit}
      />
    </Box>
  );
};

export default IncidentManagementPage;
