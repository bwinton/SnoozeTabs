# SnoozeTabs
An add-on to let you snooze your tabs for a while.

## How to run

* To lint: `npm run lint`
* To run: `npm test`
* To build for release: `npm run build`


## Architectural Questions / Decisions…

* Spec?
  * At [this link][spec].
* Assets?
  * Coming soon.
* Should we write this as a [WebExtension][webext]?
  * YES!

* Should we use a build step?
  * It would let us use [Flow][flow].
    * Should we even use Flow?
  * It would let us use [Sass][sass].
  * It would let us pull the info for the manifest from package.json.
  * It would let us `require` other javascript modules.
  * It would be more complicated, and I’m not sure we need it.
* Put the source in the root, or in a `src` subdirectory?
  * We could build into `dist`…
* Should we use a build tool?
  * [Gulp][gulp]?
  * [Grunt][grunt]?
  * Just [NPM][npm] scripts?
  * Nothing?
* Add a “Developer Mode” with much shorter times, or an extra 3-second timer?
* We’ll need something to convert [Pontoon][pontoon]-format l10n files into [WebExtension l10n][l10n] files…


[flow]: https://flowtype.org/
[gulp]: http://gulpjs.com/
[grunt]: http://gruntjs.com/
[l10n]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization
[npm]: https://docs.npmjs.com/misc/scripts
[pontoon]: https://pontoon.mozilla.org/projects/
[sass]: http://sass-lang.com/
[spec]: https://mozilla.invisionapp.com/share/MV9F846SY#/screens
[webext]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions