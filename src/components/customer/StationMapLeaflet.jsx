import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Stack,
    IconButton,
    Tooltip,
    Alert
} from '@mui/material';
import {
    MyLocation as MyLocationIcon,
    ElectricCar,
    LocationOn,
    Speed,
    Close as CloseIcon,
    EvStation as EvStationIcon,
    Directions as DirectionsIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different station statuses
const createStationIcon = (isAvailable) => {
    const color = isAvailable ? '#4caf50' : '#f44336';
    return L.divIcon({
        className: 'custom-station-icon',
        html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      </div>
    `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

// User location icon
const userIcon = L.divIcon({
    className: 'custom-user-icon',
    html: `
    <div style="
      background-color: #2196f3;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(33,150,243,0.6);
    "></div>
  `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Helper to render operating hours safely
const formatOperatingHours = (oh) => {
    if (!oh) return '';
    if (typeof oh === 'string') {
        // Map common shorthand to a friendly Vietnamese label
        if (oh.trim().toLowerCase() === '24/7') return `Hoạt động: Cả ngày`;
        return `Hoạt động: ${oh}`;
    }
    // If it's an object, check fields (support shape variations)
    const openRaw = oh.open || '';
    const closeRaw = oh.close || '';
    const open = String(openRaw).trim().toLowerCase();
    const close = String(closeRaw).trim().toLowerCase();

    // If either side uses the 24/7 shorthand, show friendly label
    if (open === '24/7' || close === '24/7') return `Hoạt động: Cả ngày`;

    if (openRaw && closeRaw) return `Hoạt động: ${openRaw} - ${closeRaw}`;
    if (openRaw) return `Hoạt động: ${openRaw}`;
    if (closeRaw) return `Hoạt động: ${closeRaw}`;
    return '';
};

// Component to fit map bounds
const MapBoundsSetter = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

// Component to handle route drawing
const RouteDrawer = ({ userLocation, destination }) => {
    const [routeCoords, setRouteCoords] = useState([]);

    useEffect(() => {
        if (!userLocation || !destination) {
            setRouteCoords([]);
            return;
        }

        const fetchRoute = async () => {
            try {
                // Use OSRM (Open Source Routing Machine) - free routing service
                const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    setRouteCoords(coords);
                }
            } catch (error) {
                console.error('Error fetching route:', error);
                // Fallback: draw straight line
                setRouteCoords([
                    [userLocation.lat, userLocation.lng],
                    [destination.lat, destination.lng]
                ]);
            }
        };

        fetchRoute();
    }, [userLocation, destination]);

    if (routeCoords.length === 0) return null;

    return (
        <Polyline
            positions={routeCoords}
            pathOptions={{
                color: '#2196f3',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10'
            }}
        />
    );
};

// Helper function to get coordinates from station
const getStationCoords = (station) => {
    const lat = station.location?.coordinates?.lat || station.location?.lat || station.lat;
    const lng = station.location?.coordinates?.lng || station.location?.lng || station.lng;
    return { lat, lng };
};

const StationMapLeaflet = ({ stations, onStationSelect }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedFromList, setSelectedFromList] = useState(false);
    const [showRoute, setShowRoute] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef(null);

    // Debug stations prop
    useEffect(() => {
        console.log('🗺️ StationMapLeaflet received stations:', stations);
        if (stations && stations.length > 0) {
            console.log('📍 First station location:', stations[0].location);
            const coords = getStationCoords(stations[0]);
            console.log('📍 Extracted coords:', coords);
            // Mark map as ready to render once we have stations
            if (!mapReady) {
                setMapReady(true);
            }
        }
    }, [stations, mapReady]);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                },
                (error) => {
                    console.log('Geolocation error:', error);
                }
            );
        }
    }, []);

    // Calculate map center and bounds
    const { center, bounds } = useMemo(() => {
        const allPoints = [...stations];
        if (userLocation) {
            allPoints.push({ location: userLocation });
        }

        if (allPoints.length === 0) {
            return {
                center: [10.7769, 106.7009], // HCM center
                bounds: null
            };
        }

        // Filter valid coordinates - support both location.coordinates and location direct
        const validLats = allPoints
            .map(s => s.location?.coordinates?.lat || s.location?.lat || s.lat)
            .filter(lat => lat != null && !isNaN(lat));
        const validLngs = allPoints
            .map(s => s.location?.coordinates?.lng || s.location?.lng || s.lng)
            .filter(lng => lng != null && !isNaN(lng));

        if (validLats.length === 0 || validLngs.length === 0) {
            return {
                center: [10.7769, 106.7009], // HCM center fallback
                bounds: null
            };
        }

        const centerLat = (Math.max(...validLats) + Math.min(...validLats)) / 2;
        const centerLng = (Math.max(...validLngs) + Math.min(...validLngs)) / 2;

        const result = {
            center: [centerLat, centerLng],
            bounds: [
                [Math.min(...validLats), Math.min(...validLngs)],
                [Math.max(...validLats), Math.max(...validLngs)]
            ]
        };

        console.log('🎯 Map center calculated:', result.center);
        return result;
    }, [stations, userLocation]);

    const handleStationClick = (station) => {
        setSelectedStation(station);
        setSelectedFromList(false);
        setShowRoute(false);
    };

    const handleListSelect = (station) => {
        setSelectedStation(station);
        setSelectedFromList(true);
        // center map on the selected station for visibility
        const coords = getStationCoords(station);
        if (mapRef.current && coords.lat && coords.lng) {
            mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
        }
    };

    const handleShowDirection = () => {
        if (selectedStation && userLocation) {
            setShowRoute(true);
        }
    };

    const handleCenterOnUser = () => {
        if (userLocation) {
            // This will be handled by the map component
            setSelectedStation(null);
            setShowRoute(false);
        }
    };

    // Don't render if no valid center or not ready
    if (!mapReady || !center || center.some(c => isNaN(c)) || stations.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Đang tải bản đồ...
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Map Container */}
            <Box sx={{ position: 'relative', height: 500, width: '100%', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                {mapReady && (
                    <MapContainer
                        center={center}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}
                        scrollWheelZoom={true}
                        attributionControl={false}
                        whenCreated={(map) => {
                            // store map ref and prevent multiple initialization
                            mapRef.current = map;
                            setTimeout(() => {
                                map.invalidateSize();
                            }, 100);
                        }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Set bounds to show all markers */}
                        <MapBoundsSetter bounds={bounds} />

                        {/* User location marker */}
                        {userLocation && (
                            <>
                                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                    <Popup>
                                        <Box sx={{ p: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                📍 Vị trí của bạn
                                            </Typography>
                                        </Box>
                                    </Popup>
                                </Marker>
                                <Circle
                                    center={[userLocation.lat, userLocation.lng]}
                                    radius={100}
                                    pathOptions={{ color: '#2196f3', fillColor: '#2196f3', fillOpacity: 0.1 }}
                                />
                            </>
                        )}

                        {/* Station markers */}
                        {stations.map((station) => {
                            const isAvailable = station.stats?.available > 0;
                            const coords = getStationCoords(station);
                            return (
                                <Marker
                                    key={station.id}
                                    position={[coords.lat, coords.lng]}
                                    icon={createStationIcon(isAvailable)}
                                    eventHandlers={{
                                        click: () => handleStationClick(station)
                                    }}
                                >
                                    <Popup>
                                        <Box sx={{ p: 1, minWidth: 200 }}>
                                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                {station.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                📍 {station.location?.address || station.address}
                                            </Typography>
                                            <Box sx={{ mb: 1 }}>
                                                <Chip
                                                    label={`${station.stats?.available} / ${station.stats?.total} cổng đang trống`}
                                                    size="small"
                                                    color={isAvailable ? 'success' : 'error'}
                                                    sx={{ borderRadius: '16px', fontWeight: 600 }}
                                                />
                                                {/* Show operating hours in the popup when available */}
                                                {station.operatingHours && (
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                                        {formatOperatingHours(station.operatingHours)}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="small"
                                                onClick={() => {
                                                    handleStationClick(station);
                                                    if (onStationSelect) {
                                                        onStationSelect(station);
                                                    }
                                                }}
                                            >
                                                Chọn trạm này
                                            </Button>
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* If a station was selected from the list, show a popup at its location */}
                        {selectedStation && selectedFromList && (() => {
                            const coords = getStationCoords(selectedStation);
                            if (!coords.lat || !coords.lng) return null;
                            return (
                                <Popup position={[coords.lat, coords.lng]} onClose={() => setSelectedStation(null)}>
                                    <Box sx={{ p: 1, minWidth: 220 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            {selectedStation.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                            📍 {selectedStation.location?.address || selectedStation.address}
                                        </Typography>
                                        <Box sx={{ mb: 1 }}>
                                            <Chip
                                                label={`${selectedStation.stats?.available} / ${selectedStation.stats?.total} cổng đang trống`}
                                                size="small"
                                                color={selectedStation.stats?.available > 0 ? 'success' : 'error'}
                                                sx={{ borderRadius: '16px', fontWeight: 600 }}
                                            />
                                            {selectedStation.operatingHours && (
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                                    {formatOperatingHours(selectedStation.operatingHours)}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="small"
                                            onClick={() => {
                                                if (onStationSelect) onStationSelect(selectedStation);
                                            }}
                                        >
                                            Chọn trạm này
                                        </Button>
                                    </Box>
                                </Popup>
                            );
                        })()}

                        {/* Route line */}
                        {showRoute && userLocation && selectedStation && (() => {
                            const destCoords = getStationCoords(selectedStation);
                            return (
                                <RouteDrawer
                                    userLocation={userLocation}
                                    destination={destCoords}
                                />
                            );
                        })()}
                    </MapContainer>
                )}

                {/* Center on User button */}
                {userLocation && (
                    <Tooltip title="Về vị trí của tôi">
                        <IconButton
                            sx={{
                                position: 'absolute',
                                top: 80,
                                right: 10,
                                bgcolor: 'white',
                                boxShadow: 2,
                                '&:hover': { bgcolor: 'grey.100' },
                                zIndex: 1400
                            }}
                            onClick={handleCenterOnUser}
                        >
                            <MyLocationIcon color="primary" />
                        </IconButton>
                    </Tooltip>
                )}

                {/* Legend */}
                <Card sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    p: 2,
                    minWidth: 220,
                    zIndex: 1300,
                    boxShadow: 4,
                    bgcolor: 'rgba(255,255,255,0.95)'
                }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 1.5 }}>
                        📍 Chú thích
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 16,
                                height: 16,
                                bgcolor: 'success.main',
                                borderRadius: '50%',
                                border: '2px solid white',
                                boxShadow: 1
                            }} />
                            <Typography variant="body2" fontWeight="medium">Trạm có chỗ trống</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 16,
                                height: 16,
                                bgcolor: 'error.main',
                                borderRadius: '50%',
                                border: '2px solid white',
                                boxShadow: 1
                            }} />
                            <Typography variant="body2" fontWeight="medium">Trạm đã đầy</Typography>
                        </Box>
                        {userLocation && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    width: 16,
                                    height: 16,
                                    bgcolor: 'primary.main',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    boxShadow: 1
                                }} />
                                <Typography variant="body2" fontWeight="medium">Vị trí của bạn</Typography>
                            </Box>
                        )}
                    </Box>
                    {/* Hint removed as requested */}
                </Card>

                {/* Selected station card removed — popups now appear at station locations */}
            </Box>

            {/* Station List */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                📋 Danh sách trạm ({stations.length})
            </Typography>
            <Box>
                {stations.map((station) => {
                    const isAvailable = station.stats?.available > 0;
                    const maxPower = station.charging?.maxPower || 150;
                    const pricePerKwh = station.id === 'station-001' ? 8500 :
                        station.id === 'station-002' ? 9500 :
                            station.id === 'station-003' ? 7500 : 8500;

                    return (
                        <Box
                            key={station.id}
                            onClick={() => handleListSelect(station)}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                border: 1,
                                borderColor: selectedStation?.id === station.id ? 'primary.main' : 'divider',
                                p: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: 'grey.50',
                                    borderColor: 'primary.light'
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                {/* Icon xe */}
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        bgcolor: 'grey.200',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}
                                >
                                    <ElectricCar sx={{ fontSize: 32, color: 'grey.600' }} />
                                </Box>

                                {/* Thông tin trạm */}
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {station.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                            <Chip
                                                label={`${station.stats?.available}/${station.stats?.total} cổng đang trống`}
                                                size="small"
                                                color={isAvailable ? 'success' : 'error'}
                                                sx={{ borderRadius: '16px' }}
                                            />
                                            {station.operatingHours && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatOperatingHours(station.operatingHours)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                            {station.location?.address || station.address}
                                        </Typography>
                                        {/* operating hours displayed only under availability chip on the right */}
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Speed sx={{ fontSize: 16, color: 'primary.main' }} />
                                            <Typography variant="body2">
                                                Sạc nhanh lên đến {maxPower} kW
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                                            Từ {pricePerKwh.toLocaleString('vi-VN')} ₫/kWh
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Nút */}
                                <Button
                                    variant="contained"
                                    size="medium"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onStationSelect) {
                                            onStationSelect(station);
                                        }
                                    }}
                                    sx={{ ml: 2 }}
                                >
                                    Đặt ngay
                                </Button>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default StationMapLeaflet;
