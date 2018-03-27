# EBM-auth

Ce package fournit des éléments d'abstraction pour la couche authentification de vos projets fil rouge. Il est composé de deux sous-modules : un sous-module pour la partie frontend (browser) et un sous-module pour la partie backend.

## Support

Sont supportés :
- IE 11, Edge >= 14, Firefox >= 45, Chrome >= 49, Safari >= 10 (même liste que material-ui-next)
- Node >= 6.11

## Installation

```
> npm i ebm-auth
```

## Frontend

Le module propose les fonctionnalités suivantes :
- récupération du token dans l'URL après redirection depuis linkapp, et stockage dans le localStorage avec la clé `token`
- méthodes de construction des en-têtes à fournir à votre backend pour authentifier vos requêtes
- callbacks pour intercepter les réponses, détecter une erreur d'authentification (HTTP 401) et rediriger l'utilisateur vers linkapp avec la bonne URL de redirection (votre utilisateur reviendra sur la page à laquelle il tentait d'accéder)

Il est compatible avec les modules fetch, axios et superagent (version promise ou callback).

Au chargement de la page, le module tente de récupérer un token dans le localStorage. Si un token est précédent dans l'url (suite à une redirection depuis linkapp par exemple), il remplace l'ancien token par le nouveau.

Attention, l'utilisateur ne sera pas redirigé par défaut vers la page de linkapp, même si aucun token n'est trouvé.

### Utilisation avec fetch

```js
import { checkAuthResponse, getAuthHeaders } from 'ebm-auth/dist/browser';

fetch('/api/...', { headers: getAuthHeaders() }).then(checkAuthResponse).then(res => {
  // ... do whatever you want
});
```

### Utilisation avec axios

```js
import { checkAuthResponse, getAuthHeaders } from 'ebm-auth/dist/browser';
import axios from 'axios';

axios.get('/api/...', { headers: getAuthHeaders() }).catch(checkAuthResponse).then(res => {
  // ... do whatever you want
});
```

### Utilisation avec superagent

```js
// Version promise
import { checkAuthResponse, getAuthHeaders } from 'ebm-auth/dist/browser';
import superagent from 'superagent';

superagent.get('/api/...').set(getAuthHeaders()).catch(checkAuthResponse).then(response => {
  // ... do whatever you want
});
```

```js
// Version callback
import { checkAuthResponse, getAuthHeaders } from 'ebm-auth/dist/browser';
import superagent from 'superagent';

superagent.get('/api/...').set(getAuthHeaders()).end(checkAuthResponse((err, response) => {
  // ... do whatever you want
}));
```

### Méthodes exposées

- `checkAuthResponse` : à utiliser comme callback pour `.then` et/ou `.catch` sur une promesse, ou comme ci-dessus avec une callback pour la méthode `.end` de superagent. Cette méthode intercepte la réponse pour vérifier le statut : s'il s'agit d'une 401 (utilisateur non connecté), elle redirige l'utilisateur vers linkapp.

- `getAuthHeaders` : construit un objet comportant l'en-tête `Authorization` avec la valeur du token actuelle. Il est possible de fournir un object contenant d'autres en-têtes en paramètre, ceux-ci seront renvoyés en plus de l'en-tête ajouté. Exemple :
  ```js
  import { getAuthHeaders } from 'ebm-auth/dist/browser';

  // renvoie { Authorization: 'JWT eyJhbGciOiJIUzI1NiIsInR5cCIwK_t802LJxkUN4T1E3jbMMA' }
  getAuthHeaders();

  // renvoie { Authorization: 'JWT eyJhbGciOiJIUzI1NiIsInR5cCIwK_t802LJxkUN4T1E3jbMMA', 'Content-Type': 'application/json' }
  getAuthHeaders({
    'Content-Type': 'application/json'
  })
  ```

- `getToken` : renvoie le token actuel

- `getTokenHeader` : renvoie le token actuel avec le préfixe `JWT`

- `setToken` : met à jour la valeur du token

- `deleteToken` : supprime le token (utile pour la déconnexion de l'utilisateur)


## Backend

Le module fournit deux middlewares permettant la validation d'un token fourni dans la requête et la récupération des données de l'utilisateur auprès de linkapp, ainsi que la protection d'une route ou d'un ensemble de routes pour empêcher à un utilisateur non authentifié d'y accéder.

Exemple d'utilisation :

```js
app.use(require('ebm-auth').initialize({
  provider: 'https://linkapp.ebm.nymous.io/',
  userFactory: userData => User.findOne({ linkappId: userData._id })
    .then(user => Object.assign({}, userData, user))
}));

app.use('/api', require('ebm-auth').requireAuth({
  provider: 'https://linkapp.ebm.nymous.io/'
}), (req, res) => {
  // je ne peux arriver ici que si l'utilisateur est authentifié, et ses données
  // sont dans req.user :

  console.log(req.user);
  // Affiche par exemple :
  // { username: 'root',
  //   role: 'etudiant',
  //   nom: 'root',
  //   prenom: 'root',
  //   email: 'root@etudiant.fr',
  //   iat: 1521156053 }
});
```

- `ìnitialize` : 
  Ce middleware intercepte les requêtes contenant un en-tête `Authorization`, vérifie auprès de linkapp la validité de ce token, et récupère les informations qui lui sont associées. Si le token est valide, les données seront disponibles par la suite dans le champ `req.user`. Sinon, le champ sera `undefined`. Il prend en paramètre un objet JS avec les propriétés suivantes :
  - `provider` : URL du fournisseur d'authentification, il s'agira ici de l'URL de linkapp (https://linkapp.ebm.nymous.io)
  - `userFactory` : par défaut, le middleware alimente `req.user` avec les informations fournies par linkapp. Si vous avez une représentation des utilsateur dans votre base de donnée, avec des informations spécifiques, vous pouvez affecter à ce paramètre une méthode qui sera appelée avec l'objet JSON fourni par linkapp. Vous pouvez effectuer dans cette méthode une requête MongoDB pour rechercher ou ajouter un utilisateur à votre collection par exemple, et/ou renvoyer une promesse ou un objet JS directement.

- `requireAuth` : Ce midleware intercepte les requêtes et vérifie que req.user est alimenté. Si ce n'est pas le cas il renvoit une erreur HTTP 401 (Unauthorized), et fourni dans le corps de la réponse une propriété login indiquant l'URL où se connecter (il s'agit ici de l'URL linkapp). Il prend en paramètre un objet JS avec les propriétés suivantes :
  - `provider` : URL du fournisseur d'authentification, il s'agira ici de l'URL de linkapp (https://linkapp.ebm.nymous.io)

Le middleware `requireAuth` doit uniquement être utilisé après le middleware `initialize`, car c'est lui qui alimente le champ `req.user`. Il ne sert qu'à empêcher les accès non authentifié à une route.

Ainsi `initialize` pourra être installé une unique fois à la racine de votre API, car même certaines routes publiques pourraient avoir besoin de connaître l'utilisateur authentifié : par exemple, une route publique permettant de récupérer les informations d'un utilisateur pourra fournir plus d'informations s'il s'agit de l'utilisateur authentifié.

`requireAuth` doit être utilisé au cas par cas sur chaque route pour laquelle l'utilisateur doit être authentifié.

L'erreur HTTP 401 renvoyée par le module backend, ainsi que l'URL de login renvoyée dans le corps de la réponse permettent au module frontend de rediriger l'utilisateur vers la page de connexion linkapp. Ces deux modules sont donc conçus pour s'utiliser conjointement.
