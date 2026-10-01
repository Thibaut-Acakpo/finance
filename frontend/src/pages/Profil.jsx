import { useState } from 'react';
import { UserRound, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import TiltCard from '../components/ui/TiltCard';
import { Button, ErrorText, Input, Label } from '../components/ui/Field';

export default function Profil() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ nom: user?.nom || '', email: user?.email || '' });
  const [errorsInfo, setErrorsInfo] = useState({});
  const [busyInfo, setBusyInfo] = useState(false);

  const [pwd, setPwd] = useState({ mot_de_passe_actuel: '', nouveau_mot_de_passe: '' });
  const [errorsPwd, setErrorsPwd] = useState({});
  const [busyPwd, setBusyPwd] = useState(false);

  async function enregistrerInfo(e) {
    e.preventDefault();
    setErrorsInfo({});
    setBusyInfo(true);
    try {
      const res = await api.modifierProfil(form);
      setUser((u) => ({ ...u, ...res.data }));
      toast.success('Profil mis à jour');
    } catch (err) {
      setErrorsInfo(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusyInfo(false);
    }
  }

  async function changerMotDePasse(e) {
    e.preventDefault();
    setErrorsPwd({});
    setBusyPwd(true);
    try {
      await api.changerMotDePasse(pwd);
      setPwd({ mot_de_passe_actuel: '', nouveau_mot_de_passe: '' });
      toast.success('Mot de passe modifié');
    } catch (err) {
      setErrorsPwd(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusyPwd(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-paper">
          <UserRound size={20} className="text-mint-400" />
          Profil
        </h1>
        <p className="mt-1 text-sm text-white/45">Gérez vos informations et votre sécurité.</p>
      </div>

      <TiltCard glow={false} className="p-6">
        <h2 className="font-display text-sm font-medium text-white/80">Informations</h2>
        <form onSubmit={enregistrerInfo} className="mt-4 space-y-4">
          <div>
            <Label>Nom complet</Label>
            <Input
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              error={errorsInfo.nom}
            />
            <ErrorText>{errorsInfo.nom}</ErrorText>
          </div>
          <div>
            <Label>Adresse email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errorsInfo.email}
            />
            <ErrorText>{errorsInfo.email}</ErrorText>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={busyInfo}>
              Enregistrer
            </Button>
          </div>
        </form>
      </TiltCard>

      <TiltCard glow={false} className="p-6">
        <h2 className="flex items-center gap-2 font-display text-sm font-medium text-white/80">
          <KeyRound size={15} className="text-gold-400" />
          Mot de passe
        </h2>
        <form onSubmit={changerMotDePasse} className="mt-4 space-y-4">
          <div>
            <Label>Mot de passe actuel</Label>
            <Input
              type="password"
              value={pwd.mot_de_passe_actuel}
              onChange={(e) => setPwd((p) => ({ ...p, mot_de_passe_actuel: e.target.value }))}
              error={errorsPwd.mot_de_passe_actuel}
              required
            />
            <ErrorText>{errorsPwd.mot_de_passe_actuel}</ErrorText>
          </div>
          <div>
            <Label>Nouveau mot de passe</Label>
            <Input
              type="password"
              minLength={8}
              value={pwd.nouveau_mot_de_passe}
              onChange={(e) => setPwd((p) => ({ ...p, nouveau_mot_de_passe: e.target.value }))}
              error={errorsPwd.nouveau_mot_de_passe}
              required
            />
            <ErrorText>{errorsPwd.nouveau_mot_de_passe}</ErrorText>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={busyPwd}>
              Modifier
            </Button>
          </div>
        </form>
      </TiltCard>
    </div>
  );
}
