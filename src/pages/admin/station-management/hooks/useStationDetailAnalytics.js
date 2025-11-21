import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminStationAPI from '../../../../services/adminStationAPI';

export const useStationDetailAnalytics = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [stationDetail, setStationDetail] = useState(null);
  const [errors, setErrors] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);

  // Dialog states
  const [controlDialog, setControlDialog] = useState({ open: false, target: null, type: '' });
  const [errorDialog, setErrorDialog] = useState({ open: false, error: null });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchStationData = useCallback(async () => {
    try {
      const [detailRes, errorsRes] = await Promise.all([
        adminStationAPI.getStationDetail(stationId),
        adminStationAPI.getStationErrors(stationId, false),
      ]);

      if (detailRes.success) setStationDetail(detailRes.data);
      if (errorsRes.success) setErrors(errorsRes.data);
    } catch (error) {
      console.error('Error fetching station data:', error);
      showSnackbar('Lỗi tải dữ liệu trạm', 'error');
    } finally {
      setLoading(false);
    }
  }, [stationId, showSnackbar]);

  useEffect(() => {
    fetchStationData();
  }, [fetchStationData]);

  const handleControlPost = async (postId, command) => {
    try {
      const reason = `Admin manual ${command} from dashboard`;
      const response = await adminStationAPI.controlChargingPoint(postId, command, reason);
      
      if (response.success) {
        showSnackbar(response.data.message, 'success');
        fetchStationData();
      } else {
        showSnackbar('Lỗi điều khiển trụ sạc', 'error');
      }
    } catch (error) {
      console.error('Control error:', error);
      showSnackbar('Lỗi kết nối với server', 'error');
    }
    setControlDialog({ open: false, target: null, type: '' });
  };

  const handleControlStation = async (command) => {
    try {
      const reason = `Admin manual ${command} from station detail`;
      const response = await adminStationAPI.controlStation(stationId, command, reason);
      
      if (response.success) {
        showSnackbar(response.data.message, 'success');
        fetchStationData();
      } else {
        showSnackbar('Lỗi điều khiển trạm', 'error');
      }
    } catch (error) {
      console.error('Control error:', error);
      showSnackbar('Lỗi kết nối với server', 'error');
    }
  };

  const handleResolveError = async (errorLogId, resolution) => {
    try {
      const response = await adminStationAPI.resolveError(errorLogId, resolution);
      
      if (response.success) {
        showSnackbar('Lỗi đã được đánh dấu xử lý', 'success');
        fetchStationData();
      } else {
        showSnackbar('Lỗi cập nhật trạng thái', 'error');
      }
    } catch (error) {
      console.error('Resolve error:', error);
      showSnackbar('Lỗi kết nối với server', 'error');
    }
    setErrorDialog({ open: false, error: null });
  };

  return {
    stationId,
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
  };
};
