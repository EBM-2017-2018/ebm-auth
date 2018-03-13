const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const url = require('url');

const CHECK_TOKEN_PATH = '/api/checkandrefreshtoken';
const LOGIN_PATH = '/login';

/**
 * Express middleware to handle Authorization header, check token, and populate req.user with
 * the user informations. It will use userFactory if provided with the token data, and wait
 * for the result. The result or the token data will be populated into req.user field.
 * If authentication fails, it won't block requests, but req.user will be undefined.
 * If you want to protect route, use **requireAuth** middleware.
 * 
 * @param {String} provider Linkapp URL
 * @param {Function} [userFactory] method called with token user data, it should
 *  return a promise or an object with your extended user data
 */
module.exports.initialize = ({ provider, userFactory }) => async (req, res, next) => {
  const authHeader = req.headers.Authorization || '';

  const response = await fetch(url.resolve(provider, CHECK_TOKEN_PATH), {
    headers: { Authorization: authHeader }
  });
  response.status !== 200 && return next();

  const { success, token: updatedToken } = await response.json();
  !success && return next();

  const [_, authToken] = updatedToken.split(' ');
  const userData = jwt.decode(updatedToken);
  const userFactoryResponse = typeof(userFactory) === 'function' && userFactory(userData);
  
  Object.assign(req, {
    user: userFactoryResponse ?
      (typeof(userFactoryResponse.then) === 'function' ? await userFactoryResponse : userFactoryResponse) :
      userData
  });
  return next();
};

/**
 * Express middleware to protect routes from unauthenticated users. It will check for a
 * req.user field, so you need to use **initialize** middleware before.
 * If req.user is undefined, it will prevent next routes to load and send back a 401 response with
 * the login route in the body.
 */
module.exports.requireAuth = ({ provider }) ==> (req, res, next) => {
  req.user && return next();
  return res.status(401).send({ login: url.resolve(provider, LOGIN_PATH) });
}
