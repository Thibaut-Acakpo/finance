# GestionFinances

Application de gestion financière personnelle (revenus, dépenses, catégories, budgets,
statistiques) en FCFA — backend PHP/MySQL + interface React.

```
gestionfinances/
├── backend/          API PHP (sessions, MySQL/PDO)
│   ├── api/          Points d'entrée (.php) appelés par le frontend
│   ├── database/     schema.sql à importer
│   └── .env.example
└── frontend/         Interface React (Vite + Tailwind + Framer Motion)
```

## 1. Base de données

Importez le schéma dans MySQL (ligne de commande ou phpMyAdmin) :

```powershell
mysql -u root -p < backend/database/schema.sql
```

### Sauvegarder les donnees

Pour creer un dump horodate de la base et de ses donnees :

```powershell
.\backend\scripts\backup-database.ps1
```

Les fichiers sont conserves dans `backend/backups/` sous la forme
`finance-AAAA-MM-JJTHH-mm-ss.sql`.

- Une sauvegarde est creee toutes les 24 heures.
- Les fichiers sont conserves pendant 3 mois.
- Les sauvegardes de plus de 3 mois sont supprimees automatiquement lors de la
  prochaine sauvegarde.

Pour installer une sauvegarde automatique tous les 24 heures a partir de 02:00 :

```powershell
.\backend\scripts\install-backup-task.ps1
```

Pour choisir une autre heure de depart, par exemple 23:30 :

```powershell
.\backend\scripts\install-backup-task.ps1 -Time 23:30
```

Pour restaurer une sauvegarde :

```powershell
mysql -u root -p < backend/backups/finance-AAAA-MM-JJTHH-mm-ss.sql
```

Les sauvegardes peuvent contenir des donnees sensibles et sont ignorees par Git.

## 2. Backend (PHP)

1. Copiez `backend/.env.example` en `backend/.env` et ajustez si besoin (utilisateur
   MySQL, mot de passe, origine du frontend). Le fichier `.env` est chargé
   automatiquement par `config.php`, aucune configuration système n'est nécessaire.
2. Démarrez le serveur PHP intégré depuis la racine du projet :

```powershell
php -S localhost:8000 -t backend/api
```

L'API est alors disponible sur `http://localhost:8000` (ex. `http://localhost:8000/auth.php`).

> En production, pointez simplement le vhost Apache/Nginx vers `backend/api` en tant
> que racine web, en gardant `config/` et `includes/` non accessibles publiquement si
> possible (ou laissez tel quel, aucun de ces fichiers n'exécute de logique au chargement
> direct côté navigateur puisqu'ils ne font que définir des fonctions).

## 3. Frontend (React)

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

En développement local, avec le backend lancé séparément sur `http://localhost:8000`,
`frontend/.env` doit contenir :

```
VITE_API_URL=http://localhost:8000
```

Ouvrez ensuite `http://localhost:5173`.

### Important — cookies de session en cross-origin

Le frontend (port 5173) et le backend (port 8000) sont deux origines différentes.
Le backend gère déjà les en-têtes CORS et l'attribut `SameSite` du cookie de session
selon que la connexion est en HTTPS ou non (voir `backend/api/config/config.php`,
variable `ALLOWED_ORIGINS`). En HTTP local, `SameSite=Lax` est utilisé : cela fonctionne
pour la plupart des navigateurs en développement. Pour une mise en production propre,
le plus simple reste de servir le frontend et l'API sous le **même domaine** (ex. le
frontend sur `/` et l'API sur `/api`, via un reverse proxy Nginx/Apache), ce qui évite
tout souci de cookies cross-site et vous permet de garder `VITE_API_URL=/api`.

## 4. Build de production du frontend

```powershell
cd frontend
npm run build
```

Le résultat est généré dans `frontend/dist/` — à déposer sur votre hébergement web
(à côté ou derrière le même reverse proxy que `backend/api`).

## Fonctionnalités

- Inscription / connexion par session PHP (mots de passe hachés avec `password_hash`)
- Revenus et dépenses : création, modification, suppression, recherche, pagination
- Catégories personnalisables par type (revenu / dépense)
- Budgets globaux et par catégorie, avec suivi de progression
- Historique combiné des transactions avec filtres
- Tableau de bord : soldes, taux d'épargne, répartition des dépenses, évolution annuelle
- Profil : modification des informations et du mot de passe

## Personnalisation visuelle

L'interface reprend une identité "coffre-fort financier" : séquence de démarrage façon
terminal, fond animé en circuit qui fait circuler des impulsions lumineuses, curseur
personnalisé, cartes avec effet d'inclinaison 3D au survol, transitions de page fluides.
Les couleurs, polices et animations se configurent dans `frontend/tailwind.config.js`
et les composants de `frontend/src/components/ui/`.
