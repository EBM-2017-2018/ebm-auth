const handleResponse = (status, body) => new Promise((resolve, reject) => {
  if (status === 403)
    window.location.replace(
      `${body.login}?redirect=${encodeURIComponent(document.location.href)}`
    );
  else return resolve();
});


/**
 * HTTP response middleware to handle 403 errors.
 * You can use it with fetch, superagent or axios.
 * 
 * Examples :
 * ```
 * // Fetch
 * fetch(MY_URL)
 *  .then(checkAuthResponse)
 *  .then(response => { ... do whatever you want with the response });
 * 
 * // Superagent (Promise-based API)
 * agent.get(MY_URL)
 *  .then(checkAuthResponse)
 *  .then(response => { ... do whatever you want with the response });
 * 
 * // Superagent (Callback API)
 * agent.get(MY_URL)
 *  .end(handleResponse(
 *    (err, response => { ... do whatever you want with the response })
 *  ));
 * 
 * // Axios
 * axios.get(MY_URL)
 *  .then(checkAuthResponse)
 *  .then(response => { ... do whatever you want with the response });
 * ```
 * 
 * @param {Function|Response} response 
 */
export const checkAuthResponse = response => {
  if (typeof(response) === 'function') {
    // For the fucking shitty people who use an outdated nonsensical superagent API
    return (err, response) => {
      if (err) return handleResponse(err, response);
      else handleResponse(response.status).then(() => handleResponse(err, response));
    };
  } else {
    // When you use a great Promised-based API
    return handleResponse(
      response.status,
      typeof(response.json) === 'function' ? (await response.json()).login : (response.data || response.body).login
    ).then(() => response);
  }
};
