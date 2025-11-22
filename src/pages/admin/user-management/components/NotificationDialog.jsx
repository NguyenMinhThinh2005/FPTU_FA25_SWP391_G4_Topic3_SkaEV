import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField 
} from '@mui/material';

const NotificationDialog = ({ open, onClose, user, form, setForm, onSend }) => {
  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gửi thông báo cho {user.fullName}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Loại thông báo"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="system_alert">Cảnh báo hệ thống</option>
              <option value="promotion">Khuyến mãi</option>
              <option value="booking_confirmed">Xác nhận booking</option>
              <option value="charging_complete">Sạc hoàn tất</option>
              <option value="payment_reminder">Nhắc thanh toán</option>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tiêu đề"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nội dung"
              multiline
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          variant="contained"
          onClick={onSend}
          disabled={!form.title || !form.message}
        >
          Gửi thông báo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationDialog;
