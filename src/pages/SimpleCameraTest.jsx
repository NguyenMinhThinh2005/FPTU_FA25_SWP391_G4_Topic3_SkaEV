import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, Typography, Alert, Container } from '@mui/material';

/**
 * Simple Camera Test
 */
const SimpleCameraTest = () => {
  const webcamRef = useRef(null);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const videoConstraints = {
    facingMode: 'user', // Front camera để dễ test
    width: 1280,
    height: 720,
  };

  const handleUserMedia = () => {
    console.log('✅ Camera permission granted!');
    setHasPermission(true);
    setError(null);
  };

  const handleUserMediaError = (err) => {
    console.error('❌ Camera error:', err);
    setError(`Camera error: ${err.message || err.toString()}`);
    setHasPermission(false);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Simple Camera Test
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {hasPermission && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Camera đã kết nối thành công!
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={() => setShowCamera(!showCamera)}
        sx={{ mb: 3 }}
      >
        {showCamera ? '❌ Tắt Camera' : '📷 Bật Camera'}
      </Button>

      {showCamera && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 640,
            mx: 'auto',
            bgcolor: 'black',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </Box>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Hướng dẫn:</strong>
          <ul>
            <li>Nhấn "Bật Camera" để test</li>
            <li>Trình duyệt sẽ hỏi quyền truy cập camera</li>
            <li>Cho phép để xem camera hoạt động</li>
            <li>Nếu lỗi, xem console để debug</li>
          </ul>
        </Typography>
      </Box>
    </Container>
  );
};

export default SimpleCameraTest;
