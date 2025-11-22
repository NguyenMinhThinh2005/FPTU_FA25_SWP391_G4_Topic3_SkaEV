import React from "react"; 
import { Box, Grid, Alert, CircularProgress } from "@mui/material";
import { usePlans } from "./plans/hooks/usePlans";
import PlansHeader from "./plans/components/PlansHeader";
import PlanCard from "./plans/components/PlanCard";
import PlanDialog from "./plans/components/PlanDialog";

const Plans = () => {
  const {
    plans,
    loading,
    openDialog,
    editingPlan,
    error,
    success,
    formData,
    setFormData,
    setError,
    setSuccess,
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
    handleDelete,
    handleToggleStatus
  } = usePlans();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PlansHeader onAdd={() => handleOpenDialog()} />

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={6} lg={4} key={plan.planId}>
            <PlanCard
              plan={plan}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </Grid>
        ))}
      </Grid>

      <PlanDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editingPlan={editingPlan}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};

export default Plans;
