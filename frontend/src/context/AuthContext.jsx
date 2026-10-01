import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.session();
      setUser(res.data || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connexion = async (email, mot_de_passe) => {
    const res = await api.connexion({ email, mot_de_passe });
    setUser(res.data);
    return res;
  };

  const inscription = async (nom, email, mot_de_passe) => {
    const res = await api.inscription({ nom, email, mot_de_passe });
    setUser(res.data);
    return res;
  };

  const deconnexion = async () => {
    try {
      await api.deconnexion();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, connexion, inscription, deconnexion, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
