import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, ErrorText, Input, Label } from '../components/ui/Field';
import CircuitBackground from '../components/ui/CircuitBackground';

export default function Auth() {
  const { user, connexion, inscription, loading } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('connexion');
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      if (mode === 'connexion') {
        await connexion(form.email, form.mot_de_passe);
        toast.success('Connexion réussie — bienvenue !');
      } else {
        await inscription(form.nom, form.email, form.mot_de_passe);
        toast.success('Compte créé — bienvenue !');
      }
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 p-4">
      <div className="absolute inset-0 opacity-70">
        <CircuitBackground />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900/80 p-7 shadow-card backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-500/15">
            <Gem size={18} className="text-mint-400" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-paper">GestionFinances</p>
            <p className="text-[11px] text-white/40">Vos flux, sous contrôle.</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-white/[0.04] p-1 text-sm">
          {['connexion', 'inscription'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative rounded-md py-2 font-medium transition-colors ${
                mode === m ? 'text-ink-950' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {mode === m && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-md bg-mint-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 capitalize">{m === 'connexion' ? 'Connexion' : 'Créer un compte'}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {mode === 'inscription' && (
              <motion.div
                key="nom"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label>Nom complet</Label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <Input
                    className="pl-9"
                    value={form.nom}
                    onChange={update('nom')}
                    error={errors.nom}
                    placeholder="Thibaut Acakpo"
                    required
                  />
                </div>
                <ErrorText>{errors.nom}</ErrorText>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <Label>Adresse email</Label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                className="pl-9"
                type="email"
                value={form.email}
                onChange={update('email')}
                error={errors.email}
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <ErrorText>{errors.email}</ErrorText>
          </div>

          <div>
            <Label>Mot de passe</Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                className="pl-9"
                type="password"
                value={form.mot_de_passe}
                onChange={update('mot_de_passe')}
                error={errors.mot_de_passe}
                placeholder="••••••••"
                minLength={mode === 'inscription' ? 8 : undefined}
                required
              />
            </div>
            <ErrorText>{errors.mot_de_passe}</ErrorText>
          </div>

          <Button type="submit" className="w-full" loading={busy}>
            {mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            {!busy && <ArrowRight size={16} />}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
