import { useEffect, useRef } from 'react';

export default function DocHintButton({ docId, openId, setOpenId, hint }) {
  const wrapRef = useRef(null);
  const isOpen = openId === docId;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpenId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpenId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setOpenId]);

  if (!hint) return null;

  return (
    <div className="doc-hint-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`doc-hint-btn${isOpen ? ' doc-hint-btn-active' : ''}`}
        aria-label="Xem hướng dẫn"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setOpenId(isOpen ? null : docId);
        }}
      >
        ?
      </button>
      {isOpen && (
        <div className="doc-hint-popover" role="dialog" aria-label="Hướng dẫn giấy tờ">
          {hint.lines?.map((line, index) => (
            <p key={index} className="doc-hint-line">
              {line}
            </p>
          ))}
          {hint.links?.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-hint-link"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
