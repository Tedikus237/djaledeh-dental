# DJALEDEH Dental Care

Application de gestion du cabinet dentaire DJALEDEH à Garoua.

## Lancer l'application en local

1. Installer une version récente de Node.js.
2. À la racine du projet, ouvrir un terminal et lancer :

   ```bash
   npm install
   npm run dev
   ```

3. Ouvrir dans le navigateur l'adresse affichée par Vite, généralement `http://localhost:5173`.

## Installer l'application pour la tester

Dans Chrome ou Edge, ouvrez l'application sur `http://localhost:5173`, puis utilisez le menu du navigateur (⋮) et choisissez **Installer DJALEDEH Dental Care**. Selon la version, l'option peut se trouver dans **Enregistrer et partager**. Le navigateur n'affiche pas nécessairement de fenêtre d'installation automatiquement. En ligne, l'installation nécessite une adresse HTTPS.

## Tester les écrans

En mode local, l'application crée des données de démonstration dans le navigateur. Les comptes de test sont :

| Profil | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `drdeffo` | `Deffo2026` |
| Secrétariat | `secretaire` | `Secret2026` |
| Docteur | `drpaul` | `Paul2026` |

Parcours conseillé :

1. Ouvrir **Patients**, puis **Nouveau patient** ; enregistrer un patient de test.
2. Ouvrir sa fiche et consulter son dossier médical.
3. Créer un rendez-vous depuis **Rendez-vous**.
4. Consulter **Factures** et les tableaux de bord.
5. Se déconnecter et essayer les profils secrétaire et docteur pour comparer leurs accès.

Les données locales sont propres à chaque navigateur. Ne saisissez pas de véritables données de patients dans cette version de démonstration. La connexion à Firebase n'est pas encore le stockage utilisé par les écrans métier.

## Vérifications du code

```bash
npm run lint
npm run build
```

Le projet ne dispose pas encore de suite de tests automatisés. La compilation TypeScript doit être corrigée si `npm run build` signale des erreurs avant de préparer un déploiement.
