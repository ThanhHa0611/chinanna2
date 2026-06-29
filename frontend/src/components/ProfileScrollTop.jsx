import { useEffect, useState } from 'react';

export default function ProfileScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="profile-scroll-top"
      aria-label="Lướt lên trên"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑ Lên trên
    </button>
  );
}
