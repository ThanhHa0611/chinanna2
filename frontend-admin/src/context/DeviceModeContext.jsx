import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import DeviceChoice from '../pages/DeviceChoice';
import { applyDeviceModeClass, createDeviceModeApi } from '../utils/deviceMode';

const DeviceModeContext = createContext(null);

export function DeviceModeProvider({ appKey, title, subtitle, children }) {
  const api = useMemo(() => createDeviceModeApi(appKey), [appKey]);
  const [mode, setModeState] = useState(() => api.getDeviceMode());

  useEffect(() => {
    applyDeviceModeClass(mode);
  }, [mode]);

  const setMode = (nextMode) => {
    api.setDeviceMode(nextMode);
    setModeState(nextMode);
  };

  const resetMode = () => {
    api.clearDeviceMode();
    setModeState(null);
  };

  if (!mode) {
    return <DeviceChoice title={title} subtitle={subtitle} onChoose={setMode} />;
  }

  return (
    <DeviceModeContext.Provider
      value={{
        mode,
        setMode,
        resetMode,
        isPhone: mode === 'phone',
        isLaptop: mode === 'laptop',
      }}
    >
      {children}
    </DeviceModeContext.Provider>
  );
}

export function useDeviceMode() {
  return useContext(DeviceModeContext);
}
