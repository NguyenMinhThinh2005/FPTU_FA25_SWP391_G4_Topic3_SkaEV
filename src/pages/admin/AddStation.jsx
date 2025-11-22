import React from "react";
import { Box, Card, CardContent, Button, CircularProgress } from "@mui/material";
import { ArrowBack, Add, Save } from "@mui/icons-material";
import { useAddStation } from "./add-station/hooks/useAddStation";
import AddStationHeader from "./add-station/components/AddStationHeader";
import AddStationStepper from "./add-station/components/AddStationStepper";
import BasicInfoStep from "./add-station/components/steps/BasicInfoStep";
import ChargingConfigStep from "./add-station/components/steps/ChargingConfigStep";
import AmenitiesStep from "./add-station/components/steps/AmenitiesStep";
import ConfirmationStep from "./add-station/components/steps/ConfirmationStep";

const AddStation = () => {
  const {
    activeStep,
    loading,
    errors,
    formData,
    amenitiesOptions,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
    navigate
  } = useAddStation();

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoStep 
            formData={formData} 
            errors={errors} 
            handleInputChange={handleInputChange} 
          />
        );
      case 1:
        return (
          <ChargingConfigStep 
            formData={formData} 
            errors={errors} 
            handleInputChange={handleInputChange} 
          />
        );
      case 2:
        return (
          <AmenitiesStep 
            formData={formData} 
            amenitiesOptions={amenitiesOptions} 
            handleInputChange={handleInputChange} 
          />
        );
      case 3:
        return (
          <ConfirmationStep 
            formData={formData} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <AddStationHeader onBack={() => navigate("/admin/stations")} />

      <AddStationStepper activeStep={activeStep} />

      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBack />}
        >
          Quay lại
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep < 3 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<Add />}
            >
              Tiếp theo
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Đang tạo...' : 'Tạo trạm sạc'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AddStation;
