import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Tags,
  PiggyBank,
  History,
  UserRound,
  LogOut,
  Gem,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../ui/ConfirmDialog';

const LINKS = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/revenus', label: 'Revenus', icon: TrendingUp },
  { to: '/depenses', label: 'Dépenses', icon: TrendingDown },
  { to: '/categories', label: 'Catégories', icon: Tags },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/transactions', label: 'Historique', icon: History },
  { to: '/profil', label: 'Profil', icon: UserRound },
];

export default function Sidebar({ onNavigate }) {
  const { user, deconnexion } = useAuth();
  const toast = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  async function confirmerLogout() {
    setLogoutBusy(true);
    try {
      await deconnexion();
      toast.success('Déconnexion réussie');
    } catch (err) {
      toast.error(err.message || 'La déconnexion a échoué');
    } finally {
      setLogoutBusy(false);
      setLogoutOpen(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-r border-white/[0.06] bg-ink-900/95">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/15">
          <Gem size={16} className="text-mint-400" />
        </div>
        <span className="font-display text-[15px] font-semibold tracking-tight text-paper">
          GestionFinances
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive ? 'text-ink-950' : 'text-white/55 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-mint-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={17} className="relative z-10" />
                <span className="relative z-10 font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] px-3 py-4">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-display text-xs text-white/70">
            {(user?.nom || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white/85">{user?.nom}</p>
            <p className="truncate text-[11px] text-white/40">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => setLogoutOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50 transition-colors hover:bg-coral-500/10 hover:text-coral-400"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmerLogout}
        title="Confirmer la déconnexion"
        message="Voulez-vous vraiment vous déconnecter ? Vous devrez vous reconnecter pour accéder à vos données."
        confirmLabel="Se déconnecter"
        loading={logoutBusy}
      />
    </div>
  );
}
