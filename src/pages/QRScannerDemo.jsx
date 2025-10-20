import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Paper,
  Chip,
} from "@mui/material";
import { QrCodeScanner } from "@mui/icons-material";
import QRCodeScanner from "../components/ui/QRCodeScanner/QRCodeScanner";
import ChargingStatus from "../components/ui/ChargingStatus/ChargingStatus";
import useStationStore from "../store/stationStore";
import useBookingStore from "../store/bookingStore";

const QRScannerDemo = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  const { generateQRCode, stations } = useStationStore();
  const {
    createBooking,
    initializeSOCTracking,
    startCharging,
    updateChargingProgress,
  } = useBookingStore();

  const handleScanSuccess = (result) => {
    console.log("Scan success:", result);
    setScanResult(result);
    setActiveBooking(result.booking);
    setShowScanner(false);

    // Initialize charging simulation
    if (result.booking) {
      const initialSOC = 25 + Math.random() * 40;
      const targetSOC = 80;

      initializeSOCTracking(result.booking.id, initialSOC, targetSOC);

      // Start charging after delay
      setTimeout(() => {
        startCharging(result.booking.id);

        const initialProgress = {
          currentSOC: initialSOC,
          chargingRate: 25 + Math.random() * 15,
          powerDelivered: 45 + Math.random() * 15,
          energyDelivered: 0,
          voltage: 380 + Math.random() * 20,
          current: 110 + Math.random() * 20,
          temperature: 35 + Math.random() * 10,
        };

        updateChargingProgress(result.booking.id, initialProgress);
      }, 1500);
    }
  };

  const simulateScan = (stationId) => {
    const station = stations.find((s) => s.id === stationId);
    if (!station) return;

    const mockBooking = createBooking({
      stationId: station.id,
      stationName: station.name,
      chargerType: {
        id: "fast",
        name: "Sạc nhanh",
        power: `${station.charging.maxPower} kW`,
        price: `${
          station.charging.pricing.dcRate || station.charging.pricing.acRate
        } VNĐ/kWh`,
      },
      connector: {
        id:
          station.charging.connectorTypes[0]?.replace(" ", "_").toLowerCase() ||
          "auto",
        name: station.charging.connectorTypes[0] || "Tự động",
        compatible: "Tương thích",
      },
      port: {
        id: "A01",
        location: "Port A01",
      },
      bookingTime: new Date().toISOString(),
      scannedAt: new Date().toISOString(),
      autoStart: true,
    });

    handleScanSuccess({
      station,
      booking: mockBooking,
      portId: "A01",
      message: `Quét QR thành công! Đang khởi tạo phiên sạc tại ${station.name}...`,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Demo Quét QR & Trạng Thái Sạc
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Demo tính năng quét QR code để bắt đầu sạc và hiển thị trạng thái sạc
        real-time
      </Typography>

      {/* QR Scanner */}
      {showScanner && (
        <QRCodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Điều khiển Demo
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<QrCodeScanner />}
                  onClick={() => setShowScanner(true)}
                  size="large"
                  sx={{
                    background:
                      "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)",
                    fontWeight: "bold",
                  }}
                >
                  Mở Camera Quét QR
                </Button>

                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Hoặc mô phỏng quét QR cho các trạm:
                </Typography>

                {stations.slice(0, 3).map((station) => (
                  <Paper
                    key={station.id}
                    sx={{ p: 2, border: "1px solid #e0e0e0" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {station.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          QR Code: {generateQRCode(station.id, "A01")}
                        </Typography>
                        <br />
                        <Chip
                          label={`${station.charging.availablePorts} ports available`}
                          size="small"
                          color={
                            station.charging.availablePorts > 0
                              ? "success"
                              : "default"
                          }
                        />
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => simulateScan(station.id)}
                      >
                        Mô phỏng quét
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kết quả Scan
              </Typography>

              {scanResult ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>✅ Quét thành công!</strong>
                      <br />
                      Trạm: {scanResult.station?.name}
                      <br />
                      Port: {scanResult.portId}
                      <br />
                      Booking ID: {scanResult.booking?.id}
                    </Typography>
                  </Alert>

                  <Typography variant="subtitle2" gutterBottom>
                    Chi tiết trạm sạc:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2">
                      <strong>Tên:</strong> {scanResult.station?.name}
                      <br />
                      <strong>Địa chỉ:</strong>{" "}
                      {scanResult.station?.location?.address}
                      <br />
                      <strong>Công suất tối đa:</strong>{" "}
                      {scanResult.station?.charging?.maxPower} kW
                      <br />
                      <strong>Cổng khả dụng:</strong>{" "}
                      {scanResult.station?.charging?.availablePorts}/
                      {scanResult.station?.charging?.totalPorts}
                      <br />
                      <strong>Giá sạc:</strong>{" "}
                      {scanResult.station?.charging?.pricing?.dcRate ||
                        scanResult.station?.charging?.pricing?.acRate}{" "}
                      VNĐ/kWh
                    </Typography>
                  </Paper>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có kết quả quét. Hãy thử quét QR code hoặc mô phỏng quét.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Charging Status */}
        {activeBooking && (
          <Grid item xs={12}>
            <ChargingStatus bookingId={activeBooking.id} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default QRScannerDemo;
