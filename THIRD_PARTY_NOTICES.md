# Third-party notices

Lead Scout's engine uses the open-source packages below, installed from
npm. Each keeps its own licence; the licence text ships inside each
package's folder in `node_modules/`. This list was generated from the
installed `node_modules/*/package.json` files and `package-lock.json` on
2026-10-11. Regenerate it whenever dependencies change.

Permissive licences: MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD,
Apache-2.0, Unlicense, CC0-1.0, BlueOak-1.0.0. Anything else is marked
**(check)**. For "A OR B" licences, one permissive choice is enough.
Flagged: lightningcss@1.33.0 (MPL-2.0), lightningcss-win32-x64-msvc@1.33.0 (MPL-2.0).

**About the MPL-2.0 packages:** `lightningcss` (and its one
platform-specific build) is a development dependency only, pulled in by
the test runner (`vitest` → `vite`). It is never part of the engine
that runs, is not modified, and is not committed to this repository
(`node_modules/` is git-ignored). MPL-2.0 is a file-level copyleft
licence: it would only ask for source to be shared for changed MPL files
if they were distributed. No production dependency is MPL-licensed.

## Production dependencies (62, including everything they pull in)

These are installed for anyone who runs the engine.

| Package | Version | Licence | Repository |
|---|---|---|---|
| @aws-sdk/client-sesv2 | 3.1149.0 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/core | 3.978.2 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-env | 3.972.73 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-http | 3.972.75 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-ini | 3.973.18 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-login | 3.972.80 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-node | 3.972.85 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-process | 3.972.73 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-sso | 3.973.17 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/credential-provider-web-identity | 3.972.79 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/nested-clients | 3.997.47 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/signature-v4-multi-region | 3.996.48 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/token-providers | 3.1149.0 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/types | 3.974.6 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/xml-builder | 3.972.41 | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws/lambda-invoke-store | 0.3.0 | Apache-2.0 | https://github.com/awslabs/aws-lambda-invoke-store |
| @smithy/core | 3.35.2 | Apache-2.0 | https://github.com/smithy-lang/smithy-typescript |
| @smithy/credential-provider-imds | 4.5.2 | Apache-2.0 | https://github.com/smithy-lang/smithy-typescript |
| @smithy/fetch-http-handler | 5.8.0 | Apache-2.0 | https://github.com/smithy-lang/smithy-typescript |
| @smithy/node-http-handler | 4.12.1 | Apache-2.0 | https://github.com/smithy-lang/smithy-typescript |
| @smithy/signature-v4 | 5.7.4 | Apache-2.0 | https://github.com/smithy-lang/smithy-typescript |
| @smithy/types | 4.19.0 | Apache-2.0 | https://github.com/smithy-lang/smithy-typescript |
| base64-js | 1.5.1 | MIT | https://github.com/beatgammit/base64-js |
| better-sqlite3 | 12.11.1 | MIT | https://github.com/WiseLibs/better-sqlite3 |
| bindings | 1.5.0 | MIT | https://github.com/TooTallNate/node-bindings |
| bl | 4.1.0 | MIT | https://github.com/rvagg/bl |
| bowser | 2.14.1 | MIT | https://github.com/bowser-js/bowser |
| buffer | 5.7.1 | MIT | https://github.com/feross/buffer |
| chownr | 1.1.4 | ISC | https://github.com/isaacs/chownr |
| decompress-response | 6.0.0 | MIT | https://github.com/sindresorhus/decompress-response |
| deep-extend | 0.6.0 | MIT | https://github.com/unclechu/node-deep-extend |
| detect-libc | 2.1.2 | Apache-2.0 | https://github.com/lovell/detect-libc |
| end-of-stream | 1.4.5 | MIT | https://github.com/mafintosh/end-of-stream |
| expand-template | 2.0.3 | (MIT OR WTFPL) | https://github.com/ralphtheninja/expand-template |
| file-uri-to-path | 1.0.0 | MIT | https://github.com/TooTallNate/file-uri-to-path |
| fs-constants | 1.0.0 | MIT | https://github.com/mafintosh/fs-constants |
| github-from-package | 0.0.0 | MIT | https://github.com/substack/github-from-package |
| ieee754 | 1.2.1 | BSD-3-Clause | https://github.com/feross/ieee754 |
| inherits | 2.0.4 | ISC | https://github.com/isaacs/inherits |
| ini | 1.3.8 | ISC | https://github.com/isaacs/ini |
| mimic-response | 3.1.0 | MIT | https://github.com/sindresorhus/mimic-response |
| minimist | 1.2.8 | MIT | https://github.com/minimistjs/minimist |
| mkdirp-classic | 0.5.3 | MIT | https://github.com/mafintosh/mkdirp-classic |
| napi-build-utils | 2.0.0 | MIT | https://github.com/inspiredware/napi-build-utils |
| node-abi | 3.98.0 | MIT | https://github.com/electron/node-abi |
| once | 1.4.0 | ISC | https://github.com/isaacs/once |
| prebuild-install | 7.1.3 | MIT | https://github.com/prebuild/prebuild-install |
| pump | 3.0.4 | MIT | https://github.com/mafintosh/pump |
| rc | 1.2.8 | (BSD-2-Clause OR MIT OR Apache-2.0) | https://github.com/dominictarr/rc |
| readable-stream | 3.6.2 | MIT | https://github.com/nodejs/readable-stream |
| safe-buffer | 5.2.1 | MIT | https://github.com/feross/safe-buffer |
| semver | 7.8.5 | ISC | https://github.com/npm/node-semver |
| simple-concat | 1.0.1 | MIT | https://github.com/feross/simple-concat |
| simple-get | 4.0.1 | MIT | https://github.com/feross/simple-get |
| string_decoder | 1.3.0 | MIT | https://github.com/nodejs/string_decoder |
| strip-json-comments | 2.0.1 | MIT | https://github.com/sindresorhus/strip-json-comments |
| tar-fs | 2.1.5 | MIT | https://github.com/mafintosh/tar-fs |
| tar-stream | 2.2.0 | MIT | https://github.com/mafintosh/tar-stream |
| tslib | 2.8.1 | 0BSD | https://github.com/Microsoft/tslib |
| tunnel-agent | 0.6.0 | Apache-2.0 | https://github.com/mikeal/tunnel-agent |
| util-deprecate | 1.0.2 | MIT | https://github.com/TooTallNate/util-deprecate |
| wrappy | 1.0.2 | ISC | https://github.com/npm/wrappy |

## Development dependencies (41, including everything they pull in)

Used only to type-check and test the code (`npm test`). Platform-specific
optional packages for other operating systems are not installed and not
listed.

| Package | Version | Licence | Repository |
|---|---|---|---|
| @esbuild/win32-x64 | 0.28.2 | MIT | https://github.com/evanw/esbuild |
| @jridgewell/resolve-uri | 3.1.2 | MIT | https://github.com/jridgewell/resolve-uri |
| @jridgewell/sourcemap-codec | 1.6.0 | MIT | https://github.com/jridgewell/sourcemaps |
| @jridgewell/trace-mapping | 0.3.31 | MIT | https://github.com/jridgewell/sourcemaps |
| @oxc-project/types | 0.153.0 | MIT | https://github.com/oxc-project/oxc |
| @rolldown/binding-win32-x64-msvc | 1.2.13 | MIT | https://github.com/rolldown/rolldown |
| @rolldown/pluginutils | 1.0.1 | MIT | https://github.com/rolldown/plugins |
| @types/better-sqlite3 | 7.6.13 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/chai | 5.2.3 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/deep-eql | 4.0.2 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/estree | 1.0.9 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/node | 22.20.5 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @vitest/mocker | 5.0.3 | MIT | https://github.com/vitest-dev/vitest |
| @vitest/spy | 5.0.3 | MIT | https://github.com/vitest-dev/vitest |
| assertion-error | 2.0.1 | MIT | git@github.com:chaijs/assertion-error |
| chai | 6.3.0 | MIT | https://github.com/chaijs/chai |
| es-module-lexer | 2.3.2 | MIT | https://github.com/guybedford/es-module-lexer |
| esbuild | 0.28.2 | MIT | https://github.com/evanw/esbuild |
| estree-walker | 3.0.3 | MIT | https://github.com/Rich-Harris/estree-walker |
| expect-type | 1.4.0 | Apache-2.0 | https://github.com/mmkal/expect-type |
| fdir | 6.5.0 | MIT | https://github.com/thecodrr/fdir |
| lightningcss | 1.33.0 | MPL-2.0 **(check)** | https://github.com/parcel-bundler/lightningcss |
| lightningcss-win32-x64-msvc | 1.33.0 | MPL-2.0 **(check)** | https://github.com/parcel-bundler/lightningcss |
| magic-string | 1.4.3 | MIT | https://github.com/Rich-Harris/magic-string |
| nanoid | 3.3.20 | MIT | https://github.com/ai/nanoid |
| obug | 2.2.1 | MIT | https://github.com/sxzz/obug |
| picocolors | 1.1.1 | ISC | https://github.com/alexeyraspopov/picocolors |
| picomatch | 4.0.7 | MIT | https://github.com/micromatch/picomatch |
| postcss | 8.5.29 | MIT | https://github.com/postcss/postcss |
| rolldown | 1.2.13 | MIT | https://github.com/rolldown/rolldown |
| source-map-js | 1.2.2 | BSD-3-Clause | https://github.com/7rulnik/source-map-js |
| std-env | 4.3.0 | MIT | https://github.com/unjs/std-env |
| tinybench | 6.2.2 | MIT | https://github.com/tinylibs/tinybench |
| tinyexec | 1.3.1 | MIT | https://github.com/tinylibs/tinyexec |
| tinyglobby | 0.2.17 | MIT | https://github.com/SuperchupuDev/tinyglobby |
| tsx | 4.23.15 | MIT | https://github.com/privatenumber/tsx |
| typescript | 5.9.3 | Apache-2.0 | https://github.com/microsoft/TypeScript |
| undici-types | 6.21.0 | MIT | https://github.com/nodejs/undici |
| vite | 8.3.4 | MIT | https://github.com/vitejs/vite |
| vitest | 5.0.3 | MIT | https://github.com/vitest-dev/vitest |
| why-is-node-running | 3.2.1 | MIT | https://github.com/mafintosh/why-is-node-running |

## Not a dependency, but included

`src/leads/injection-defense.ts` contains three functions copied from
Automaton by Conway Research (MIT): see [CREDITS.md](CREDITS.md) and
[LICENSE](LICENSE).
