const STORAGE_KEYS = {
  mentee: 'phongvan_device_mode_mentee',
  mentor: 'phongvan_device_mode_mentor',
  superadmin: 'phongvan_device_mode_superadmin',
};

export function applyDeviceModeClass(mode) {
  const root = document.documentElement;
  root.classList.remove('device-phone', 'device-laptop');
  if (mode === 'phone') {
    root.classList.add('device-phone');
  } else if (mode === 'laptop') {
    root.classList.add('device-laptop');
  }
}

export function createDeviceModeApi(appKey) {
  const storageKey = STORAGE_KEYS[appKey];

  return {
    getDeviceMode() {
      try {
        const value = localStorage.getItem(storageKey);
        return value === 'phone' || value === 'laptop' ? value : null;
      } catch {
        return null;
      }
    },
    setDeviceMode(mode) {
      localStorage.setItem(storageKey, mode);
      applyDeviceModeClass(mode);
    },
    clearDeviceMode() {
      localStorage.removeItem(storageKey);
      applyDeviceModeClass(null);
    },
  };
}

export function isPhoneDeviceMode() {
  return document.documentElement.classList.contains('device-phone');
}
