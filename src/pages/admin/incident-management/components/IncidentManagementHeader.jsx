import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const IncidentManagementHeader = ({ onCreate }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 1,
        mb: 3
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Sự cố
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
      >
        Báo cáo sự cố
      </Button>
    </Box>
  );
};

IncidentManagementHeader.propTypes = {
  onCreate: PropTypes.func.isRequired
};

export default IncidentManagementHeader;
