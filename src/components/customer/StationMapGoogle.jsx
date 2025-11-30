import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
    Alert,
    CircularProgress,
    Paper,
    Divider,
    Avatar
} from '@mui/material';
import {
    MyLocation as MyLocationIcon,
    ElectricCar,
    LocationOn,
    Speed,
    Close as CloseIcon,
    EvStation as EvStationIcon,
    Directions as DirectionsIcon,
    BatteryChargingFull,
    AccessTime,
    Phone,
    Navigation
} from '@mui/icons-material';
import { 
    APIProvider, 
    Map, 
    AdvancedMarker, 
    Pin,
    InfoWindow,
    useMap
} from '@vis.gl/react-google-maps';

const VIETNAM_CENTER = { lat: 10.8231, lng: 106.6297 }; // HCM City

// Component để điều khiển map
const MapController = ({ center, zoom }) => {
    const map = useMap();

    React.useEffect(() => {
        if (map && center) {
            map.panTo(center);
            if (zoom) {
                map.setZoom(zoom);
            }
        }
    }, [map, center, zoom]);

    return null;
};

// Custom marker cho user location
const UserLocationMarker = ({ position, onClick }) => {
    if (!position) return null;

    return (
        <AdvancedMarker 
            position={position}
            onClick={onClick}
            title="Vị trí của bạn"
        >
            <div style={{
                backgroundColor: '#2196F3',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '4px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer'
            }} />
        </AdvancedMarker>
    );
};

// Custom marker cho charging station
const StationMarker = ({ station, selected, onClick }) => {
    const hasAvailableSlots = station.charging?.poles?.some(
        pole => (pole.availablePorts || 0) > 0
    );

    const pinColor = hasAvailableSlots ? '#4CAF50' : '#F44336';
    const glyphColor = 'white';

    return (
        <AdvancedMarker
            position={{
                lat: station.location.coordinates.lat,
                lng: station.location.coordinates.lng
            }}
            onClick={onClick}
            title={station.name}
            zIndex={selected ? 1000 : 1}
        >
            <Pin
                background={pinColor}
                glyphColor={glyphColor}
                borderColor={selected ? '#1976d2' : 'white'}
                scale={selected ? 1.3 : 1.0}
            >
                <EvStationIcon style={{ fontSize: 20, color: glyphColor }} />
            </Pin>
        </AdvancedMarker>
    );
};

// Custom InfoWindow cho station
const StationInfoWindow = ({ station, onClose, onBooking, onRequestDirections }) => {
    // Prefer the normalized poles/ports model
    const hasAvailableSlots = station.charging?.poles?.some(
        pole => (pole.availablePorts || 0) > 0
    );

    const totalSlots = station.charging?.poles?.reduce(
        (sum, pole) => sum + (pole.totalPorts || 0), 0
    ) || 0;

    const _availableSlots = station.charging?.poles?.reduce(
        (sum, pole) => sum + (pole.availablePorts || 0), 0
    ) || 0;

    const formatOperatingHours = (oh) => {
        if (!oh) return 'Không rõ';
        if (typeof oh === 'string') {
            return oh === '24/7' ? 'Cả ngày' : oh;
        }
        const open = String(oh.open || '').toLowerCase();
        if (open === '24/7') return 'Cả ngày';
        return oh.open && oh.close ? `${oh.open} - ${oh.close}` : 'Không rõ';
    };

    return (
        <InfoWindow
            position={{
                lat: station.location.coordinates.lat,
                lng: station.location.coordinates.lng
            }}
            onCloseClick={onClose}
            maxWidth={350}
        >
            <Box sx={{ p: 1, minWidth: 300 }}>
                {/* Header */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: hasAvailableSlots ? 'success.main' : 'error.main' }}>
                        <EvStationIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            {station.name}
                        </Typography>
                        <Chip
                            label={hasAvailableSlots ? 'Còn chỗ' : 'Hết chỗ'}
                            color={hasAvailableSlots ? 'success' : 'error'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                    </Box>
                </Stack>

                {/* Address */}
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {station.location.address}
                    </Typography>
                </Stack>

                {/* Operating Hours */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {formatOperatingHours(station.operatingHours)}
                    </Typography>
                </Stack>

                {/* Availability */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <BatteryChargingFull sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {station.charging?.poles?.length || 0} trụ • {totalSlots} cổng
                    </Typography>
                </Stack>

                <Divider sx={{ my: 1 }} />

                {/* Tổng quan trụ (Charging poles summary) */}
                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Loại sạc:
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {station.charging?.poles?.map((pole, idx) => (
                            <Chip
                                key={idx}
                                label={`Trụ ${pole.name || pole.id} — Cổng ${pole.totalPorts || (pole.ports || []).length}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* Pricing */}
                {station.charging?.pricing && (
                    <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Giá sạc:
                        </Typography>
                        <Stack spacing={0.5}>
                            {station.charging.pricing.acRate && (
                                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                    AC: {station.charging.pricing.acRate.toLocaleString()} VNĐ/kWh
                                </Typography>
                            )}
                            {station.charging.pricing.dcRate && (
                                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                    DC: {station.charging.pricing.dcRate.toLocaleString()} VNĐ/kWh
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                )}

                {/* Actions */}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DirectionsIcon />}
                        onClick={() => onRequestDirections?.(station)}
                        fullWidth
                        sx={{ fontSize: '0.75rem' }}
                    >
                        Chỉ đường
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<ElectricCar />}
                        onClick={() => onBooking?.(station)}
                        disabled={!hasAvailableSlots}
                        fullWidth
                        sx={{ fontSize: '0.75rem' }}
                    >
                        Đặt chỗ
                    </Button>
                </Stack>
            </Box>
        </InfoWindow>
    );
};

// Directions overlay renders Google Directions API results on the map
const DirectionsOverlay = ({ origin, destination, onRouteCalculated }) => {
    const map = useMap();
    const rendererRef = useRef(null);
    const serviceRef = useRef(null);

    useEffect(() => {
        if (!map || !origin || !destination) {
            return;
        }

        if (!window.google || !window.google.maps) {
            console.error("Google Maps JavaScript API is not available");
            return;
        }

        if (!serviceRef.current) {
            serviceRef.current = new window.google.maps.DirectionsService();
        }

        if (!rendererRef.current) {
            rendererRef.current = new window.google.maps.DirectionsRenderer({
                map,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: "#1976d2",
                    strokeOpacity: 0.9,
                    strokeWeight: 6,
                },
            });
        } else {
            rendererRef.current.setMap(map);
        }

        const request = {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
        };

        serviceRef.current.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK || status === "OK") {
                rendererRef.current?.setDirections(result);
                const leg = result?.routes?.[0]?.legs?.[0];
                if (leg) {
                    const steps = (leg.steps || []).map((step, idx) => ({
                        id: idx,
                        instruction: step.instructions,
                        distance: step.distance?.text ?? "",
                        duration: step.duration?.text ?? "",
                    }));

                    onRouteCalculated?.({
                        distanceText: leg.distance?.text ?? "",
                        durationText: leg.duration?.text ?? "",
                        startAddress: leg.start_address ?? "",
                        endAddress: leg.end_address ?? "",
                        steps,
                    });

                    try {
                        if (result.routes?.[0]?.bounds) {
                            map.fitBounds(result.routes[0].bounds, { padding: 24 });
                        }
                    } catch (fitErr) {
                        console.warn("Could not fit bounds for route", fitErr);
                    }
                }
            } else {
                console.error("Directions request failed", status, result);
                onRouteCalculated?.(null);
                rendererRef.current?.setDirections({ routes: [] });
            }
        });

        return () => {
            rendererRef.current?.setMap(null);
        };
    }, [map, origin?.lat, origin?.lng, destination?.lat, destination?.lng, onRouteCalculated]);

    return null;
};

// Main Component
const StationMapGoogle = ({ 
    stations = [], 
    selectedStation = null,
    onStationSelect = () => {},
    onBookingClick = () => {},
    userLocation = null,
    height = '600px',
    showControls = true
}) => {
    const [mapCenter, setMapCenter] = useState(VIETNAM_CENTER);
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedStationId, setSelectedStationId] = useState(selectedStation?.id || null);
    const [userPos, setUserPos] = useState(userLocation);
    const [routeDestination, setRouteDestination] = useState(null);
    const [_routeInfo, setRouteInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Sync external user location when provided
    useEffect(() => {
        if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
            setUserPos(userLocation);
            setMapCenter(userLocation);
        }
    }, [userLocation?.lat, userLocation?.lng]);

    // Handle marker click
    const handleStationClick = useCallback((station) => {
        setSelectedStationId(station.id);
        setMapCenter({
            lat: station.location.coordinates.lat,
            lng: station.location.coordinates.lng
        });
        setMapZoom(15);
        onStationSelect(station);
        setRouteDestination(null);
        setRouteInfo(null);
    }, [onStationSelect]);

    // Handle info window close
    const handleInfoWindowClose = useCallback(() => {
        setSelectedStationId(null);
    }, []);

    // Get user location
    const handleGetUserLocation = useCallback(() => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Trình duyệt không hỗ trợ định vị');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserPos(pos);
                setMapCenter(pos);
                setMapZoom(15);
                setLoading(false);
            },
            (error) => {
                setError('Không thể lấy vị trí của bạn');
                setLoading(false);
                console.error('Geolocation error:', error);
            }
        );
    }, []);

    // Find nearest station
    const handleFindNearest = useCallback(() => {
        if (!userPos || stations.length === 0) return;

        const nearest = stations.reduce((prev, curr) => {
            const prevDist = Math.sqrt(
                Math.pow(prev.location.coordinates.lat - userPos.lat, 2) +
                Math.pow(prev.location.coordinates.lng - userPos.lng, 2)
            );
            const currDist = Math.sqrt(
                Math.pow(curr.location.coordinates.lat - userPos.lat, 2) +
                Math.pow(curr.location.coordinates.lng - userPos.lng, 2)
            );
            return currDist < prevDist ? curr : prev;
        });

        handleStationClick(nearest);
    }, [userPos, stations, handleStationClick]);

    const handleRouteCalculated = useCallback((info) => {
        setRouteInfo(info);
    }, []);

    const handleRequestDirections = useCallback((station) => {
        if (!station?.location?.coordinates) {
            return;
        }

        const destinationCoords = {
            lat: station.location.coordinates.lat,
            lng: station.location.coordinates.lng,
        };

        setSelectedStationId(station.id);
        setRouteDestination(destinationCoords);
        setRouteInfo(null);
        setMapCenter(destinationCoords);
        setMapZoom(14);
        onStationSelect(station);

        if (!userPos) {
            handleGetUserLocation();
        }
    }, [handleGetUserLocation, onStationSelect, userPos]);

    const selectedStationData = useMemo(() => 
        stations.find(s => s.id === selectedStationId),
        [stations, selectedStationId]
    );

    // Check if API key is set
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        return (
            <Card sx={{ height }}>
                <CardContent>
                    <Alert severity="warning">
                        <Typography variant="h6" gutterBottom>
                            Google Maps API Key chưa được cấu hình
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Để sử dụng Google Maps, bạn cần:
                        </Typography>
                        <ol style={{ marginLeft: 20, fontSize: '0.875rem' }}>
                            <li>Truy cập <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                            <li>Tạo API key mới</li>
                            <li>Bật Maps JavaScript API</li>
                            <li>Thêm API key vào file <code>.env.development</code>:</li>
                        </ol>
                        <Paper sx={{ p: 1, mt: 1, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
                        </Paper>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box sx={{ position: 'relative', height }}>
            <APIProvider apiKey={apiKey}>
                <Map
                    mapId="skaev-charging-stations-map"
                    defaultCenter={mapCenter}
                    defaultZoom={mapZoom}
                    gestureHandling="greedy"
                    disableDefaultUI={!showControls}
                    styles={{ width: '100%', height: '100%' }}
                >
                    <MapController center={mapCenter} zoom={mapZoom} />

                    {/* User Location Marker */}
                    {userPos && (
                        <UserLocationMarker 
                            position={userPos}
                            onClick={() => {
                                setMapCenter(userPos);
                                setMapZoom(15);
                            }}
                        />
                    )}

                    {/* Station Markers */}
                    {stations.map((station) => (
                        <StationMarker
                            key={station.id}
                            station={station}
                            selected={station.id === selectedStationId}
                            onClick={() => handleStationClick(station)}
                        />
                    ))}

                    {/* Info Window */}
                    {selectedStationData && (
                        <StationInfoWindow
                            station={selectedStationData}
                            onClose={handleInfoWindowClose}
                            onBooking={onBookingClick}
                            onRequestDirections={handleRequestDirections}
                        />
                    )}

                    {userPos && routeDestination && (
                        <DirectionsOverlay
                            origin={userPos}
                            destination={routeDestination}
                            onRouteCalculated={handleRouteCalculated}
                        />
                    )}
                </Map>

                {/* Floating Controls */}
                {showControls && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        <Tooltip title="Vị trí của tôi" placement="left">
                            <IconButton
                                onClick={handleGetUserLocation}
                                disabled={loading}
                                sx={{
                                    bgcolor: 'white',
                                    boxShadow: 2,
                                    '&:hover': { bgcolor: 'grey.100' }
                                }}
                            >
                                {loading ? <CircularProgress size={24} /> : <MyLocationIcon />}
                            </IconButton>
                        </Tooltip>

                        {userPos && (
                            <Tooltip title="Trạm gần nhất" placement="left">
                                <IconButton
                                    onClick={handleFindNearest}
                                    sx={{
                                        bgcolor: 'white',
                                        boxShadow: 2,
                                        '&:hover': { bgcolor: 'grey.100' }
                                    }}
                                >
                                    <Navigation />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert 
                        severity="error" 
                        onClose={() => setError(null)}
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            minWidth: 300
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Station Counter */}
                <Paper
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <EvStationIcon color="primary" />
                    <Typography variant="body2" fontWeight="medium">
                        {stations.length} trạm sạc
                    </Typography>
                </Paper>
            </APIProvider>
        </Box>
    );
};

export default StationMapGoogle;
