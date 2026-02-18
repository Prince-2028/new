// src/permissions.js
export const PERMISSIONS = {
  Administrator: {
    manageAccounts:    true,
    readMeter:         true,
    writeMeter:        true,
    setTariff:         true,
    upgradeFirmware:   true,

    // device-specific actions
    addDevice:    true,
    editDevice:   true,
    deleteDevice: true,
    copyDevice:   true,
  },
  Programmer: {
    manageAccounts:    true,
    readMeter:         true,
    writeMeter:        true,
    setTariff:         true,
    upgradeFirmware:   true,

    // device-specific actions
    addDevice:    true,
    editDevice:   true,
    deleteDevice: true,
    copyDevice:   true,
  },
  Reader: {
    manageAccounts:    true,
    readMeter:         true,
    writeMeter:        true,
    setTariff:         true,
    upgradeFirmware:   true,

    // device-specific actions
    addDevice:    true,
    editDevice:   true,
    deleteDevice: true,
    copyDevice:   true,
  },
  Upgrader: {
   manageAccounts:    true,
    readMeter:         true,
    writeMeter:        true,
    setTariff:         true,
    upgradeFirmware:   true,

    // device-specific actions
    addDevice:    true,
    editDevice:   true,
    deleteDevice: true,
    copyDevice:   true,
  },
};
