import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Camera, X, AlertCircle, RefreshCw } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
} from "@mui/material";
import { CameraAlt, Close, Refresh, Warning } from "@mui/icons-material";

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ camera");
      }

      // Check if we already have permission
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: "camera" });
        if (result.state === "granted") {
          setHasPermission(true);
          await getCameraDevices();
        } else if (result.state === "denied") {
          setHasPermission(false);
          setError("Quyền truy cập camera bị từ chối");
        }
      }
    } catch (err) {
      console.warn("Permission check failed:", err);
      // If permission API not available, we'll check when starting camera
      setHasPermission(null);
    }
  };

  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");

      if (videoDevices.length > 0) {
        // Prefer back/rear camera
        const backCamera = videoDevices.find((d) =>
          /back|rear|environment/i.test(d.label)
        );
        setSelectedDeviceId(backCamera?.deviceId || videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Get devices error:", err);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setCameraStarted(false);

      const constraints = {
        video: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: "environment" },
            }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      console.log("[Camera] Starting with constraints:", constraints);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStarted(true);
        console.log("[Camera] Started successfully");

        // Get actual device ID from stream
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }

        // Start QR scanning
        startQRScanning();
      }
    } catch (err) {
      console.error("[Camera] Start error:", err);
      setHasPermission(false);
      setCameraStarted(false);

      let errorMessage = "Không thể mở camera";
      if (err.name === "NotAllowedError") {
        errorMessage = "Bạn đã từ chối quyền truy cập camera";
      } else if (err.name === "NotFoundError") {
        errorMessage = "Không tìm thấy camera";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera đang được sử dụng bởi ứng dụng khác";
      }

      setError(errorMessage);
    }
  };

  const startQRScanning = async () => {
    if (scanningRef.current) return;

    try {
      scanningRef.current = true;
      setScanning(true);
      setScanProgress(0);

      // Simulate progress while waiting for video
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const checkVideo = () => {
          attempts++;
          if (videoRef.current?.readyState >= 2) {
            clearInterval(progressInterval);
            setScanProgress(100);
            resolve();
          } else if (attempts > 30) {
            clearInterval(progressInterval);
            reject(new Error("Video không sẵn sàng"));
          } else {
            setTimeout(checkVideo, 100);
          }
        };
        checkVideo();
      });

      // Initialize QR code reader (without hints for compatibility)
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      // Start decoding
      controlsRef.current = await codeReaderRef.current.decodeFromVideoElement(
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            if (text) {
              console.log("[QR] Scanned:", text);
              handleQRScanned(text);
            }
          }

          if (err && err.name !== "NotFoundException") {
            console.warn("[QR] Decode error:", err);
          }
        }
      );

      console.log("[QR] Scanning started");
    } catch (err) {
      console.error("[QR] Start scanning error:", err);
      setError("Không thể khởi tạo trình quét QR");
      scanningRef.current = false;
      setScanning(false);
    }
  };

  const handleQRScanned = async (qrData) => {
    try {
      // Stop scanning immediately
      stopScanning();

      console.log("[QR] Processing:", qrData);

      // Parse QR code data
      let stationId, portId;
      try {
        const parsed = JSON.parse(qrData);
        stationId = parsed.stationId;
        portId = parsed.portId;
      } catch {
        const parts = qrData.split(":");
        if (parts.length >= 4) {
          stationId = parts[1];
          portId = parts[3];
        }
      }

      if (!stationId || !portId) {
        throw new Error("Mã QR không hợp lệ");
      }

      const payload = {
        stationId,
        portId,
        qrData,
      };

      await onScanSuccess?.(payload);
    } catch (err) {
      console.error("[QR] Process error:", err);
      setError(err.message || "Không thể xử lý mã QR");
      setTimeout(() => {
        setError(null);
        startQRScanning();
      }, 2000);
    }
  };

  const stopScanning = () => {
    scanningRef.current = false;
    setScanning(false);

    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        console.warn("[QR] Stop controls error:", e);
      }
      controlsRef.current = null;
    }

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        console.warn("[QR] Reset reader error:", e);
      }
    }
  };

  const stopCamera = () => {
    stopScanning();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStarted(false);
  };

  const handleRetry = async () => {
    stopCamera();
    setError(null);
    setHasPermission(null);
    await startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 500,
        bgcolor: "background.paper",
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CameraAlt />
          <Typography variant="h6" fontWeight={600}>
            Quét mã QR trạm sạc
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "white",
            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* Video Container */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          bgcolor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Video preview */}
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          playsInline
          muted
        />

        {/* Scanning overlay - show when scanning */}
        {cameraStarted && scanning && !error && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {/* Scanning frame with animation */}
            <Box
              sx={{
                position: "relative",
                width: { xs: 280, sm: 320 },
                height: { xs: 280, sm: 320 },
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.8, transform: "scale(0.98)" },
                },
              }}
            >
              {/* Main border */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  border: "3px solid rgba(255,255,255,0.5)",
                  borderRadius: 3,
                }}
              />

              {/* Corner markers */}
              <Box
                sx={{
                  position: "absolute",
                  top: -3,
                  left: -3,
                  width: 40,
                  height: 40,
                  borderTop: "6px solid",
                  borderLeft: "6px solid",
                  borderColor: "primary.main",
                  borderTopLeftRadius: 3,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 40,
                  height: 40,
                  borderTop: "6px solid",
                  borderRight: "6px solid",
                  borderColor: "primary.main",
                  borderTopRightRadius: 3,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -3,
                  left: -3,
                  width: 40,
                  height: 40,
                  borderBottom: "6px solid",
                  borderLeft: "6px solid",
                  borderColor: "primary.main",
                  borderBottomLeftRadius: 3,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -3,
                  right: -3,
                  width: 40,
                  height: 40,
                  borderBottom: "6px solid",
                  borderRight: "6px solid",
                  borderColor: "primary.main",
                  borderBottomRightRadius: 3,
                }}
              />

              {/* Scanning line */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  borderRadius: 3,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    width: "100%",
                    height: 3,
                    background:
                      "linear-gradient(90deg, transparent, #1976d2, transparent)",
                    boxShadow: "0 0 20px rgba(25,118,210,0.8)",
                    animation: "scan 2s linear infinite",
                    "@keyframes scan": {
                      "0%": { top: 0 },
                      "50%": { top: "100%" },
                      "100%": { top: 0 },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Instruction text */}
            <Typography
              sx={{
                position: "absolute",
                bottom: 60,
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(0,0,0,0.75)",
                color: "white",
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 500,
                textAlign: "center",
                backdropFilter: "blur(10px)",
                whiteSpace: "nowrap",
              }}
            >
              📱 Hướng camera vào mã QR trên trạm sạc
            </Typography>

            {/* Progress indicator */}
            {scanProgress < 100 && (
              <LinearProgress
                variant="determinate"
                value={scanProgress}
                sx={{
                  position: "absolute",
                  bottom: 40,
                  left: 40,
                  right: 40,
                  borderRadius: 1,
                  height: 6,
                }}
              />
            )}
          </Box>
        )}

        {/* Permission required */}
        {hasPermission === null && !cameraStarted && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.85)",
              color: "white",
              p: 4,
              textAlign: "center",
            }}
          >
            <CameraAlt sx={{ fontSize: 80, mb: 3, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              Cần quyền truy cập camera
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, opacity: 0.8 }}>
              Để quét mã QR, vui lòng cho phép ứng dụng sử dụng camera
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<CameraAlt />}
              onClick={startCamera}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Cho phép truy cập camera
            </Button>
          </Box>
        )}

        {/* Permission denied */}
        {hasPermission === false && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.85)",
              color: "white",
              p: 4,
              textAlign: "center",
            }}
          >
            <Warning sx={{ fontSize: 80, mb: 3, color: "error.main" }} />
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Không thể truy cập camera
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 4, opacity: 0.8, maxWidth: 400 }}
            >
              Vui lòng cho phép truy cập camera trong cài đặt trình duyệt, sau
              đó thử lại
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Refresh />}
              onClick={handleRetry}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              Thử lại
            </Button>
          </Box>
        )}

        {/* Error message overlay */}
        {error && cameraStarted && (
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              bgcolor: "error.main",
              color: "white",
              px: 3,
              py: 2,
              borderRadius: 2,
              display: "flex",
              alignItems: "start",
              gap: 1.5,
              boxShadow: 3,
            }}
          >
            <Warning sx={{ mt: 0.2 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Lỗi
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Box>
          </Box>
        )}

        {/* Camera loading state */}
        {!cameraStarted && hasPermission && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.85)",
              color: "white",
              p: 4,
              textAlign: "center",
            }}
          >
            <CameraAlt
              sx={{
                fontSize: 80,
                mb: 3,
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 0.5, transform: "scale(1)" },
                  "50%": { opacity: 1, transform: "scale(1.1)" },
                },
              }}
            />
            <Typography variant="h6" gutterBottom>
              Đang khởi tạo camera...
            </Typography>
            <LinearProgress sx={{ width: 200, mt: 2 }} />
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              startIcon={<CameraAlt />}
              onClick={startCamera}
              sx={{
                mt: 4,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                borderColor: "rgba(255,255,255,0.3)",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.5)",
                  bgcolor: "rgba(255,255,255,0.05)",
                },
              }}
            >
              Mở camera thủ công
            </Button>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: "grey.100",
          px: 3,
          py: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          💡 Đảm bảo mã QR trong khung quét và có đủ ánh sáng
        </Typography>
      </Box>
    </Box>
  );
};

export default QRCodeScanner;
