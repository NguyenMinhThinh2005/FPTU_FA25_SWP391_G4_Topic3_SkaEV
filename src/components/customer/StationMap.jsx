import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { MyLocation, Close } from '@mui/icons-material';

const StationMap = ({ stations, onStationSelect }) => {
    const [mapCenter, setMapCenter] = useState({ lat: 10.7769, lng: 106.7009 }); // HCM center
    const [userLocation, setUserLocation] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);

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
                    setMapCenter(location);
                },
                (error) => {
                    console.log('Geolocation error:', error);
                }
            );
        }
    }, []);

    // Build embed map URL with markers
    const buildEmbedMapUrl = () => {
        // Calculate bounding box to fit all stations
        const lats = stations.map(s => s.location.coordinates.lat);
        const lngs = stations.map(s => s.location.coordinates.lng);
        const minLat = Math.min(...lats, mapCenter.lat) - 0.02;
        const maxLat = Math.max(...lats, mapCenter.lat) + 0.02;
        const minLng = Math.min(...lngs, mapCenter.lng) - 0.02;
        const maxLng = Math.max(...lngs, mapCenter.lng) + 0.02;

        // Use OpenStreetMap embed with center marker
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${centerLat},${centerLng}`;
    };

    const handleCenterOnUser = () => {
        if (userLocation) {
            setMapCenter(userLocation);
        }
    };

    const handleStationClick = (station) => {
        setSelectedMarker(station);
        setMapCenter(station.location.coordinates);
        if (onStationSelect) {
            onStationSelect(station);
        }
    };

    return (
        <Box sx={{ position: 'relative', height: '100%', minHeight: '600px' }}>
            {/* Map Container */}
            <Box sx={{
                width: '100%',
                height: '600px',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid',
                borderColor: 'primary.main',
                bgcolor: '#e5e5e5',
                boxShadow: 3
            }}>
                {/* Embedded Map */}
                <iframe
                    src={buildEmbedMapUrl()}
                    title="Station Map"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block'
                    }}
                    loading="lazy"
                />

                {/* Map Loading Overlay */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    pointerEvents: 'none',
                    opacity: 0,
                    animation: 'fadeOut 1s ease-in-out',
                    '@keyframes fadeOut': {
                        '0%': { opacity: 1 },
                        '100%': { opacity: 0, display: 'none' }
                    }
                }}>
                    <Typography variant="h6" color="text.secondary">
                        Đang tải bản đồ...
                    </Typography>
                </Box>

                {/* Overlay Controls */}
                <Box sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    zIndex: 10
                }}>
                    {/* Center on User */}
                    {userLocation && (
                        <Tooltip title="Vị trí của tôi">
                            <Card sx={{ p: 0.5 }}>
                                <IconButton size="small" onClick={handleCenterOnUser} color="primary">
                                    <MyLocation />
                                </IconButton>
                            </Card>
                        </Tooltip>
                    )}
                </Box>

                {/* Legend */}
                <Card sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    p: 2,
                    minWidth: 220,
                    zIndex: 10,
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
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        💡 Click vào trạm bên dưới để xem chi tiết
                    </Typography>
                </Card>

                {/* Selected Station Info */}
                {selectedMarker && (
                    <Card sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        maxWidth: 320,
                        zIndex: 10
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {selectedMarker.name}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setSelectedMarker(null)}
                                    sx={{ mt: -1, mr: -1 }}
                                >
                                    <Close />
                                </IconButton>
                            </Box>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {selectedMarker.location.address}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`${selectedMarker.charging?.availablePorts || 0}/${selectedMarker.charging?.totalPorts || 0} trống`}
                                    color={selectedMarker.charging?.availablePorts > 0 ? 'success' : 'error'}
                                    size="small"
                                />
                                <Chip
                                    label={`${selectedMarker.charging?.maxPower || 0} kW`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                sx={{ mt: 2 }}
                                onClick={() => handleStationClick(selectedMarker)}
                            >
                                Đặt chỗ ngay
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Station List Below Map */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Trạm sạc gần đây ({stations.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {stations.map((station, index) => (
                        <Card
                            key={station.id}
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                border: '2px solid',
                                borderColor: selectedMarker?.id === station.id ? 'primary.main' : 'transparent',
                                '&:hover': {
                                    boxShadow: 4,
                                    borderColor: 'primary.light'
                                }
                            }}
                            onClick={() => handleStationClick(station)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {String.fromCharCode(65 + index)}. {station.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {station.location.address}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Chip
                                            label={station.charging?.availablePorts > 0 ? 'Có chỗ' : 'Đầy'}
                                            color={station.charging?.availablePorts > 0 ? 'success' : 'error'}
                                            size="small"
                                        />
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                            {station.charging?.availablePorts}/{station.charging?.totalPorts} trống
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default StationMap;
