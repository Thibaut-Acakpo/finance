import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Search } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/ui/EmptyState';
import { Button, Input, Select } from '../components/ui/Field';
import { formatDate, formatMontant } from '../lib/format';

export default function Transactions() {
  const toast = useToast();
  const [lignes, setLignes] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);

  async function charger() {
    setLoading(true);
    try {
      const res = await api.transactions({ type, recherche: recherche || undefined, page, par_page: 15 });
      setLignes(res.data || []);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      charger();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-paper">
            <History size={20} className="text-mint-400" />
            Historique
          </h1>
          {meta && (
            <p className="mt-1 text-sm text-white/45">
              Solde de la période :{' '}
              <span className={`num font-medium ${meta.solde >= 0 ? 'text-mint-400' : 'text-coral-400'}`}>
                {formatMontant(meta.solde)}
              </span>
            </p>
          )}
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-40">
          <option value="tous">Tout</option>
          <option value="revenu">Revenus</option>
          <option value="depense">Dépenses</option>
        </Select>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <Input
          className="pl-9"
          placeholder="Rechercher…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : lignes.length === 0 ? (
        <EmptyState icon={History} title="Aucune transaction" hint="Vos revenus et dépenses apparaîtront ici." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-left text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <motion.tr
                  key={`${l.type}-${l.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-white/60">{formatDate(l.date_operation)}</td>
                  <td className="px-4 py-3 text-paper">{l.description || '—'}</td>
                  <td className="px-4 py-3 text-white/60">{l.categorie_nom || 'Sans catégorie'}</td>
                  <td
                    className={`px-4 py-3 text-right num font-medium ${
                      l.type === 'revenu' ? 'text-mint-400' : 'text-coral-400'
                    }`}
                  >
                    {l.type === 'revenu' ? '+' : '-'}
                    {formatMontant(l.montant)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          <span className="text-white/50">
            Page {meta.page} / {meta.pages}
          </span>
          <Button variant="ghost" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
