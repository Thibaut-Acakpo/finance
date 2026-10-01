import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import TiltCard from '../components/ui/TiltCard';
import CountUp from '../components/ui/CountUp';
import { formatMontant, MOIS_LABELS } from '../lib/format';

const PIE_COLORS = ['#3fe0a5', '#e6bd5c', '#f2564a', '#5b8def', '#a78bfa', '#f472b6', '#38bdf8'];

const now = new Date();

export default function Dashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode] = useState({ mois: now.getMonth() + 1, annee: now.getFullYear() });

  useEffect(() => {
    let alive = true;
    api
      .statistiques(periode)
      .then((res) => alive && setStats(res.data))
      .catch((err) => toast.error(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const evolutionData = useMemo(
    () =>
      stats?.evolution_annuelle?.map((m) => ({
        mois: MOIS_LABELS[m.mois - 1].slice(0, 3),
        Revenus: m.revenus,
        Dépenses: m.depenses,
      })) || [],
    [stats]
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Solde du mois',
      value: stats?.solde ?? 0,
      icon: Wallet,
      tone: (stats?.solde ?? 0) >= 0 ? 'mint' : 'coral',
    },
    { label: 'Revenus', value: stats?.total_revenus ?? 0, icon: TrendingUp, tone: 'mint' },
    { label: 'Dépenses', value: stats?.total_depenses ?? 0, icon: TrendingDown, tone: 'coral' },
    {
      label: "Taux d'épargne",
      value: stats?.taux_epargne ?? 0,
      icon: PiggyBank,
      tone: 'gold',
      suffix: '%',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">
          {MOIS_LABELS[periode.mois - 1]} {periode.annee}
        </h1>
        <p className="mt-1 text-sm text-white/45">Vue d'ensemble de vos finances ce mois-ci.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-white/40">
                  {c.label}
                </span>
                <c.icon
                  size={16}
                  className={
                    c.tone === 'mint' ? 'text-mint-400' : c.tone === 'coral' ? 'text-coral-400' : 'text-gold-400'
                  }
                />
              </div>
              <p className="mt-3 font-display text-2xl font-semibold text-paper">
                <CountUp
                  value={c.value}
                  formatter={(n) =>
                    c.suffix ? `${n.toFixed(1)}${c.suffix}` : `${Math.round(n).toLocaleString('fr-FR')}`
                  }
                />
                {!c.suffix && <span className="ml-1 text-sm font-normal text-white/40">FCFA</span>}
              </p>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <TiltCard glow={false} className="p-5 lg:col-span-3">
          <h2 className="font-display text-sm font-medium text-white/80">Évolution annuelle</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3fe0a5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3fe0a5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f2564a" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f2564a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="mois" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: '#0e1420',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v) => formatMontant(v)}
                />
                <Area type="monotone" dataKey="Revenus" stroke="#3fe0a5" fill="url(#gRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="Dépenses" stroke="#f2564a" fill="url(#gDep)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        <TiltCard glow={false} className="p-5 lg:col-span-2">
          <h2 className="font-display text-sm font-medium text-white/80">Répartition des dépenses</h2>
          {stats?.repartition_depenses?.length ? (
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.repartition_depenses}
                    dataKey="montant"
                    nameKey="categorie_nom"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {stats.repartition_depenses.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0e1420',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    formatter={(v) => formatMontant(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-white/35">
              Aucune dépense enregistrée ce mois-ci.
            </p>
          )}
          <div className="mt-2 space-y-1.5">
            {stats?.repartition_depenses?.slice(0, 5).map((r, i) => (
              <div key={r.categorie_nom} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/55">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {r.categorie_nom}
                </span>
                <span className="num text-white/70">{r.pourcentage}%</span>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
