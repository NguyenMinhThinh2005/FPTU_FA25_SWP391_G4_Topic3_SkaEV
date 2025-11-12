import React, { useRef, useCallback, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import {
  Box,
  IconButton,
  Typography,
  Button,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  FlashlightOn,
  FlashlightOff,
  ArrowBack,
  Edit,
} from '@mui/icons-material';

/**
 * QRCodeScanner Component
 * 
 * Quét mã QR sử dụng camera thiết bị để bắt đầu phiên sạc
 * 
 * @param {function} onScanSuccess - Callback khi quét thành công (nhận data QR)
 * @param {function} onClose - Callback khi đóng scanner
 * @param {function} onManualInput - Callback khi chọn nhập thủ công
 */
const QRCodeScannerV2 = ({ onScanSuccess, onClose, onManualInput }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState(null);

  console.log('🎥🎥🎥 QRCodeScannerV2 COMPONENT MOUNTED! 🎥🎥🎥');
  console.log('📷 QRCodeScannerV2 rendered - hasPermission:', hasPermission);

  // Video constraints cho camera sau
  const videoConstraints = {
    facingMode: 'environment', // Camera sau
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  /**
   * Hàm quét mã QR từ video stream
   */
  const scanQRCode = useCallback(() => {
    if (!webcamRef.current || !canvasRef.current) {
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size khớp với video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Vẽ video frame lên canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Lấy image data để jsQR phân tích
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Quét mã QR
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      console.log('✅ QR Code detected:', code.data);
      
      // Dừng quét
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }

      setIsScanning(false);

      // Parse QR data
      try {
        let parsedData;
        
        // Thử parse JSON nếu có thể
        try {
          parsedData = JSON.parse(code.data);
        } catch {
          // Nếu không phải JSON, giả định format: "stationId:connectorId"
          const parts = code.data.split(':');
          if (parts.length >= 2) {
            parsedData = {
              stationId: parts[0],
              connectorId: parts[1],
            };
          } else {
            parsedData = { raw: code.data };
          }
        }

        // Gọi callback với dữ liệu đã parse
        onScanSuccess(parsedData);
      } catch (parseError) {
        console.error('❌ Error parsing QR data:', parseError);
        setError('Mã QR không hợp lệ. Vui lòng thử lại.');
        setIsScanning(true);
        requestRef.current = requestAnimationFrame(scanQRCode);
      }
    } else {
      // Tiếp tục quét
      requestRef.current = requestAnimationFrame(scanQRCode);
    }
  }, [onScanSuccess]);

  /**
   * Bắt đầu quét khi component mount
   */
  useEffect(() => {
    setIsScanning(true);
    requestRef.current = requestAnimationFrame(scanQRCode);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [scanQRCode]);

  /**
   * Xử lý khi user cho phép/từ chối camera
   */
  const handleUserMedia = useCallback(() => {
    console.log('✅ Camera permission granted - handleUserMedia called');
    setHasPermission(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((error) => {
    console.error('❌ Camera permission denied or error - handleUserMediaError:', error);
    setHasPermission(false);
    
    let errorMessage = 'Không thể truy cập camera.';
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = 'Không tìm thấy camera trên thiết bị.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác.';
    }
    
    setError(errorMessage);
  }, []);

  /**
   * Toggle đèn flash (chỉ hoạt động trên một số thiết bị)
   */
  const toggleFlash = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video) {
      return;
    }

    try {
      const stream = webcamRef.current.video.srcObject;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled }],
        });
        setFlashEnabled(!flashEnabled);
      } else {
        console.warn('⚠️ Flash not supported on this device');
        setError('Thiết bị này không hỗ trợ đèn flash');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('❌ Error toggling flash:', err);
    }
  }, [flashEnabled]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'black',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          🎥 CAMERA QRCodeScannerV2 🎥
        </Typography>
        <IconButton onClick={toggleFlash} sx={{ color: 'white' }}>
          {flashEnabled ? <FlashlightOn /> : <FlashlightOff />}
        </IconButton>
      </Box>

      {/* Camera View */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasPermission === false ? (
          <Paper
            sx={{
              p: 4,
              maxWidth: 400,
              textAlign: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <Typography variant="h6" gutterBottom color="error">
              Không thể truy cập camera
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {error || 'Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt để sử dụng tính năng quét QR.'}
            </Typography>
            <Button variant="contained" onClick={onClose}>
              Đóng
            </Button>
          </Paper>
        ) : (
          <>
            {console.log('🎥 Rendering Webcam component')}
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Canvas ẩn để xử lý image data */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />

            {/* Viewfinder Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '280px',
                height: '280px',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '16px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  border: '4px solid #4CAF50',
                },
                '&::before': {
                  top: -4,
                  left: -4,
                  borderRight: 'none',
                  borderBottom: 'none',
                },
                '&::after': {
                  top: -4,
                  right: -4,
                  borderLeft: 'none',
                  borderBottom: 'none',
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  left: -4,
                  width: '20px',
                  height: '20px',
                  border: '4px solid #4CAF50',
                  borderRight: 'none',
                  borderTop: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: '20px',
                  height: '20px',
                  border: '4px solid #4CAF50',
                  borderLeft: 'none',
                  borderTop: 'none',
                }}
              />
            </Box>

            {/* Instruction Text */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 160,
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
              }}
            >
              {hasPermission === null ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 500,
                  }}
                >
                  <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                  Đang yêu cầu quyền truy cập camera...
                </Typography>
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 500,
                  }}
                >
                  {isScanning ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                      Đưa mã QR vào khung hình
                    </>
                  ) : (
                    'Đang xử lý...'
                  )}
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            right: 16,
            zIndex: 10001,
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Manual Input Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Button
          variant="text"
          startIcon={<Edit />}
          onClick={onManualInput}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Nhập mã cổng sạc thủ công
        </Button>
      </Box>
    </Box>
  );
};

export default QRCodeScannerV2;
