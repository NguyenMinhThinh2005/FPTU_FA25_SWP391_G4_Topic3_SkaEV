import { useState, useEffect } from 'react';
import incidentStore from '../../../../store/incidentStore';
import stationStore from '../../../../store/stationStore';
import axiosInstance from '../../../../services/axiosConfig';
import stationStaffAPI from '../../../../services/stationStaffAPI';

export const useIncidentManagement = () => {
  const {
    incidents,
    selectedIncident,
    stats,
    isLoading,
    error,
    filters,
    fetchIncidents,
    fetchIncidentById,
    createIncident,
    updateIncident,
    fetchStats,
    setFilters,
    clearFilters,
    clearSelectedIncident,
    clearError
  } = incidentStore();

  const { stations, fetchStations } = stationStore();

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // view, create, edit
  const [formData, setFormData] = useState({
    stationId: '',
    postId: null,
    slotId: null,
    reportedByUserId: null,
    incidentType: 'equipment_failure',
    severity: 'medium',
    title: '',
    description: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    resolutionNotes: '',
    assignedToStaffId: null,
    assignedToTeamId: null
  });

  const [staffOptions, setStaffOptions] = useState([]);
  const [teamOptions, setTeamOptions] = useState([]);

  useEffect(() => {
    fetchIncidents();
    fetchStats();
    fetchStations();
    // fetch staff and maintenance teams for assignment dropdown
    (async () => {
      try {
        // Use StationStaff API to fetch only operational staff (active + assigned stations)
        const [staffList, teamsRes] = await Promise.all([
          stationStaffAPI.getAvailableStaff(),
          axiosInstance.get('/maintenance/teams')
        ]);

        // Normalize returned shapes (support both camelCase and PascalCase from different endpoints)
        const normalizedStaff = (staffList || []).map((s) => ({
          userId: s.userId ?? s.UserId,
          fullName: s.fullName ?? s.FullName
        }));

        setStaffOptions(normalizedStaff);
        setTeamOptions(teamsRes.data || []);
      } catch (err) {
        // non-fatal: log and continue
        console.error('Failed to fetch staff/teams for assignment', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      setTimeout(() => clearError(), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const handleOpenDialog = (mode, incident = null) => {
    setDialogMode(mode);
    if (mode === 'create') {
      setFormData({
        stationId: '',
        postId: null,
        slotId: null,
        reportedByUserId: null,
        incidentType: 'equipment_failure',
        severity: 'medium',
        title: '',
        description: ''
      });
    } else if (mode === 'view' || mode === 'edit') {
      fetchIncidentById(incident.incidentId);
      if (mode === 'edit') {
        setUpdateData({
          status: incident.status,
          resolutionNotes: '',
          assignedToStaffId: incident.assignedToStaffId,
          assignedToTeamId: incident.assignedToTeamId || null
        });
      }
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    clearSelectedIncident();
  };

  const handleCreateSubmit = async () => {
    try {
      await createIncident(formData);
      handleCloseDialog();
      fetchStats();
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      await updateIncident(selectedIncident.incidentId, updateData);
      handleCloseDialog();
      fetchStats();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return {
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
    setOpenDialog,
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
  };
};
