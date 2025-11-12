import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  
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
        throw new Error('Trình duyệt không hỗ trợ camera');
      }

      // Check if we already have permission
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'camera' });
        if (result.state === 'granted') {
          setHasPermission(true);
          await getCameraDevices();
        } else if (result.state === 'denied') {
          setHasPermission(false);
          setError('Quyền truy cập camera bị từ chối');
        }
      }
    } catch (err) {
      console.warn('Permission check failed:', err);
      // If permission API not available, we'll check when starting camera
      setHasPermission(null);
    }
  };

  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      if (videoDevices.length > 0) {
        // Prefer back/rear camera
        const backCamera = videoDevices.find(d => 
          /back|rear|environment/i.test(d.label)
        );
        setSelectedDeviceId(backCamera?.deviceId || videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Get devices error:', err);
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
              facingMode: { ideal: 'environment' }
            }
          : { 
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
        audio: false
      };

      console.log('[Camera] Starting with constraints:', constraints);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
        console.log('[Camera] Started successfully');

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
      console.error('[Camera] Start error:', err);
      setHasPermission(false);
      setCameraStarted(false);
      
      let errorMessage = 'Không thể mở camera';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Bạn đã từ chối quyền truy cập camera';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Không tìm thấy camera';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác';
      }
      
      setError(errorMessage);
    }
  };

  const startQRScanning = async () => {
    if (scanningRef.current) return;
    
    try {
      scanningRef.current = true;
      setScanning(true);

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const checkVideo = () => {
          attempts++;
          if (videoRef.current?.readyState >= 2) {
            resolve();
          } else if (attempts > 30) {
            reject(new Error('Video không sẵn sàng'));
          } else {
            setTimeout(checkVideo, 100);
          }
        };
        checkVideo();
      });

      // Initialize QR code reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 300,
          delayBetweenScanSuccess: 1000,
        });
      }

      // Start decoding
      controlsRef.current = await codeReaderRef.current.decodeFromVideoElement(
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            if (text) {
              console.log('[QR] Scanned:', text);
              handleQRScanned(text);
            }
          }
          
          if (err && err.name !== 'NotFoundException') {
            console.warn('[QR] Decode error:', err);
          }
        }
      );

      console.log('[QR] Scanning started');
    } catch (err) {
      console.error('[QR] Start scanning error:', err);
      setError('Không thể khởi tạo trình quét QR');
      scanningRef.current = false;
      setScanning(false);
    }
  };

  const handleQRScanned = async (qrData) => {
    try {
      // Stop scanning immediately
      stopScanning();
      
      console.log('[QR] Processing:', qrData);
      
      // Parse QR code data
      let stationId, portId;
      try {
        const parsed = JSON.parse(qrData);
        stationId = parsed.stationId;
        portId = parsed.portId;
      } catch {
        const parts = qrData.split(':');
        if (parts.length >= 4) {
          stationId = parts[1];
          portId = parts[3];
        }
      }

      if (!stationId || !portId) {
        throw new Error('Mã QR không hợp lệ');
      }

      const payload = {
        stationId,
        portId,
        qrData,
      };

      await onScanSuccess?.(payload);
    } catch (err) {
      console.error('[QR] Process error:', err);
      setError(err.message || 'Không thể xử lý mã QR');
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
        console.warn('[QR] Stop controls error:', e);
      }
      controlsRef.current = null;
    }
    
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        console.warn('[QR] Reset reader error:', e);
      }
    }
  };

  const stopCamera = () => {
    stopScanning();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold flex items-center gap-2">
            <Camera size={24} />
            Quét mã QR trạm sạc
          </h3>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="relative bg-black" style={{ aspectRatio: '3/4' }}>
          {/* Video preview */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanner overlay - only show when scanning */}
          {cameraStarted && scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Scanning frame */}
                <div className="absolute inset-0 border-4 border-white rounded-2xl opacity-80">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
                </div>
                
                {/* Scanning line animation */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan"></div>
                </div>
              </div>
              
              <p className="absolute bottom-8 left-0 right-0 text-center text-white text-sm bg-black bg-opacity-50 py-2 px-4 mx-4 rounded-lg">
                Hướng camera vào mã QR trên trạm sạc
              </p>
            </div>
          )}

          {/* Permission required */}
          {hasPermission === null && !cameraStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 text-white p-6">
              <Camera size={64} className="mb-4 opacity-50" />
              <p className="text-center mb-4">Cần quyền truy cập camera</p>
              <button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cho phép truy cập
              </button>
            </div>
          )}

          {/* Permission denied */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 text-white p-6">
              <AlertCircle size={64} className="mb-4 text-red-500" />
              <p className="text-center font-semibold mb-2">Không thể truy cập camera</p>
              <p className="text-center text-sm text-gray-300 mb-6">
                Vui lòng cho phép truy cập camera trong cài đặt trình duyệt
              </p>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={20} />
                Thử lại
              </button>
            </div>
          )}

          {/* Error message */}
          {error && cameraStarted && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Lỗi</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Camera not started */}
          {!cameraStarted && hasPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 text-white p-6">
              <Camera size={64} className="mb-4 animate-pulse" />
              <p className="text-center mb-4">Đang khởi tạo camera...</p>
              <button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Mở camera
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-600 text-center">
            💡 Đảm bảo mã QR trong khung và có đủ ánh sáng
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QRCodeScanner;