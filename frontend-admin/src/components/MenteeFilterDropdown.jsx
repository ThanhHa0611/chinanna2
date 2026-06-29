import { useEffect, useRef, useState } from 'react';

export default function MenteeFilterDropdown({
  label,
  value,
  options,
  onChange,
  inactiveValue = 'all',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];
  const isActive = value !== inactiveValue;

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`mentee-filter-dropdown${open ? ' is-open' : ''}${isActive ? ' is-active' : ''}`}
    >
      <button
        type="button"
        className="mentee-filter-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="mentee-filter-dropdown-label">{label}</span>
        {isActive && (
          <span className="mentee-filter-dropdown-value">{selectedOption?.label}</span>
        )}
        <span className="mentee-filter-dropdown-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="mentee-filter-dropdown-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value || 'empty'}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`mentee-filter-dropdown-option${
                value === option.value ? ' active' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
