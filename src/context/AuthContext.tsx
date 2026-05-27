import { createContext, useContext, useState, useEffect } from 'react';
import { type User, users } from '../data/users';

interface AuthCtx {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  currentUser: null,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pmo-session');
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        if (users.find(u => u.id === parsed.id)) setCurrentUser(parsed);
      } catch {}
    }
  }, []);

  function login(username: string, password: string): boolean {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('pmo-session', JSON.stringify(user));
      return true;
    }
    return false;
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('pmo-session');
  }

  return <AuthContext.Provider value={{ currentUser, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
