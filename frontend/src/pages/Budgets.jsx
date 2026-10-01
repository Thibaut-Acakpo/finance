import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import TiltCard from '../components/ui/TiltCard';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Button, Input, Label, Select } from '../components/ui/Field';
import { formatMontant, MOIS_LABELS } from '../lib/format';

const now = new Date();

export default function Budgets() {
  const toast = useToast();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [global, setGlobal] = useState(null);
  const [parCategorie, setParCategorie] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ montant: '', categorie_id: '' });
  const [busy, setBusy] = useState(false);
  const [suppressionId, setSuppressionId] = useState(null);
  const [suppressionBusy, setSuppressionBusy] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      const [g, c, cats] = await Promise.all([
        api.budget({ portee: 'global', mois, annee }),
        api.budget({ portee: 'categorie', mois, annee }),
        api.categories('depense'),
      ]);
      setGlobal(g.data);
      setParCategorie(c.data || []);
      setCategories(cats.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee]);

  async function enregistrerGlobal(e) {
    e.preventDefault();
    const montant = new FormData(e.target).get('montant');
    if (!montant) return;
    try {
      await api.enregistrerBudget('global', { mois, annee, montant });
      toast.success('Budget global mis à jour');
      charger();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function ajouterCategorie(e) {
    e.preventDefault();
    if (!form.montant || !form.categorie_id) return;
    setBusy(true);
    try {
      await api.enregistrerBudget('categorie', {
        mois,
        annee,
        montant: form.montant,
        categorie_id: form.categorie_id,
      });
      toast.success('Budget de catégorie enregistré');
      setModalOpen(false);
      setForm({ montant: '', categorie_id: '' });
      charger();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmerSuppression() {
    if (suppressionId === null) return;
    setSuppressionBusy(true);
    try {
      await api.supprimerBudget('categorie', suppressionId);
      toast.success('Budget supprimé');
      charger();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSuppressionBusy(false);
      setSuppressionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-paper">
            <PiggyBank size={20} className="text-gold-400" />
            Budgets
          </h1>
          <p className="mt-1 text-sm text-white/45">Fixez des plafonds et suivez votre progression.</p>
        </div>
        <div className="flex gap-2">
          <Select value={mois} onChange={(e) => setMois(Number(e.target.value))} className="w-36">
            {MOIS_LABELS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : (
        <TiltCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Budget global du mois</p>
              <p className="mt-1 font-display text-3xl font-semibold text-paper">
                {formatMontant(global?.budget?.montant || 0)}
              </p>
            </div>
            <form onSubmit={enregistrerGlobal} className="flex items-end gap-2">
              <div>
                <Label>Nouveau montant</Label>
                <Input name="montant" type="number" min="0" placeholder="Ex : 150000" className="w-40" />
              </div>
              <Button type="submit">Définir</Button>
            </form>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/55">
                Dépensé : <span className="num text-white/80">{formatMontant(global?.depense || 0)}</span>
              </span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  global?.statut === 'exceeded'
                    ? 'text-coral-400'
                    : global?.statut === 'warning'
                    ? 'text-gold-400'
                    : 'text-mint-400'
                }`}
              >
                {global?.statut === 'exceeded' && <AlertTriangle size={13} />}
                {global?.pourcentage ?? 0}%
              </span>
            </div>
            <ProgressBar percent={global?.pourcentage} statut={global?.statut} />
            <p className="text-xs text-white/40">
              Reste : <span className="num">{formatMontant(global?.reste || 0)}</span>
            </p>
          </div>
        </TiltCard>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium text-white/80">Budgets par catégorie</h2>
        <Button variant="ghost" onClick={() => setModalOpen(true)}>
          <Plus size={15} />
          Ajouter
        </Button>
      </div>

      {!loading && parCategorie.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-white/35">
          Aucun budget par catégorie pour cette période.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {parCategorie.map((b, i) => {
            const pourcentage = b.montant > 0 ? Math.round((b.depense / b.montant) * 100) : 0;
            const statut = pourcentage > 100 ? 'exceeded' : pourcentage >= 80 ? 'warning' : 'normal';
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-white/[0.06] bg-ink-850/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-paper">{b.categorie_nom}</span>
                  <button
                      onClick={() => setSuppressionId(b.id)}
                    className="rounded-lg p-1 text-white/30 hover:bg-coral-500/10 hover:text-coral-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {formatMontant(b.depense)} / {formatMontant(b.montant)}
                </p>
                <div className="mt-2">
                  <ProgressBar percent={pourcentage} statut={statut} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Budget par catégorie">
        <form onSubmit={ajouterCategorie} className="space-y-4">
          <div>
            <Label>Catégorie</Label>
            <Select
              value={form.categorie_id}
              onChange={(e) => setForm((f) => ({ ...f, categorie_id: e.target.value }))}
              required
            >
              <option value="">Choisir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Montant plafond (FCFA)</Label>
            <Input
              type="number"
              min="0"
              value={form.montant}
              onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={busy}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={suppressionId !== null}
        onClose={() => setSuppressionId(null)}
        onConfirm={confirmerSuppression}
        title="Supprimer ce budget ?"
        message="Voulez-vous vraiment supprimer ce budget ? Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={suppressionBusy}
      />
    </div>
  );
}
