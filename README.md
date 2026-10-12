# Art Fadist

Reconstruction du site de Rémi Aldeguer, en conservant le logo, la couleur verte, les œuvres et le contenu anglais du site actuel.

## Lancer et modifier

Node.js 20 ou plus récent, sans dépendance externe.

```sh
npm run build
npm run check
npm run dev
```

Ouvrir `http://127.0.0.1:4173/`. Le dossier `dist/` peut être hébergé comme un site statique.

- `src/home.html` : modèle de l’accueil, en-tête et pied de page partagés.
- `src/styles.css` : identité et mise en page responsive.
- `src/site.js` : menu mobile et préparation des e-mails.
- `data/catalogue.json` : catalogue vérifié, prix, disponibilité et liens d’achat.
- `scripts/build.mjs` : génération des pages du catalogue, des fiches et des pages éditoriales.
- `dist/assets/` : images optimisées appartenant à l’artiste.

## Contenus repris

Catalogue importé le **7 octobre 2026** depuis l’API publique du site : 24 œuvres, dont 4 tirages à 60 €. Les prix et stocks sont un instantané. Les liens « View in the shop » ouvrent la fiche WooCommerce actuelle pour vérifier le stock et acheter. Aucun compte client, commande ou donnée privée n’a été importé.

Les textes de remplissage des anciennes fiches ont été retirés ; la description incohérente de Beating dots a été omise. Les dimensions de neuf toiles proviennent des fichiers de l’artiste ou d’une description publique vérifiée. Les tirages indiquent uniquement la dimension du cadre vérifiée (30 × 40 cm).

Les formulaires ouvrent un brouillon dans l’application e-mail du visiteur : ils n’envoient ni ne stockent de messages sur un serveur. Le libellé et les instructions rendent ce comportement explicite.

## Mise en ligne et passage sur art-fadist.com

La version de consultation est hébergée via Sites avec un accès privé. Le manifeste `.openai/hosting.json` identifie cette version. Le domaine `art-fadist.com` et le WordPress existant ne sont pas remplacés par ce dépôt.

Avant de basculer le domaine, il faut choisir et connecter la solution de paiement/formulaires, conserver la boutique WooCommerce sur une adresse dédiée ou migrer son catalogue et ses commandes, puis mettre à jour les liens d’achat. Les comptes et le panier actuels restent disponibles sur WordPress. Une migration du domaine sans ce raccordement casserait ces fonctions.

Les anciens chemins produits et catégories sont conservés. Les anciens chemins About, Blog et Custom Portrait redirigent vers leurs équivalents. Le sitemap et les URL canoniques sont préparés pour `art-fadist.com` ; ils devront être adaptés si l’adresse finale change.

Les visuels, œuvres et textes restent la propriété de Rémi Aldeguer.
