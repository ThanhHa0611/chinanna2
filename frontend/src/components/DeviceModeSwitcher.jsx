import { useDeviceMode } from '../context/DeviceModeContext';

export default function DeviceModeSwitcher() {
  const deviceMode = useDeviceMode();
  if (!deviceMode) return null;

  const { mode, resetMode } = deviceMode;

  return (
    <div className="device-mode-settings">
      <h3>Giao diện thiết bị</h3>
      <p className="muted device-mode-current">
        Đang dùng: <strong>{mode === 'phone' ? 'Điện thoại' : 'Laptop'}</strong>
      </p>
      <button type="button" className="btn btn-outline btn-sm" onClick={resetMode}>
        Đổi thiết bị
      </button>
    </div>
  );
}
