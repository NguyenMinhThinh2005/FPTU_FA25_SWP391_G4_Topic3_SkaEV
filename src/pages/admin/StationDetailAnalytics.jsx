import React from 'react';
import { 
  Box, Container, CircularProgress, Tabs, Tab, Alert, Snackbar, Card, CardContent 
} from '@mui/material';
import { useStationDetailAnalytics } from './station-management/hooks/useStationDetailAnalytics';
import StationDetailHeader from './station-management/components/StationDetailHeader';
import ChargingPointsTab from './station-management/components/ChargingPointsTab';
import ErrorLogsTab from './station-management/components/ErrorLogsTab';
import ControlDialog from './station-management/components/ControlDialog';
import ErrorResolutionDialog from './station-management/components/ErrorResolutionDialog';
import AdvancedCharts from '../../components/admin/AdvancedCharts';
import StaffAssignment from '../../components/admin/StaffAssignment';

const StationDetailAnalytics = () => {
  const {
    navigate,
    loading,
    stationDetail,
    errors,
    currentTab,
    setCurrentTab,
    controlDialog,
    setControlDialog,
    errorDialog,
    setErrorDialog,
    snackbar,
    setSnackbar,
    handleControlPost,
    handleControlStation,
    handleResolveError
  } = useStationDetailAnalytics();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stationDetail) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">Không tìm thấy thông tin trạm sạc</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <StationDetailHeader 
        stationDetail={stationDetail} 
        onBack={() => navigate('/admin/stations')}
        onControlStation={(command) => handleControlStation(command)}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab label="Trụ sạc & Trạng thái" />
          <Tab label="Lịch sử lỗi & Sự cố" />
          <Tab label="Phân tích tổng quan" />
          <Tab label="Quản lý Nhân viên" />
        </Tabs>
      </Box>

      {currentTab === 0 && (
        <ChargingPointsTab 
          posts={stationDetail.posts || stationDetail.chargingPoints} 
          onControlClick={(post, type) => setControlDialog({ open: true, target: post, type })}
        />
      )}

      {currentTab === 1 && (
        <ErrorLogsTab 
          errors={errors} 
          onResolveClick={(error) => setErrorDialog({ open: true, error })}
        />
      )}

      {currentTab === 2 && (
        <Box>
          <AdvancedCharts stationId={stationDetail.id || stationDetail.stationId} showEnergy={false} />
        </Box>
      )}

      {currentTab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardContent>
              <StaffAssignment 
                stationId={stationDetail.id || stationDetail.stationId} 
                stationName={stationDetail.name || stationDetail.stationName || 'N/A'}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      <ControlDialog 
        open={controlDialog.open}
        target={controlDialog.target}
        type={controlDialog.type}
        onClose={() => setControlDialog({ ...controlDialog, open: false })}
        onConfirm={handleControlPost}
      />

      <ErrorResolutionDialog 
        open={errorDialog.open}
        error={errorDialog.error}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        onConfirm={handleResolveError}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StationDetailAnalytics;
