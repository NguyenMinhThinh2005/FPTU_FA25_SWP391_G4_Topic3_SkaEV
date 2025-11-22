import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const StationSelector = ({ stations, selectedStation, onStationChange }) => {
  return (
    <FormControl fullWidth sx={{ mb: 3, maxWidth: 400 }}>
      <InputLabel>Select Station</InputLabel>
      <Select
        value={selectedStation}
        label="Select Station"
        onChange={(e) => onStationChange(e.target.value)}
      >
        {stations.map((station) => (
          <MenuItem key={station.stationID} value={station.stationID}>
            {station.stationName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StationSelector;