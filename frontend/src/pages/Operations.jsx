import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Button, ErrorText, Input, Label, Select } from '../components/ui/Field';
import { formatDate, formatMontant, MOYENS_PAIEMENT } from '../lib/format';

const VIDE = { id: null, montant: '', date_operation: '', description: '', moyen_paiement: 'especes', categorie_id: '' };

export default function Operations({ type }) {
  const isRevenu = type === 'revenu';
  const toast = useToast();
  const [lignes, setLignes] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [suppressionId, setSuppressionId] = useState(null);
  const [suppressionBusy, setSuppressionBusy] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      const [res, cats] = await Promise.all([
        api.liste(isRevenu ? 'revenus' : 'depenses', { page, par_page: 12, recherche: recherche || undefined }),
        api.categories(type),
      ]);
      setLignes(res.data || []);
      setMeta(res.meta);
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
  }, [type, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      charger();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  function ouvrirCreation() {
    setForm({ ...VIDE, date_operation: new Date().toISOString().slice(0, 10) });
    setErrors({});
    setModalOpen(true);
  }

  function ouvrirEdition(l) {
    setForm({
      id: l.id,
      montant: l.montant,
      date_operation: l.date_operation,
      description: l.description,
      moyen_paiement: l.moyen_paiement,
      categorie_id: l.categorie_id || '',
    });
    setErrors({});
    setModalOpen(true);
  }

  async function soumettre(e) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    const payload = { ...form, categorie_id: form.categorie_id || null };
    try {
      if (form.id) {
        await api.modifierOperation(isRevenu ? 'revenus' : 'depenses', payload);
        toast.success('Opération modifiée');
      } else {
        await api.creerOperation(isRevenu ? 'revenus' : 'depenses', payload);
        toast.success('Opération enregistrée');
      }
      setModalOpen(false);
      charger();
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmerSuppression() {
    if (suppressionId === null) return;
    setSuppressionBusy(true);
    try {
      await api.supprimerOperation(isRevenu ? 'revenus' : 'depenses', suppressionId);
      toast.success('Opération supprimée');
      charger();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSuppressionBusy(false);
      setSuppressionId(null);
    }
  }

  const accent = isRevenu ? 'mint' : 'coral';
  const Icon = isRevenu ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-paper">
            <Icon size={20} className={isRevenu ? 'text-mint-400' : 'text-coral-400'} />
            {isRevenu ? 'Revenus' : 'Dépenses'}
          </h1>
          {meta && (
            <p className="mt-1 text-sm text-white/45">
              {meta.total} opération{meta.total > 1 ? 's' : ''} · total{' '}
              <span className="num text-white/70">{formatMontant(meta.somme)}</span>
            </p>
          )}
        </div>
        <Button onClick={ouvrirCreation}>
          <Plus size={16} />
          Ajouter
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <Input
          className="pl-9"
          placeholder="Rechercher une description…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : lignes.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`Aucun${isRevenu ? '' : 'e'} ${isRevenu ? 'revenu' : 'dépense'} pour l'instant`}
          hint="Ajoutez votre première opération pour commencer à suivre vos finances."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-left text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Moyen</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <motion.tr
                  key={l.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-white/60">{formatDate(l.date_operation)}</td>
                  <td className="px-4 py-3 text-paper">{l.description || '—'}</td>
                  <td className="px-4 py-3 text-white/60">{l.categorie_nom || 'Sans catégorie'}</td>
                  <td className="px-4 py-3 text-white/60">
                    {MOYENS_PAIEMENT.find((m) => m.value === l.moyen_paiement)?.label}
                  </td>
                  <td className={`px-4 py-3 text-right num font-medium ${isRevenu ? 'text-mint-400' : 'text-coral-400'}`}>
                    {isRevenu ? '+' : '-'}
                    {formatMontant(l.montant)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => ouvrirEdition(l)}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
                        aria-label="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setSuppressionId(l.id)}
                        className="rounded-lg p-1.5 text-white/40 hover:bg-coral-500/10 hover:text-coral-400"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Modifier l\u2019opération' : `Nouveau${isRevenu ? '' : 'lle'} ${isRevenu ? 'revenu' : 'dépense'}`}
      >
        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <Label>Montant (FCFA)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.montant}
              onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              error={errors.montant}
              required
            />
            <ErrorText>{errors.montant}</ErrorText>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date_operation}
                onChange={(e) => setForm((f) => ({ ...f, date_operation: e.target.value }))}
                error={errors.date_operation}
                required
              />
              <ErrorText>{errors.date_operation}</ErrorText>
            </div>
            <div>
              <Label>Moyen de paiement</Label>
              <Select
                value={form.moyen_paiement}
                onChange={(e) => setForm((f) => ({ ...f, moyen_paiement: e.target.value }))}
              >
                {MOYENS_PAIEMENT.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Catégorie</Label>
            <Select
              value={form.categorie_id}
              onChange={(e) => setForm((f) => ({ ...f, categorie_id: e.target.value }))}
              error={errors.categorie_id}
            >
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              error={errors.description}
              placeholder="Ex : Paiement loyer, vente boutique…"
            />
            <ErrorText>{errors.description}</ErrorText>
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
        title={`Supprimer cette ${isRevenu ? 'opération' : 'opération'} ?`}
        message={`Voulez-vous vraiment supprimer cette ${isRevenu ? 'opération' : 'opération'} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={suppressionBusy}
      />
    </div>
  );
}
