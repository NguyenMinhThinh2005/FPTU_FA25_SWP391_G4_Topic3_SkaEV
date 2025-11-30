import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  LocationOn,
  Power,
  CreditCard,
  Warning,
  Error as ErrorIcon,
  WifiOff,
  Close,
  Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import QRCodeScannerV2 from '../../components/ui/QRCodeScanner/QRCodeScannerV2';

/**
 * StartChargingPage Component
 * 
 * Trang bắt đầu phiên sạc qua QR Code
 * Quản lý flow: Quét QR → Xác nhận → Bắt đầu sạc
 */
const StartChargingPage = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(true);
  // scannedData was removed since it's not used elsewhere; scanner flow manages UI directly
  const [errorModal, setErrorModal] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Mock data - trong thực tế sẽ fetch từ API
  const [stationInfo] = useState({
    stationId: 'S001',
    stationName: 'Trạm Sạc Vincom Q1',
    address: '72 Lê Thánh Tôn, Quận 1, TP.HCM',
  });

  const [connectorInfo] = useState({
    connectorId: 'A02',
    type: '22kW AC',
    status: 'available',
    price: '3,500 VNĐ/kWh',
  });

  const [paymentMethod] = useState({
    type: 'visa',
    last4: '1234',
    isValid: true,
  });

  /**
   * Xử lý khi quét QR thành công
   */
  const handleScanSuccess = (data) => {
    console.log('📱 Scanned QR data:', data);
    setShowScanner(false);
  };

  /**
   * Đóng scanner và quay lại
   */
  const handleCloseScanner = () => {
    setShowScanner(false);
    navigate(-1); // Quay lại trang trước
  };

  /**
   * Mở modal nhập thủ công
   */
  const handleManualInput = () => {
    setShowScanner(false);
    // TODO: Mở modal nhập thủ công
    alert('Tính năng nhập thủ công đang được phát triển');
  };

  /**
   * Quay lại quét lại
   */
  const handleRescan = () => {
    setScannedData(null);
    setShowScanner(true);
    setErrorModal(null);
  };

  /**
   * Hủy và quay lại
   */
  const handleCancel = () => {
    setScannedData(null);
    navigate(-1);
  };

  /**
   * Bắt đầu sạc
   */
  const handleStartCharging = async () => {
    setIsStarting(true);

    // Simulate API call
    try {
      // Mock validation logic
      const validationResult = await validateAndStartCharging();

      if (validationResult.success) {
        // Chuyển đến trang theo dõi sạc
        navigate('/customer/charging-status', {
          state: {
            sessionId: validationResult.sessionId,
            stationInfo,
            connectorInfo,
          },
        });
      } else {
        // Hiển thị modal lỗi tương ứng
        setErrorModal(validationResult.error);
      }
    } catch (error) {
      console.error('❌ Error starting charging:', error);
      setErrorModal({
        type: 'connection',
        title: 'Lỗi kết nối',
        message: 'Không thể gửi lệnh đến trụ sạc. Vui lòng kiểm tra kết nối và thử lại.',
      });
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * Mock function validate và bắt đầu sạc
   */
  const validateAndStartCharging = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate random error for demo
        const random = Math.random();

        if (random < 0.3) {
          // 30% chance: Connector busy
          resolve({
            success: false,
            error: {
              type: 'connector_busy',
              title: 'Cổng đang bận',
              message: `Cổng sạc ${connectorInfo.connectorId} hiện đang được sử dụng bởi người khác. Vui lòng chọn cổng khác hoặc quay lại sau.`,
            },
          });
        } else if (random < 0.5) {
          // 20% chance: No payment method
          resolve({
            success: false,
            error: {
              type: 'no_payment',
              title: 'Chưa có phương thức thanh toán',
              message: 'Tài khoản của bạn chưa có phương thức thanh toán hợp lệ. Vui lòng thêm thẻ thanh toán để tiếp tục.',
            },
          });
        } else if (random < 0.6) {
          // 10% chance: Connection error
          resolve({
            success: false,
            error: {
              type: 'connection',
              title: 'Lỗi kết nối',
              message: 'Không thể gửi lệnh đến trụ sạc. Vui lòng kiểm tra kết nối internet và GPS, sau đó thử lại.',
            },
          });
        } else {
          // 40% chance: Success
          resolve({
            success: true,
            sessionId: 'CS' + Date.now(),
          });
        }
      }, 1500);
    });
  };

  /**
   * Đóng modal lỗi
   */
  const handleCloseErrorModal = () => {
    setErrorModal(null);
  };

  /**
   * Chuyển đến trang cài đặt thanh toán
   */
  const handleGoToPaymentSettings = () => {
    navigate('/customer/payment-methods');
  };

  /**
   * Render Error Modal
   */
  const renderErrorModal = () => {
    if (!errorModal) return null;

    const icons = {
      connector_busy: <Warning sx={{ fontSize: 60, color: 'warning.main' }} />,
      no_payment: <Warning sx={{ fontSize: 60, color: 'warning.main' }} />,
      connection: <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />,
    };

    return (
      <Dialog
        open={!!errorModal}
        onClose={handleCloseErrorModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              {errorModal.title}
            </Typography>
            <IconButton onClick={handleCloseErrorModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {icons[errorModal.type]}
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              {errorModal.message}
            </Typography>

            {errorModal.type === 'connection' && (
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Vui lòng kiểm tra:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  <li>Kết nối internet</li>
                  <li>Bật GPS/Định vị</li>
                  <li>Ở gần trụ sạc</li>
                </Box>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {errorModal.type === 'no_payment' ? (
            <>
              <Button onClick={handleCloseErrorModal} color="inherit">
                Hủy
              </Button>
              <Button
                variant="contained"
                startIcon={<CreditCard />}
                onClick={handleGoToPaymentSettings}
              >
                Đi đến Cài đặt
              </Button>
            </>
          ) : errorModal.type === 'connection' ? (
            <>
              <Button onClick={handleCloseErrorModal} color="inherit">
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleCloseErrorModal();
                  handleStartCharging();
                }}
              >
                🔄 Thử lại
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={handleCloseErrorModal} fullWidth>
              Đã hiểu
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  // Hiển thị QR Scanner
  if (showScanner) {
    return (
      <QRCodeScannerV2
        onScanSuccess={handleScanSuccess}
        onClose={handleCloseScanner}
        onManualInput={handleManualInput}
      />
    );
  }

  // Hiển thị màn hình xác nhận sau khi quét QR
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* Success Message */}
      <Alert
        icon={<CheckCircle />}
        severity="success"
        sx={{
          mb: 3,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            fontSize: 32,
          },
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          ✅ Quét mã thành công!
        </Typography>
        <Typography variant="body2">
          Vui lòng kiểm tra thông tin và xác nhận để bắt đầu sạc
        </Typography>
      </Alert>

      {/* Station Info */}
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="overline" fontWeight="bold" color="text.secondary">
              Thông tin trạm sạc
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {stationInfo.stationName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stationInfo.address}
          </Typography>
        </CardContent>
      </Card>

      {/* Connector Info */}
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Power sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="overline" fontWeight="bold" color="text.secondary">
              Thông tin cổng sạc
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Cổng:
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {connectorInfo.connectorId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Loại:
            </Typography>
            <Typography variant="body1" fontWeight="600">
              {connectorInfo.type}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Trạng thái:
            </Typography>
            <Chip
              label="🟢 Sẵn sàng"
              size="small"
              color="success"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Đơn giá:
            </Typography>
            <Typography variant="body1" fontWeight="600" color="primary">
              {connectorInfo.price}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CreditCard sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="overline" fontWeight="bold" color="text.secondary">
              Phương thức thanh toán
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body1" fontWeight="600">
                Thẻ Visa ****{paymentMethod.last4}
              </Typography>
              <Chip label="Mặc định" size="small" color="primary" sx={{ mt: 0.5 }} />
            </Box>
            <Button
              size="small"
              startIcon={<Edit />}
              onClick={() => navigate('/customer/payment-methods')}
            >
              Thay đổi
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleStartCharging}
          disabled={isStarting}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            bgcolor: 'success.main',
            '&:hover': {
              bgcolor: 'success.dark',
            },
          }}
        >
          {isStarting ? '⏳ Đang xử lý...' : '🚗 BẮT ĐẦU SẠC NGAY'}
        </Button>

        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={handleCancel}
          disabled={isStarting}
        >
          Hủy
        </Button>

        <Button
          size="small"
          onClick={handleRescan}
          disabled={isStarting}
          sx={{ alignSelf: 'center' }}
        >
          Quét lại mã QR
        </Button>
      </Box>

      {/* Error Modal */}
      {renderErrorModal()}
    </Container>
  );
};

export default StartChargingPage;
