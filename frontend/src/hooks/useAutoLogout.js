import { useEffect, useRef, useState } from 'react';

const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export default function useAutoLogout(timeout = 60 * 1000, onLogout) {
  const timerId = useRef(null);
  const warningTimerId = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  const warningTime = 2 * 60 * 1000; // 2min

  const resetTimer = () => {
    setShowWarning(false); // cache la modale
    if (timerId.current) clearTimeout(timerId.current);
    if (warningTimerId.current) clearTimeout(warningTimerId.current);

    // Timer pour afficher la modale
    warningTimerId.current = setTimeout(() => {
      setShowWarning(true); // affiche la modale
    }, timeout - warningTime);

    // Timer de déconnexion
    timerId.current = setTimeout(() => {
      setShowWarning(false);
      onLogout(); // appelle la fonction de déconnexion
    }, timeout);
  };

  useEffect(() => {
    resetTimer();
    const handleActivity = () => resetTimer();

    events.forEach(evt => window.addEventListener(evt, handleActivity));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (timerId.current) clearTimeout(timerId.current);
      if (warningTimerId.current) clearTimeout(warningTimerId.current);
    };
  }, []);

  const stayLoggedIn = () => resetTimer();

  return { showWarning, stayLoggedIn };
}
