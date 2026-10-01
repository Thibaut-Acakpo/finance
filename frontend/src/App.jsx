import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import CustomCursor from './components/ui/CustomCursor';
import BootSequence from './components/ui/BootSequence';
import AppLayout from './components/layout/AppLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Operations from './pages/Operations';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Transactions from './pages/Transactions';
import Profil from './pages/Profil';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-ink-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500/30 border-t-mint-500" />
    </div>
  );
}

export default function App() {
  const [booted, setBooted] = useState(() => sessionStorage.getItem('gf-booted') === '1');

  if (!booted) {
    return (
      <BootSequence
        onDone={() => {
          sessionStorage.setItem('gf-booted', '1');
          setBooted(true);
        }}
      />
    );
  }

  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/connexion" element={<Auth />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/revenus" element={<Operations type="revenu" />} />
          <Route path="/depenses" element={<Operations type="depense" />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/profil" element={<Profil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
