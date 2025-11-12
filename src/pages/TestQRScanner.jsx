import React, { useState } from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import QRCodeScannerV2 from '../components/ui/QRCodeScanner/QRCodeScannerV2';

/**
 * Test Page để kiểm tra QR Scanner
 */
const TestQRScanner = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [result, setResult] = useState(null);

  const handleScanSuccess = (data) => {
    console.log('✅ Scan success:', data);
    setResult(data);
    setShowScanner(false);
  };

  const handleClose = () => {
    console.log('❌ Scanner closed');
    setShowScanner(false);
  };

  const handleManualInput = () => {
    console.log('✏️ Manual input requested');
    alert('Manual input feature');
  };

  if (showScanner) {
    return (
      <QRCodeScannerV2
        onScanSuccess={handleScanSuccess}
        onClose={handleClose}
        onManualInput={handleManualInput}
      />
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Test QR Scanner
      </Typography>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={() => setShowScanner(true)}
        sx={{ mb: 3 }}
      >
        📷 Mở Camera Quét QR
      </Button>

      {result && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Kết quả quét:
          </Typography>
          <pre style={{ overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Box>
      )}
    </Container>
  );
};

export default TestQRScanner;
