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
  TextField,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  QrCodeScanner,
  BatteryChargingFull,
  PlayArrow,
  Stop,
  Refresh,
  CheckCircle,
} from "@mui/icons-material";
import useStationStore from "../store/stationStore";

const MockAPIDemo = () => {
  const [qrResult, setQrResult] = useState(null);
  const [socSession, setSocSession] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const { stations } = useStationStore();

  const addLog = (message, type = "info") => {
    setLogs((prev) => [
      {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  // QR API Tests
  const testQRValidation = async (qrData) => {
    setApiLoading(true);
    try {
      const result = await mockAPI.qr.validateQRCode(qrData);
      setQrResult(result.data);
      addLog(
        `✅ QR validated: ${result.data.station.name} - Port ${result.data.portId}`,
        "success"
      );
    } catch (error) {
      addLog(`❌ QR validation failed: ${error.message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  const testQRBooking = async (qrData) => {
    setApiLoading(true);
    try {
      const result = await mockAPI.qr.createQRBooking(qrData, {
        userId: "demo-user",
        targetSOC: 85,
        batteryCapacity: 75,
      });

      addLog(`✅ QR booking created: ${result.data.booking.id}`, "success");

      // Initialize SOC session
      const socResult = await mockAPI.soc.initializeSOCSession(
        result.data.booking.id,
        {
          initialSOC: 30,
          targetSOC: 85,
          batteryCapacity: 75,
          vehicleId: "demo-vehicle",
        }
      );

      setSocSession(socResult.data);
      addLog(
        `🔋 SOC session initialized: ${socResult.data.initialSOC}% → ${socResult.data.targetSOC}%`,
        "info"
      );
    } catch (error) {
      addLog(`❌ QR booking failed: ${error.message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  // SOC API Tests
  const startCharging = async () => {
    if (!socSession) {
      addLog("❌ No SOC session to start charging", "error");
      return;
    }

    setApiLoading(true);
    try {
      const result = await mockAPI.soc.startCharging(socSession.bookingId);
      setSocSession(result.data);
      setSimulationRunning(true);
      addLog(
        `⚡ Charging started for booking ${socSession.bookingId}`,
        "success"
      );

      // Start real-time simulation
      const interval = mockAPI.soc.simulateRealTimeUpdates(
        socSession.bookingId,
        (updatedSession) => {
          setSocSession(updatedSession);
          if (updatedSession.status === "completed") {
            setSimulationRunning(false);
            addLog(
              `🎉 Charging completed! Final SOC: ${updatedSession.currentSOC}%`,
              "success"
            );
          }
        }
      );

      // Store interval for cleanup
      window.chargingSimulation = interval;
    } catch (error) {
      addLog(`❌ Start charging failed: ${error.message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  const stopCharging = async () => {
    if (!socSession) return;

    setApiLoading(true);
    try {
      if (window.chargingSimulation) {
        clearInterval(window.chargingSimulation);
        window.chargingSimulation = null;
      }

      const result = await mockAPI.soc.stopCharging(socSession.bookingId);
      setSocSession(result.data);
      setSimulationRunning(false);
      addLog(
        `⏹️ Charging stopped. Final SOC: ${result.data.finalSOC}%`,
        "info"
      );
    } catch (error) {
      addLog(`❌ Stop charging failed: ${error.message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  const getSOCStatus = async () => {
    if (!socSession) return;

    setApiLoading(true);
    try {
      const result = await mockAPI.soc.getSOCStatus(socSession.bookingId);
      setSocSession(result.data);
      addLog(`🔋 SOC status updated: ${result.data.currentSOC}%`, "info");
    } catch (error) {
      addLog(`❌ Get SOC status failed: ${error.message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  const generateQRCodes = async (stationId) => {
    setApiLoading(true);
    try {
      const result = await mockAPI.qr.generateStationQR(stationId);
      addLog(
        `📱 Generated ${result.data.qrCodes.length} QR codes for ${result.data.stationName}`,
        "success"
      );
    } catch (error) {
      addLog(`❌ QR generation failed: ${error.message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Mock API Demo - SOC & QR Scanner
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Test SOC tracking và QR scanner với Mock API thực tế
      </Typography>

      <Grid container spacing={3}>
        {/* QR API Demo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <QrCodeScanner color="primary" />
                QR Scanner API Test
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle2">
                  Test với các QR codes mẫu:
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
                          QR: SKAEV:STATION:{station.id}:A01
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            testQRValidation(`SKAEV:STATION:${station.id}:A01`)
                          }
                          disabled={apiLoading}
                        >
                          Xác thực
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            testQRBooking(`SKAEV:STATION:${station.id}:A01`)
                          }
                          disabled={apiLoading}
                        >
                          Book & SOC
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => generateQRCodes(station.id)}
                          disabled={apiLoading}
                        >
                          Gen QR
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>

              {/* QR Result */}
              {qrResult && (
                <Paper
                  sx={{
                    p: 2,
                    mt: 2,
                    bgcolor: "success.50",
                    border: "1px solid",
                    borderColor: "success.200",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="success.main"
                    gutterBottom
                  >
                    📱 QR Validation Result
                  </Typography>
                  <Typography variant="body2">
                    <strong>Station:</strong> {qrResult.station.name}
                    <br />
                    <strong>Port:</strong> {qrResult.portId}
                    <br />
                    <strong>Status:</strong>{" "}
                    <Chip
                      label={qrResult.portInfo.status}
                      size="small"
                      color="success"
                    />
                    <br />
                    <strong>Power:</strong>{" "}
                    {qrResult.portInfo.connector.maxPower.toFixed(0)} kW
                    <br />
                    <strong>Connector:</strong>{" "}
                    {qrResult.portInfo.connector.type}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SOC API Demo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BatteryChargingFull color="primary" />
                SOC Tracking API Test
              </Typography>

              {socSession ? (
                <Box>
                  {/* SOC Display */}
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: "primary.50",
                      border: "1px solid",
                      borderColor: "primary.200",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mb: 2 }}
                    >
                      <Box
                        sx={{ position: "relative", display: "inline-flex" }}
                      >
                        <CircularProgress
                          variant="determinate"
                          value={
                            (socSession.currentSOC / socSession.targetSOC) * 100
                          }
                          size={80}
                          thickness={6}
                          sx={{
                            color:
                              socSession.currentSOC >= 80
                                ? "success.main"
                                : "primary.main",
                          }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: "absolute",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="div"
                            color="text.secondary"
                          >
                            {socSession.currentSOC}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Typography variant="body2" textAlign="center">
                      <strong>Status:</strong>{" "}
                      <Chip
                        label={socSession.status}
                        size="small"
                        color={
                          socSession.status === "charging"
                            ? "success"
                            : "default"
                        }
                      />
                      <br />
                      <strong>Target:</strong> {socSession.targetSOC}% •
                      <strong>Rate:</strong> {socSession.chargingRate}%/h
                      <br />
                      {socSession.estimatedTimeToTarget && (
                        <>
                          <strong>Time remaining:</strong>{" "}
                          {Math.round(socSession.estimatedTimeToTarget)} min
                        </>
                      )}
                    </Typography>
                  </Paper>

                  {/* Controls */}
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrow />}
                      onClick={startCharging}
                      disabled={
                        apiLoading ||
                        socSession.status === "charging" ||
                        simulationRunning
                      }
                      size="small"
                    >
                      Bắt đầu sạc
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Stop />}
                      onClick={stopCharging}
                      disabled={apiLoading || socSession.status !== "charging"}
                      size="small"
                    >
                      Stop
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={getSOCStatus}
                      disabled={apiLoading}
                      size="small"
                    >
                      Refresh
                    </Button>
                  </Box>

                  {simulationRunning && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      ⚡ Real-time simulation running... SOC updating every 3
                      seconds
                    </Alert>
                  )}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ py: 4 }}
                >
                  Chưa có SOC session. Hãy tạo booking từ QR scanner bên trái.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Logs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📝 API Call Logs
              </Typography>

              <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <Paper
                      key={log.id}
                      sx={{
                        p: 1,
                        mb: 1,
                        bgcolor:
                          log.type === "error"
                            ? "error.50"
                            : log.type === "success"
                            ? "success.50"
                            : "grey.50",
                        borderLeft: `4px solid ${
                          log.type === "error"
                            ? "red"
                            : log.type === "success"
                            ? "green"
                            : "blue"
                        }`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {log.timestamp}
                      </Typography>
                      <Typography variant="body2">{log.message}</Typography>
                    </Paper>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    Chưa có API calls. Hãy test các chức năng bên trên.
                  </Typography>
                )}
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setLogs([])}
                sx={{ mt: 2 }}
                disabled={logs.length === 0}
              >
                Clear Logs
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {apiLoading && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default MockAPIDemo;
