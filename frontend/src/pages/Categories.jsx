import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Tags, Check, X } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Button, Input } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function Categories() {
  const toast = useToast();
  const [type, setType] = useState('depense');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nouveau, setNouveau] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNom, setEditNom] = useState('');
  const [busy, setBusy] = useState(false);
  const [suppressionId, setSuppressionId] = useState(null);
  const [suppressionBusy, setSuppressionBusy] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      const res = await api.categories(type);
      setItems(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function ajouter(e) {
    e.preventDefault();
    if (!nouveau.trim()) return;
    setBusy(true);
    try {
      await api.creerCategorie(type, nouveau.trim());
      setNouveau('');
      toast.success('Catégorie créée');
      charger();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function renommer(id) {
    if (!editNom.trim()) return;
    try {
      await api.modifierCategorie(type, id, editNom.trim());
      setEditId(null);
      toast.success('Catégorie modifiée');
      charger();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function confirmerSuppression() {
    if (suppressionId === null) return;
    setSuppressionBusy(true);
    try {
      await api.supprimerCategorie(type, suppressionId);
      toast.success('Catégorie supprimée');
      charger();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSuppressionBusy(false);
      setSuppressionId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-paper">
          <Tags size={20} className="text-mint-400" />
          Catégories
        </h1>
        <p className="mt-1 text-sm text-white/45">Organisez vos revenus et dépenses par catégorie.</p>
      </div>

      <div className="inline-flex rounded-lg bg-white/[0.04] p-1 text-sm">
        {[
          { v: 'depense', label: 'Dépenses' },
          { v: 'revenu', label: 'Revenus' },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setType(t.v)}
            className={`relative rounded-md px-4 py-1.5 font-medium transition-colors ${
              type === t.v ? 'text-ink-950' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {type === t.v && (
              <motion.div
                layoutId="cat-tab"
                className="absolute inset-0 rounded-md bg-mint-500"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={ajouter} className="flex max-w-sm gap-2">
        <Input
          placeholder="Nouvelle catégorie…"
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          maxLength={120}
        />
        <Button type="submit" loading={busy}>
          <Plus size={16} />
        </Button>
      </form>

      {loading ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Tags} title="Aucune catégorie" hint="Créez votre première catégorie ci-dessus." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-ink-850/60 px-4 py-3"
            >
              {editId === c.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    autoFocus
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && renommer(c.id)}
                  />
                  <button
                    onClick={() => renommer(c.id)}
                    className="rounded-lg p-1.5 text-mint-400 hover:bg-mint-500/10"
                    aria-label="Valider"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/5"
                    aria-label="Annuler"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-paper">{c.nom}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditId(c.id);
                        setEditNom(c.nom);
                      }}
                      className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
                      aria-label="Renommer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setSuppressionId(c.id)}
                      className="rounded-lg p-1.5 text-white/40 hover:bg-coral-500/10 hover:text-coral-400"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={suppressionId !== null}
        onClose={() => setSuppressionId(null)}
        onConfirm={confirmerSuppression}
        title="Supprimer cette catégorie ?"
        message="Voulez-vous vraiment supprimer cette catégorie ? Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={suppressionBusy}
      />
    </div>
  );
}
