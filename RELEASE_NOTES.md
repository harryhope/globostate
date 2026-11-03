globostate now loads under Node's own ES module rules, has no dependencies, and fixes several re-render and state-shape bugs.

## Breaking changes

- **React 18 or newer is required.** globostate has used `useSyncExternalStore` since 0.4.0, and it doesn't exist in React 17. The peer dependency now says `>=18.0.0`, which it should have all along.
- **The package is now an ES module with an `exports` map.** `import` works everywhere. `require('globostate')` needs Node 20.19+ or 22.12+. Deep imports such as `globostate/index.js` are blocked; import from `globostate` instead.
- **lodash has been removed, and a few rare paths behave differently:**
  - Quoted bracket keys like `a["b"]` aren't supported. Use `a.b`, or an array path: `['a', 'b']`.
  - A literal key containing a dot (`{ 'x.y': 1 }`) is no longer matched by the string path `'x.y'`. Use `['x.y']`.
  - Empty segments are ignored: `'a..b'` is the same as `'a.b'`.

  Dot paths, bracket indexes (`'a.b[0].c'`) and array paths work as before.

## Fixes

- **Fixed: globostate failed to load outside a bundler.** In plain Node, including server builds, both `import` and `require` threw `ERR_MODULE_NOT_FOUND` for `lodash/get`.
- **Fixed: replacing a Date, Map, Set or class instance didn't re-render.** The equality check treated any two of these as equal. Arrays and plain objects are still compared shallowly; everything else is compared by reference.
- **Fixed: changing a value between `{}` and `[]` didn't re-render.**
- **Fixed: the setter got a new identity on every render** when the default was written inline (`useGloboState('todos', [])`) or the path was an inline array. It's now stable, so it's safe in `useEffect` dependencies and with memoized children.
- **Fixed: keys like `1e3`, `-1` or `''` created arrays** when setting through a missing level. Only non-negative integer keys (`0`, `12`) create arrays now.
- **Fixed: setting the path `''` replaced the whole state.** It now means the key `''`, as it did with lodash.

## TypeScript

- Paths can be typed as arrays: `useGloboState(['a', 'b', 0], value)`. The new `GloboPath` type is exported.
- The setter accepts updater functions: `setCount(c => c + 1)`.
- Types resolve through the `exports` map, including with `"moduleResolution": "nodenext"`.

## Other changes

- No runtime dependencies.
- The published package contains only `index.js`, `index.d.ts`, the README, LICENSE and `package.json`.
- Published with npm provenance.
- The README now documents path rules, updater functions, when components re-render, `createProvider`, and requirements.
