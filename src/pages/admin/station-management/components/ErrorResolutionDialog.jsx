import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, 
  Button, TextField 
} from '@mui/material';

const ErrorResolutionDialog = ({ open, error, onClose, onConfirm }) => {
  const [resolution, setResolution] = useState('');

  const handleConfirm = () => {
    onConfirm(error?.id, resolution);
    setResolution('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Xử lý sự cố</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Vui lòng nhập ghi chú về cách xử lý sự cố này.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Ghi chú xử lý"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy bỏ</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!resolution.trim()}
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorResolutionDialog;
