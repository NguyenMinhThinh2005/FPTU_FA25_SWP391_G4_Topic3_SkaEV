import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, IconButton, Tooltip, Typography, Box 
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

const ErrorLogsTab = ({ errors, onResolveClick }) => {
  if (!errors || errors.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography>Không có lỗi nào được ghi nhận.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <Table>
        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
          <TableRow>
            <TableCell>Thời gian</TableCell>
            <TableCell>Mã lỗi</TableCell>
            <TableCell>Mức độ</TableCell>
            <TableCell>Mô tả</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="right">Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errors.map((error) => (
            <TableRow key={error.id} hover>
              <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
              <TableCell>
                <Chip label={error.errorCode} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Chip 
                  label={error.severity} 
                  color={error.severity === 'Critical' ? 'error' : error.severity === 'Warning' ? 'warning' : 'info'}
                  size="small"
                />
              </TableCell>
              <TableCell>{error.message}</TableCell>
              <TableCell>
                <Chip 
                  label={error.status} 
                  color={error.status === 'Resolved' ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                {error.status !== 'Resolved' && (
                  <Tooltip title="Đánh dấu đã xử lý">
                    <IconButton 
                      color="success" 
                      onClick={() => onResolveClick(error)}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ErrorLogsTab;
