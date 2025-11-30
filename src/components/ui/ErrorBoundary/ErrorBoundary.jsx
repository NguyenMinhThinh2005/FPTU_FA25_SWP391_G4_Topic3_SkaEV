import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { Refresh } from "@mui/icons-material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    const isDev = import.meta.env?.DEV;
    if (isDev) {
      console.error("Error caught by boundary:", error, errorInfo);
    }
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // In production, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          p={3}
        >
          <Alert
            severity="error"
            sx={{
              width: "100%",
              maxWidth: 600,
              mb: 3,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ôi! Đã xảy ra lỗi
            </Typography>
            <Typography variant="body2">
              {this.props.fallbackMessage ||
                "Đã xảy ra lỗi không mong muốn. Vui lòng thử làm mới trang."}
            </Typography>

            {import.meta.env?.DEV && this.state.error && (
              <Box mt={2}>
                <Typography variant="caption" component="details">
                  <summary style={{ cursor: "pointer" }}>
                    Chi tiết lỗi (Development)
                  </summary>
                  <pre
                    style={{
                      marginTop: 8,
                      fontSize: "12px",
                      overflow: "auto",
                      maxHeight: "200px",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      borderRadius: "4px",
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </Typography>
              </Box>
            )}
          </Alert>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
            >
              Thử lại
            </Button>

            <Button
              variant="outlined"
              onClick={() => (window.location.href = "/")}
            >
              Về trang chủ
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
