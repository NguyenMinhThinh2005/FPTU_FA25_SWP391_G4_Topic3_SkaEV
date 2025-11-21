import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button 
} from '@mui/material';

const ControlDialog = ({ open, target, type, onClose, onConfirm }) => {
  const getDialogTitle = () => {
    if (!target) return 'Xác nhận hành động';
    return `Xác nhận ${type === 'Reset' ? 'khởi động lại' : type === 'Stop' ? 'dừng' : 'bảo trì'} ${target.sku || 'trạm'}`;
  };

  const getDialogContent = () => {
    if (!target) return '';
    if (type === 'Stop') {
      return 'Hành động này sẽ ngắt nguồn điện ngay lập tức. Bạn có chắc chắn muốn tiếp tục?';
    }
    if (type === 'Reset') {
      return 'Thiết bị sẽ khởi động lại và có thể mất vài phút để hoạt động trở lại.';
    }
    return 'Thiết bị sẽ được chuyển sang chế độ bảo trì và không thể sử dụng cho đến khi kích hoạt lại.';
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {getDialogContent()}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy bỏ</Button>
        <Button 
          onClick={() => onConfirm(target?.id, type)} 
          variant="contained" 
          color={type === 'Stop' ? 'error' : 'primary'}
          autoFocus
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ControlDialog;
