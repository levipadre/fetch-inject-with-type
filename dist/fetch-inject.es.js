/**
 * Copyright (C) Josh Habdas <jhabdas@protonmail.com> (https://habd.as)
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

const head = (function(i,n,j,e,c,t,s){t=n.createElement(j),s=n.getElementsByTagName(j)[0];t.appendChild(n.createTextNode(e.text));t.type=e.blob.type;t.onload=c(e);s?s.parentNode.insertBefore(t,s):n.head.appendChild(t);}); // eslint-disable-line

/**
 * Fetch Inject module.
 *
 * @module fetchInject
 * @license Zlib
 * @param {(USVString[]|Request[])} inputs Resources you wish to fetch.
 * @param {Promise} [promise] A promise to await before attempting injection.
 * @throws {Promise<ReferenceError>} Rejects with error when given no arguments.
 * @throws {Promise<TypeError>} Rejects with error on invalid arguments.
 * @throws {Promise<Error>} Whatever `fetch` decides to throw.
 * @throws {SyntaxError} Via DOM upon attempting to parse unexpected tokens.
 * @returns {Promise<Object[]>} A promise which resolves to an `Array` of
 *     Objects containing `Response` `Body` properties used by the module.
 */
const fetchInject = function (inputs, promise) {
  if (!arguments.length) return Promise.reject(new ReferenceError("Failed to execute 'fetchInject': 1 argument required but only 0 present."))
  if (arguments[0] && arguments[0].constructor !== Array) return Promise.reject(new TypeError("Failed to execute 'fetchInject': argument 1 must be of type 'Array'."))
  if (arguments[1] && arguments[1].constructor !== Promise) return Promise.reject(new TypeError("Failed to execute 'fetchInject': argument 2 must be of type 'Promise'."))

  const resources = [];
  const deferreds = promise ? [].concat(promise) : [];
  const thenables = [];

  inputs.forEach(input => deferreds.push(
    window.fetch(input).then(res => {
      return [res.clone().text(), res.blob()]
    }).then(promises => {
      return Promise.all(promises).then(resolved => {
        resources.push({ text: resolved[0], blob: resolved[1] });
      })
    })
  ));

  return Promise.all(deferreds).then(() => {
    resources.forEach(resource => {
      thenables.push({
        then: resolve => {
          resource.blob.type.includes('text/css')
            ? head(window, document, 'style', resource, resolve)
            : head(window, document, 'script', resource, resolve);
        }
      });
    });
    return Promise.all(thenables)
  })
};

export default fetchInject;
