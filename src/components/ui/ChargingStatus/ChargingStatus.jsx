import React, { useState, useEffect } from 'react';
import useBookingStore from '../../../store/bookingStore';
import './ChargingStatus.css';

const ChargingStatus = ({ bookingId, compact = false }) => {
  const {
    getSOCProgress,
    getChargingSession,
    getCurrentBooking
  } = useBookingStore();

  const [socData, setSocData] = useState(null);
  const [chargingSession, setChargingSession] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);

  // Real-time SOC updates from booking store
  useEffect(() => {
    if (!bookingId) return;

    let pollingInterval = null;

    const updateChargingStatus = () => {
      // Get data from booking store (which fetches from API)
      const socProgress = getSOCProgress(bookingId);
      const session = getChargingSession();
      const booking = getCurrentBooking();

      if (socProgress) {
        setSocData(socProgress);
      }

      if (session?.bookingId === bookingId) {
        setChargingSession(session);
      }

      if (booking?.id === bookingId) {
        setCurrentBooking(booking);
      }
    };

    // Initial update
    updateChargingStatus();

    // Poll for updates every 5 seconds when charging is active
    if (bookingId) {
      pollingInterval = setInterval(updateChargingStatus, 5000);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [bookingId, getSOCProgress, getChargingSession, getCurrentBooking]);

  if (!socData && !currentBooking) {
    return null;
  }

  const formatTime = (minutes) => {
    if (!minutes || minutes <= 0) return '0 phút';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}ph`;
    }
    return `${remainingMinutes} phút`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Hôm nay, ${date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else if (isYesterday) {
      return `Hôm qua, ${date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else {
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getSOCColor = (soc) => {
    if (soc >= 80) return '#22c55e'; // Green
    if (soc >= 50) return '#eab308'; // Yellow
    if (soc >= 20) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const isCharging = chargingSession?.bookingId === bookingId && chargingSession?.status === 'active';

  if (compact) {
    return (
      <div className="charging-status-compact">
        {socData?.currentSOC !== null && (
          <div className="soc-display-compact">
            <div className="soc-circle" style={{ '--soc-color': getSOCColor(socData.currentSOC) }}>
              <span className="soc-percentage">{socData.currentSOC}%</span>
            </div>
            {isCharging && (
              <div className="charging-indicator">
                <span className="charging-icon">⚡</span>
                <span className="charging-text">Đang sạc</span>
              </div>
            )}
          </div>
        )}

        {currentBooking?.bookingDate && (
          <div className="booking-date-compact">
            📅 {formatDate(currentBooking.createdAt || currentBooking.bookingTime)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="charging-status">
      <div className="charging-status-header">
        <h3>Trạng thái sạc</h3>
        {isCharging && <div className="live-indicator">🔴 LIVE</div>}
      </div>

      {/* SOC Display */}
      {socData && (
        <div className="soc-section">
          <div className="soc-main">
            <div className="soc-circle-large" style={{ '--soc-color': getSOCColor(socData.currentSOC || 0) }}>
              <div className="soc-content">
                <span className="soc-percentage-large">{socData.currentSOC || 0}%</span>
                <span className="soc-label">SOC</span>
              </div>
              <svg className="soc-progress" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="var(--soc-color)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (socData.currentSOC || 0) / 100)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
            </div>

            <div className="soc-details">
              {socData.initialSOC !== null && (
                <div className="soc-stat">
                  <span className="stat-label">Ban đầu:</span>
                  <span className="stat-value">{socData.initialSOC}%</span>
                </div>
              )}

              {socData.targetSOC && (
                <div className="soc-stat">
                  <span className="stat-label">Mục tiêu:</span>
                  <span className="stat-value">{socData.targetSOC}%</span>
                </div>
              )}

              {socData.chargingRate && (
                <div className="soc-stat">
                  <span className="stat-label">Tốc độ sạc:</span>
                  <span className="stat-value">{socData.chargingRate.toFixed(1)}%/h</span>
                </div>
              )}

              {socData.estimatedTimeToTarget && (
                <div className="soc-stat">
                  <span className="stat-label">Thời gian còn lại:</span>
                  <span className="stat-value">{formatTime(socData.estimatedTimeToTarget)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charging Session Info */}
      {chargingSession && chargingSession.bookingId === bookingId && (
        <div className="charging-session-info">
          <h4>Thông tin phiên sạc</h4>
          <div className="session-stats">
            {chargingSession.powerDelivered && (
              <div className="session-stat">
                <span className="stat-icon">⚡</span>
                <div className="stat-content">
                  <span className="stat-label">Công suất</span>
                  <span className="stat-value">{chargingSession.powerDelivered.toFixed(1)} kW</span>
                </div>
              </div>
            )}

            {chargingSession.energyDelivered && (
              <div className="session-stat">
                <span className="stat-icon">🔋</span>
                <div className="stat-content">
                  <span className="stat-label">Năng lượng</span>
                  <span className="stat-value">{chargingSession.energyDelivered.toFixed(2)} kWh</span>
                </div>
              </div>
            )}

            {chargingSession.voltage && (
              <div className="session-stat">
                <span className="stat-icon">🔌</span>
                <div className="stat-content">
                  <span className="stat-label">Điện áp</span>
                  <span className="stat-value">{chargingSession.voltage.toFixed(0)} V</span>
                </div>
              </div>
            )}

            {chargingSession.current && (
              <div className="session-stat">
                <span className="stat-icon">⚡</span>
                <div className="stat-content">
                  <span className="stat-label">Dòng điện</span>
                  <span className="stat-value">{chargingSession.current.toFixed(0)} A</span>
                </div>
              </div>
            )}

            {chargingSession.temperature && (
              <div className="session-stat">
                <span className="stat-icon">🌡️</span>
                <div className="stat-content">
                  <span className="stat-label">Nhiệt độ</span>
                  <span className="stat-value">{chargingSession.temperature.toFixed(0)}°C</span>
                </div>
              </div>
            )}
          </div>

          {chargingSession.startTime && (
            <div className="session-time">
              <span className="time-label">Bắt đầu:</span>
              <span className="time-value">{formatDate(chargingSession.startTime)}</span>
            </div>
          )}
        </div>
      )}

      {/* Booking Date */}
      {currentBooking?.bookingDate && (
        <div className="booking-info">
          <div className="booking-stat">
            <span className="stat-icon">📅</span>
            <div className="stat-content">
              <span className="stat-label">Ngày đặt sạc</span>
              <span className="stat-value">{formatDate(currentBooking.createdAt || currentBooking.bookingTime)}</span>
            </div>
          </div>
        </div>
      )}

      {socData?.lastUpdated && (
        <div className="last-updated">
          <span>Cập nhật lần cuối: {formatDate(socData.lastUpdated)}</span>
        </div>
      )}
    </div>
  );
};

export default ChargingStatus;