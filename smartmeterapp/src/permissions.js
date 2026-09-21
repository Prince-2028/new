export const PERMISSIONS = {
  Administrator: {
    // =========================
    // Account
    // =========================
    manageAccounts: true,
    changePassword: true,

    // =========================
    // General Meter Access
    // =========================
    readMeter: true,
    writeMeter: true,
    setTariff: true,

    // =========================
    // Top-level menus
    // =========================
    logs: true,
    portSetting: true,

    // =========================
    // Device Parameter - R/W/I/E
    // =========================
    deviceParameterRead: true,
    deviceParameterWrite: true,
    deviceParameterImport: true,
    deviceParameterExport: true,

    // =========================
    // Billing - R/E
    // =========================
    billingRead: true,
    billingExport: true,

    // =========================
    // Load Profile - R/E
    // =========================
    loadProfileRead: true,
    loadProfileExport: true,

    // =========================
    // Event Log - R/E
    // =========================
    eventLogRead: true,
    eventLogExport: true,

    // =========================
    // Execute
    // =========================
    execute: true,

    // =========================
    // Firmware / Image Transfer
    // =========================
    imageTransfer: true,
    imageTransferREN: true,
    upgradeFirmware: true,

    // =========================
    // Device Management
    // =========================
    addDevice: true,
    editDevice: true,
    deleteDevice: true,
    copyDevice: true,
  },

  Programmer: {
    // =========================
    // Account
    // Only Change Password
    // =========================
    manageAccounts: false,
    changePassword: true,

    // =========================
    // General Meter Access
    // =========================
    readMeter: true,
    writeMeter: true,

    // =========================
    // Top-level menus
    // =========================
    logs: false,
    portSetting: true,

    // =========================
    // Device Parameter - R/W/I/E
    // =========================
    deviceParameterRead: true,
    deviceParameterWrite: true,
    deviceParameterImport: true,
    deviceParameterExport: true,

    // =========================
    // Billing - R/E
    // =========================
    billingRead: true,
    billingExport: true,

    // =========================
    // Load Profile - R/E
    // =========================
    loadProfileRead: true,
    loadProfileExport: true,

    // =========================
    // Event Log - R/E
    // =========================
    eventLogRead: true,
    eventLogExport: true,

    // =========================
    // Execute - Hidden
    // =========================
    execute: false,

    // =========================
    // Firmware / Image Transfer - Hidden
    // =========================
    imageTransfer: false,
    imageTransferREN: false,
    upgradeFirmware: false,

    // =========================
    // Device Management
    // =========================
    addDevice: true,
    editDevice: true,
    deleteDevice: true,
    copyDevice: true,
  },

  Reader: {
    // =========================
    // Account
    // =========================
    manageAccounts: false,
    changePassword: true,

    // =========================
    // General Meter Access
    // =========================
    readMeter: true,
    writeMeter: false,
    setTariff: false,

    // =========================
    // Top-level menus
    // =========================
    logs: false,
    portSetting: true,

    // =========================
    // Device Parameter
    // Read + Export
    // =========================
    deviceParameterRead: true,
    deviceParameterWrite: false,
    deviceParameterImport: false,
    deviceParameterExport: true,

    // =========================
    // Billing
    // Read + Export
    // =========================
    billingRead: true,
    billingExport: true,

    // =========================
    // Load Profile
    // Read + Export
    // =========================
    loadProfileRead: true,
    loadProfileExport: true,

    // =========================
    // Event Log
    // Read + Export
    // =========================
    eventLogRead: true,
    eventLogExport: true,

    // =========================
    // Execute
    // =========================
    execute: false,

    // =========================
    // Firmware / Image Transfer
    // =========================
    imageTransfer: false,
    imageTransferREN: false,
    upgradeFirmware: false,

    // =========================
    // Device Management
    // =========================
    addDevice: false,
    editDevice: false,
    deleteDevice: false,
    copyDevice: false,
  },

  Upgrader: {
    // =========================
    // Account
    // =========================
    manageAccounts: false,
    changePassword: true,

    // =========================
    // General Meter Access
    // =========================
    readMeter: true,
    writeMeter: false,
    setTariff: false,

    // =========================
    // Top-level menus
    // =========================
    logs: false,
    portSetting: true,

    // =========================
    // Device Parameter
    // =========================
    deviceParameterRead: false,
    deviceParameterWrite: false,
    deviceParameterImport: false,
    deviceParameterExport: false,

    // =========================
    // Billing
    // =========================
    billingRead: false,
    billingExport: false,

    // =========================
    // Load Profile
    // =========================
    loadProfileRead: false,
    loadProfileExport: false,

    // =========================
    // Event Log
    // =========================
    eventLogRead: false,
    eventLogExport: false,

    // =========================
    // Execute
    // =========================
    execute: false,

    // =========================
    // Firmware / Image Transfer
    // =========================
    imageTransfer: true,
    imageTransferREN: true,
    upgradeFirmware: true,

    // =========================
    // Device Management
    // =========================
    addDevice: false,
    editDevice: false,
    deleteDevice: false,
    copyDevice: false,
  },
};