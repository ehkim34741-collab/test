import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Dashboard from './pages/Dashboard';
import Risks from './pages/Risks';
import Issues from './pages/Issues';
import ActionItems from './pages/ActionItems';
import Requirements from './pages/Requirements';
import Designs from './pages/Designs';
import AgentTeam from './pages/AgentTeam';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <LoginPage />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthGate><Layout /></AuthGate>}>
            <Route index element={<Dashboard />} />
            <Route path="issues" element={<Issues />} />
            <Route path="risks" element={<Risks />} />
            <Route path="action-items" element={<ActionItems />} />
            <Route path="requirements" element={<Requirements />} />
            <Route path="designs" element={<Designs />} />
            <Route path="agent-team" element={<AgentTeam />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
