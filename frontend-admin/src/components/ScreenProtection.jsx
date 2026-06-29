import { useEffect, useState } from 'react';

export function buildWatermarkLabel(account) {
  if (!account) return '';
  const name = account.mentor_name || account.full_name || account.username || 'Mentor';
  const parts = [name, account.email];
  if (account.is_super_admin) {
    parts.push('Super Admin');
  }
  return parts.filter(Boolean).join(' • ');
}

export default function ScreenProtection({ account }) {
  const [hidden, setHidden] = useState(false);
  const watermarkText = buildWatermarkLabel(account);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const blockContextMenu = (event) => event.preventDefault();

    const blockShortcuts = (event) => {
      const key = event.key.toLowerCase();
      if (key === 'printscreen') {
        event.preventDefault();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
      }
      if ((event.ctrlKey || event.metaKey) && ['p', 's', 'u'].includes(key)) {
        event.preventDefault();
      }
    };

    document.body.classList.add('screen-protected', 'screen-protected-mentor');
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockShortcuts);

    return () => {
      document.body.classList.remove('screen-protected', 'screen-protected-mentor');
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockShortcuts);
    };
  }, []);

  if (!watermarkText) return null;

  return (
    <>
      <div className="watermark-pattern watermark-pattern-dark" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={`dark-${index}`}>{watermarkText}</span>
        ))}
      </div>
      <div className="watermark-pattern watermark-pattern-light" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={`light-${index}`}>{watermarkText}</span>
        ))}
      </div>
      <div className="watermark-footer">{watermarkText}</div>
      {hidden && (
        <div className="screen-blur-overlay">
          <p>Nội dung đã bị ẩn — quay lại tab để tiếp tục</p>
        </div>
      )}
    </>
  );
}
