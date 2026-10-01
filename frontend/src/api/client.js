import axios from 'axios';

// L'URL de l'API PHP se configure via un fichier .env (voir .env.example).
// Par défaut on suppose que le backend est servi sous /api sur le même domaine.
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const http = axios.create({
  baseURL,
  withCredentials: true, // nécessaire : l'auth backend repose sur les sessions PHP
  headers: { 'Content-Type': 'application/json' },
});

// Chaque endpoint PHP répond { success, message, data, meta?, errors? }.
// On normalise ici pour que les pages n'aient jamais à lire error.response.data à la main.
class ApiError extends Error {
  constructor(message, errors, status) {
    super(message);
    this.errors = errors || {};
    this.status = status;
  }
}

async function request(method, url, { data, params } = {}) {
  try {
    const res = await http.request({ method, url, data, params });
    return res.data; // { success, message, data, meta }
  } catch (err) {
    if (err.response) {
      const body = err.response.data || {};
      throw new ApiError(
        body.message || 'Une erreur est survenue',
        body.errors,
        err.response.status
      );
    }
    throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion.', {}, 0);
  }
}

export const api = {
  // Auth
  inscription: (payload) => request('post', '/auth.php?action=inscription', { data: payload }),
  connexion: (payload) => request('post', '/auth.php?action=connexion', { data: payload }),
  deconnexion: () => request('post', '/auth.php?action=deconnexion'),
  session: () => request('get', '/auth.php?action=session'),

  // Catégories
  categories: (type) => request('get', '/categories.php', { params: { type } }),
  creerCategorie: (type, nom) => request('post', '/categories.php', { params: { type }, data: { nom } }),
  modifierCategorie: (type, id, nom) =>
    request('put', '/categories.php', { params: { type }, data: { id, nom } }),
  supprimerCategorie: (type, id) =>
    request('delete', '/categories.php', { params: { type, id } }),

  // Revenus / Dépenses (contrôleur générique côté backend)
  liste: (type, params) => request('get', `/${type}.php`, { params }),
  creerOperation: (type, payload) => request('post', `/${type}.php`, { data: payload }),
  modifierOperation: (type, payload) => request('put', `/${type}.php`, { data: payload }),
  supprimerOperation: (type, id) => request('delete', `/${type}.php`, { params: { id } }),

  // Budgets
  budget: (params) => request('get', '/budgets.php', { params }),
  enregistrerBudget: (portee, payload) =>
    request('post', '/budgets.php', { params: { portee }, data: payload }),
  supprimerBudget: (portee, id) => request('delete', '/budgets.php', { params: { portee, id } }),

  // Transactions & statistiques
  transactions: (params) => request('get', '/transactions.php', { params }),
  statistiques: (params) => request('get', '/statistiques.php', { params }),

  // Profil
  profil: () => request('get', '/profil.php'),
  modifierProfil: (payload) => request('put', '/profil.php', { data: payload }),
  changerMotDePasse: (payload) =>
    request('put', '/profil.php?action=mot_de_passe', { data: payload }),
};

export { ApiError };
