/* eslint-disable */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Webcam from 'react-webcam';
import { BrowserQRCodeReader } from '@zxing/browser';
import useStationStore from '../../../store/stationStore';
import './QRCodeScanner.css';

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const initializingRef = useRef(false);
  const webcamRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);
  const rawVideoRef = useRef(null);
  const activeStreamRef = useRef(null);
  
  const { getStationById } = useStationStore();

  // Request camera permission on component mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập camera');
        }

        console.log('[QRCodeScanner] Requesting initial camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
        });

        console.log('[QRCodeScanner] Initial getUserMedia success');
        setHasPermission(true);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === 'videoinput');

        if (videoInputs.length > 0) {
          const preferredCamera =
            videoInputs.find((device) => /back|rear|environment/i.test(device.label)) ??
            videoInputs[0];

          setSelectedDeviceId(preferredCamera?.deviceId ?? null);
        }

        // Release preview stream – QrReader will acquire the camera again
        stream.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      } catch (err) {
        console.error('Camera permission error:', err);
        setHasPermission(false);
        setError(
          err?.message || 'Không thể truy cập camera. Vui lòng cho phép truy cập camera.'
        );
      } finally {
        initializingRef.current = false;
      }
    };

    requestCameraPermission();

    return () => {
      initializingRef.current = false;
    };
  }, []);

  const trackConstraints = useMemo(() => {
    if (selectedDeviceId) {
      return {
        deviceId: { exact: selectedDeviceId },
        focusMode: 'continuous',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
    }

    return {
      facingMode: { ideal: 'environment' },
      focusMode: 'continuous',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
  }, [selectedDeviceId]);

  const processScanResult = useCallback(
    async (qrData) => {
      try {
        if (!qrData) {
          throw new Error('Không đọc được dữ liệu QR');
        }

        console.log('QR Code scanned:', qrData);

        // Parse QR data (expected format: STATION:ST001:PORT:A01 or JSON)
        let stationId;
        let portId;
        try {
          const parsed = JSON.parse(qrData);
          stationId = parsed.stationId;
          portId = parsed.portId;
        } catch {
          const parts = qrData.split(':');
          stationId = parts[1];
          portId = parts[3];
        }

        if (!stationId || !portId) {
          throw new Error('Mã QR không hợp lệ');
        }

        const station = getStationById(stationId);
        if (!station) {
          throw new Error('Không tìm thấy trạm sạc');
        }
        const payload = {
          station,
          stationId,
          portId,
          qrData,
        };

        if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
        }
        codeReaderRef.current?.reset();
        setScanning(false);

        await onScanSuccess?.(payload);
      } catch (err) {
        console.error('QR Scan Error:', err);
        setError(err.message || 'Không thể xử lý mã QR. Vui lòng thử lại.');
        if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
        }
        codeReaderRef.current?.reset();
        setScanning(false);
      }
    },
    [getStationById, onScanSuccess]
  );

  useEffect(() => {
    if (!hasPermission || !scanning) {
      return;
    }

    let isCancelled = false;

    const startDecoding = async () => {
      try {
        let attempts = 0;
        const waitForVideo = () =>
          new Promise((resolve, reject) => {
            const checkVideoReady = () => {
              attempts += 1;
              const videoElement = webcamRef.current?.video;
              if (videoElement && videoElement.readyState >= 2) {
                resolve(videoElement);
              } else if (attempts > 20) {
                reject(new Error('Không thể khởi tạo camera.'));
              } else {
                setTimeout(checkVideoReady, 150);
              }
            };

            checkVideoReady();
          });

        const videoElement = await waitForVideo();
        console.log('[QRCodeScanner] videoElement readyState=', videoElement?.readyState);

        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserQRCodeReader(undefined, {
            delayBetweenScanAttempts: 250,
            delayBetweenScanSuccess: 800,
          });
        } else {
          codeReaderRef.current.reset();
        }
        // Start decoder attached to the video element. If decodeFromVideoDevice fails
        // (e.g. because device selection doesn't work), fallback will still show video.
        try {
          controlsRef.current = await codeReaderRef.current.decodeFromVideoDevice(
            selectedDeviceId || undefined,
            videoElement,
            (result, err) => {
              if (isCancelled) return;

              if (result) {
                const text = typeof result.getText === 'function' ? result.getText() : result.text;
                if (text) {
                  console.log('[QRCodeScanner] ZXing result:', text);
                  processScanResult(text);
                }
              }

              if (err && err?.name !== 'NotFoundException') {
                console.warn('QR decode warning:', err);
              }
            }
          );
        } catch (firstErr) {
          console.warn('[QRCodeScanner] decodeFromVideoDevice failed, attempting fallback with raw video', firstErr);
          // If we have a raw video stream attached, try decoding from that element
          if (rawVideoRef.current && activeStreamRef.current) {
            try {
              controlsRef.current = await codeReaderRef.current.decodeFromVideoDevice(
                undefined,
                rawVideoRef.current,
                (result, err) => {
                  if (isCancelled) return;

                  if (result) {
                    const text = typeof result.getText === 'function' ? result.getText() : result.text;
                    if (text) {
                      console.log('[QRCodeScanner] ZXing fallback result:', text);
                      processScanResult(text);
                    }
                  }

                  if (err && err?.name !== 'NotFoundException') {
                    console.warn('QR decode warning (fallback):', err);
                  }
                }
              );
            } catch (fallbackErr) {
              console.error('[QRCodeScanner] fallback decode failed', fallbackErr);
            }
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Camera decode error:', err);
          setError(err?.message || 'Không thể khởi tạo trình quét QR.');
          setScanning(false);
        }
      }
    };

    startDecoding();

    return () => {
      isCancelled = true;
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch (e) {
          console.warn('controlsRef stop failed', e);
        }
        controlsRef.current = null;
      }
      try {
        codeReaderRef.current?.reset();
      } catch (e) {
        console.warn('codeReader reset failed', e);
      }

      // Stop any raw stream we started
      if (activeStreamRef.current) {
        try {
          activeStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {
          console.warn('stopping active stream failed', e);
        }
        activeStreamRef.current = null;
      }
    };
  }, [hasPermission, scanning, selectedDeviceId, processScanResult]);

  // If permission is granted but we don't yet have a raw stream, auto-open camera
  useEffect(() => {
    if (hasPermission && !activeStreamRef.current && !controlsRef.current) {
      // Try to auto-open the camera so the preview appears immediately
      console.log('[QRCodeScanner] auto-opening camera because permission granted');
      handleOpenCamera().catch((e) => console.warn('auto open camera failed', e));
    }
  }, [hasPermission]);

  const handleRetry = async () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    codeReaderRef.current?.reset();
    setHasPermission(null);
    setError(null);
    setScanning(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập camera');
      }

      console.log('[QRCodeScanner] Manual getUserMedia with constraints', trackConstraints);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: trackConstraints,
      });

      // Attach to raw video fallback so user sees camera immediately
      if (rawVideoRef.current) {
        rawVideoRef.current.srcObject = stream;
        rawVideoRef.current.play().catch((e) => console.warn('raw video play failed', e));
      }
      activeStreamRef.current = stream;

      setHasPermission(true);
    } catch (err) {
      console.error('Retry camera error:', err);
      setHasPermission(false);
      setError(err?.message || 'Không thể truy cập camera. Vui lòng kiểm tra cài đặt quyền.');
    }
  };

  // Manual open camera (button) - requests stream and attaches to raw video element as fallback
  const handleOpenCamera = async () => {
    setError(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: trackConstraints });
      console.log('[QRCodeScanner] handleOpenCamera got stream', stream);
      if (rawVideoRef.current) {
        rawVideoRef.current.srcObject = stream;
        rawVideoRef.current.play().catch((e) => console.warn('raw video play failed', e));
      }
      activeStreamRef.current = stream;
      setHasPermission(true);
      // also set selectedDeviceId from stream if possible
      const tracks = stream.getVideoTracks();
      if (tracks && tracks[0]) {
        const settings = tracks[0].getSettings();
        if (settings.deviceId) setSelectedDeviceId(settings.deviceId);
      }
    } catch (err) {
      console.error('[QRCodeScanner] handleOpenCamera error', err);
      setError(err?.message || 'Không thể mở camera');
      setHasPermission(false);
    }
  };


  if (hasPermission === false) {
    return (
      <div className="qr-scanner-container">
        <div className="qr-scanner-modal">
          <div className="qr-scanner-header">
            <h3>Quét mã QR trạm sạc</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="qr-scanner-error">
            <div className="error-icon">📷</div>
            <p>Không thể truy cập camera</p>
            <p className="error-detail">
              Vui lòng cho phép truy cập camera trong trình duyệt để sử dụng tính năng quét QR.
            </p>
            <button className="retry-btn" onClick={handleRetry}>
              Thử lại
            </button>
            <button className="retry-btn" style={{ marginLeft: 8, background: '#06b6d4' }} onClick={handleOpenCamera}>
              Mở camera
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="qr-scanner-container">
        <div className="qr-scanner-modal">
          <div className="qr-scanner-header">
            <h3>Quét mã QR trạm sạc</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="qr-scanner-content initializing">
            <div className="loading-spinner" />
            <p>Đang khởi tạo camera thiết bị...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-modal">
        <div className="qr-scanner-header">
          <h3>Quét mã QR trạm sạc</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="qr-scanner-content">
          {scanning && hasPermission && !error && (
            <div className="scanner-wrapper">
              <Webcam
                ref={webcamRef}
                audio={false}
                videoConstraints={trackConstraints}
                onUserMedia={() => {
                  console.log('[QRCodeScanner] react-webcam onUserMedia');
                  setHasPermission(true);
                }}
                onUserMediaError={(err) => {
                  console.error('[QRCodeScanner] react-webcam error:', err);
                  setHasPermission(false);
                  setError(err?.message || 'Không thể truy cập camera. Vui lòng kiểm tra quyền.');
                }}
                className="qr-webcam-preview"
              />
              {/* Raw video fallback: we'll attach MediaStream here when manual open succeeds */}
              <video
                ref={rawVideoRef}
                className="qr-webcam-preview"
                style={{ position: 'absolute', top: 0, left: 0 }}
                playsInline
                muted
              />
              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 20 }}>
                <button className="retry-btn" onClick={handleOpenCamera} style={{ padding: '6px 10px', fontSize: 12 }}>
                  Mở camera
                </button>
              </div>
              <div className="scanner-overlay">
                <div className="scanner-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                <p className="scanner-instruction">
                  Hướng camera vào mã QR trên trạm sạc
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="qr-scanner-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button className="retry-btn" onClick={handleRetry}>
                Quét lại
              </button>
            </div>
          )}
        </div>
        
        <div className="qr-scanner-footer">
          <p className="scanner-help">
            💡 Mẹo: Đảm bảo mã QR trong khung và có đủ ánh sáng
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;