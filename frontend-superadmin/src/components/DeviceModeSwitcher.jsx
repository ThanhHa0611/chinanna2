import { useDeviceMode } from '../context/DeviceModeContext';

export default function DeviceModeSwitcher({ compact = false }) {
  const deviceMode = useDeviceMode();
  if (!deviceMode) return null;

  const { mode, resetMode } = deviceMode;

  if (compact) {
    return (
      <button type="button" className="btn btn-outline btn-sm device-mode-compact" onClick={resetMode}>
        Đổi giao diện ({mode === 'phone' ? 'ĐT' : 'Laptop'})
      </button>
    );
  }

  return (
    <div className="device-mode-settings">
      <p className="muted device-mode-current">
        Giao diện: <strong>{mode === 'phone' ? 'Điện thoại' : 'Laptop'}</strong>
      </p>
      <button type="button" className="btn btn-outline btn-sm" onClick={resetMode}>
        Đổi thiết bị
      </button>
    </div>
  );
}
