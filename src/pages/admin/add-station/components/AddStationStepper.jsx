import React from "react";
import { Paper, Stepper, Step, StepLabel } from "@mui/material";
import { LocationOn, ElectricCar, Settings, CheckCircle } from "@mui/icons-material";

const steps = [
  { label: "Thông tin cơ bản", icon: <LocationOn /> },
  { label: "Cấu hình sạc", icon: <ElectricCar /> },
  { label: "Tiện ích & Dịch vụ", icon: <Settings /> },
  { label: "Xác nhận", icon: <CheckCircle /> },
];

const AddStationStepper = ({ activeStep }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stepper activeStep={activeStep} orientation="horizontal">
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel icon={step.icon}>
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default AddStationStepper;
