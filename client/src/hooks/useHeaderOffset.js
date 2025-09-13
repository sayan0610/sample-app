import { useEffect } from 'react';

export function useHeaderOffset() {
  useEffect(() => {
    function apply() {
      const header = document.querySelector('.app-header');
      if (!header) return;
      const h = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-offset', h + 'px');
    }
    apply();
    const ro = new ResizeObserver(apply);
    const header = document.querySelector('.app-header');
    if (header) ro.observe(header);
    window.addEventListener('orientationchange', apply);
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('orientationchange', apply);
      window.removeEventListener('resize', apply);
      ro.disconnect();
    };
  }, []);
}
