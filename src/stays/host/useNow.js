import { useEffect, useState } from 'react';

// Returns the current time and re-renders every `ms`, so things that depend on the clock (a hold that
// has run out, a date that has rolled over) update on their own. The data itself is already live.
const useNow = (ms = 30000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [ms]);
  return now;
};

export default useNow;
