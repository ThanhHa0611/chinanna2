import { useState } from 'react';
import { LOCATION_REQUIRED_MESSAGE, requestLoginLocation } from '../utils/loginLocation';

export default function LocationPermissionBlock({ value, onChange, error, onError }) {
  const [pending, setPending] = useState(false);

  const handleAllow = async () => {
    onError?.('');
    setPending(true);
    try {
      const location = await requestLoginLocation();
      onChange(location);
    } catch (err) {
      onChange(null);
      onError?.(err.message || LOCATION_REQUIRED_MESSAGE);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="location-consent-block">
      <p className="location-consent-note">{LOCATION_REQUIRED_MESSAGE}</p>
      <button
        type="button"
        className={`btn btn-outline btn-full location-consent-btn${
          value ? ' location-consent-btn-done' : ''
        }`}
        onClick={handleAllow}
        disabled={pending}
      >
        {pending
          ? 'Đang chờ bạn cho phép vị trí trên điện thoại...'
          : value
            ? '✓ Đã cho phép vị trí'
            : 'Cho phép truy cập vị trí'}
      </button>
      {!value && !error && (
        <p className="location-consent-hint">
          Trên điện thoại: bấm nút trên trước, rồi chọn <strong>Allow / Cho phép</strong> khi trình duyệt hỏi.
        </p>
      )}
      {error && <p className="form-error location-consent-error">{error}</p>}
    </div>
  );
}
