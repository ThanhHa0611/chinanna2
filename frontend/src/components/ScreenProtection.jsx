import { useEffect, useState } from 'react';

export default function ScreenProtection({ user }) {
  const [hidden, setHidden] = useState(false);

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
      if ((event.ctrlKey || event.metaKey) && ['p', 's', 'u', 'c'].includes(key)) {
        event.preventDefault();
      }
    };

    const blockCopy = (event) => event.preventDefault();

    document.body.classList.add('screen-protected');
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('copy', blockCopy);
    document.addEventListener('cut', blockCopy);

    return () => {
      document.body.classList.remove('screen-protected');
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('cut', blockCopy);
    };
  }, []);

  const watermarkText = `${user.username} • ${user.email}`;

  return (
    <>
      <div className="watermark-pattern watermark-pattern-dark" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, index) => (
          <span key={`dark-${index}`}>{watermarkText}</span>
        ))}
      </div>
      <div className="watermark-pattern watermark-pattern-light" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, index) => (
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
