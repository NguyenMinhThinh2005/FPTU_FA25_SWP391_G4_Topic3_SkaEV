import React from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useUserManagement } from "./user-management/hooks/useUserManagement";
import UserManagementHeader from "./user-management/components/UserManagementHeader";
import UserStats from "./user-management/components/UserStats";
import UserFilters from "./user-management/components/UserFilters";
import UserTable from "./user-management/components/UserTable";
import UserDialog from "./user-management/components/UserDialog";
import DeleteUserDialog from "./user-management/components/DeleteUserDialog";
import ChangeRoleDialog from "./user-management/components/ChangeRoleDialog";
import StaffEditDialog from "./user-management/components/StaffEditDialog";

const UserManagement = () => {
  const {
    users,
    loading,
    stations,
    query,
    setQuery,
    roleFilter,
    setRoleFilter,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    roleDialogOpen,
    setRoleDialogOpen,
    staffEditDialogOpen,
    setStaffEditDialogOpen,
    staffEditTab,
    setStaffEditTab,
    editUser,
    userToDelete,
    userToChangeRole,
    selectedStationId,
    newRole,
    setNewRole,
    snackbar,
    form,
    setForm,
    selectedStation,
    availableStationsCount,
    filteredUsers,
    openCreate,
    openEdit,
    openDeleteDialog,
    openRoleDialog,
    openStaffEditDialog,
    handleDelete,
    handleRoleChange,
    handleManagedStationChange,
    handleSave,
    handleChangeRole,
    handleSaveStaff,
    toggleStationSelection,
    getStationManager,
    isStationDisabled,
    closeSnackbar,
    navigate,
  } = useUserManagement();

  return (
    <Box>
      <UserManagementHeader onAddUser={openCreate} />

      <UserStats users={users} />

      <UserFilters 
        query={query} 
        setQuery={setQuery} 
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      <UserTable
        loading={loading}
        filteredUsers={filteredUsers}
        query={query}
        roleFilter={roleFilter}
        navigate={navigate}
        onEdit={openEdit}
        onRoleChange={openRoleDialog}
        onDelete={openDeleteDialog}
        onStaffEdit={openStaffEditDialog}
      />

      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editUser={editUser}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        handleRoleChange={handleRoleChange}
        handleManagedStationChange={handleManagedStationChange}
        stations={stations}
        availableStationsCount={availableStationsCount}
        getStationManager={getStationManager}
        isStationDisabled={isStationDisabled}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        userToDelete={userToDelete}
        handleDelete={handleDelete}
      />

      <ChangeRoleDialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        userToChangeRole={userToChangeRole}
        newRole={newRole}
        setNewRole={setNewRole}
        handleChangeRole={handleChangeRole}
      />

      <StaffEditDialog
        open={staffEditDialogOpen}
        onClose={() => setStaffEditDialogOpen(false)}
        form={form}
        setForm={setForm}
        staffEditTab={staffEditTab}
        setStaffEditTab={setStaffEditTab}
        stations={stations}
        selectedStation={selectedStation}
        selectedStationId={selectedStationId}
        toggleStationSelection={toggleStationSelection}
        getStationManager={getStationManager}
        isStationDisabled={isStationDisabled}
        handleSaveStaff={handleSaveStaff}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
