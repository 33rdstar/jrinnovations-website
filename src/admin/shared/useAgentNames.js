import { useCallback, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Config/firebaseConfig';

// Module-level: shared across every hook instance/component for the page
// session, so AdminTransactions and TransactionDetail stop resolving the
// same owner id twice.
const nameCache = new Map();

export function useAgentNames() {
  const [names, setNames] = useState({});
  const inFlight = useRef(new Set());

  const resolveOne = useCallback(async (ownerId) => {
    if (!ownerId) return '—';
    if (nameCache.has(ownerId)) return nameCache.get(ownerId);
    try {
      const snap = await getDoc(doc(db, 'users', ownerId));
      const d = snap.exists() ? snap.data() : null;
      const name = d ? ([d.firstName, d.lastName].filter(Boolean).join(' ') || d.username || ownerId) : ownerId;
      nameCache.set(ownerId, name);
      setNames(prev => ({ ...prev, [ownerId]: name }));
      return name;
    } catch {
      return ownerId;
    }
  }, []);

  const resolveMany = useCallback(async (ownerIds) => {
    const unresolved = [...new Set(ownerIds)].filter(id => id && !nameCache.has(id) && !inFlight.current.has(id));
    if (unresolved.length === 0) return;
    unresolved.forEach(id => inFlight.current.add(id));
    await Promise.all(unresolved.map(id => resolveOne(id)));
    unresolved.forEach(id => inFlight.current.delete(id));
  }, [resolveOne]);

  return { names, resolveOne, resolveMany };
}
