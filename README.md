# SnoozeTabs

[![Available on Test Pilot](https://img.shields.io/badge/available_on-Test_Pilot-0996F8.svg)](https://testpilot.firefox.com/experiments/snooze-tabs)
[![CircleCI](https://circleci.com/gh/bwinton/SnoozeTabs.svg?style=svg)](https://circleci.com/gh/bwinton/SnoozeTabs)

An add-on to let you snooze your tabs for a while.

## How to run
* `npm install`

* To develop: `npm start`
  * This task does 3 things:
    1. Builds the extension
    1. Starts a file watcher to rebuild on changes
    1. Runs tests on file changes
  * You can load the Web Extension into Firefox like so:
    1. Type `about:debugging` into the URL bar - [read more about this page on MDN](https://developer.mozilla.org/en-US/docs/Tools/about:debugging).
    1. Click the "Load Temporary Add-on" button
    1. Navigate to your Snooze Tabs project directory and select `dist/manifest.json`

* To run once: `npm run build && npm run run`

* To build for release: `npm run build`

* To lint: `npm run lint`

* To work with a production-style release, set the env var `NODE_ENV=production`.
  This will turn on production optimizations, while turning off logging &
  various development conveniences. For example:
  * Continuous file watcher builds:
    * `NODE_ENV=production npm start`
  * Single one-shot build:
    * `NODE_ENV=production npm run build`

## Architectural Questions / Decisions…

* Spec?
  * At [this link][spec].
* Assets?
  * Coming soon.
* Should we write this as a [WebExtension][webext]?
  * YES!

* Add a “Developer Mode” with much shorter times, or an extra 3-second timer?
* We’ll need something to convert [Pontoon][pontoon]-format l10n files into [WebExtension l10n][l10n] files…


## Thanks

Many of our icons came from [the Noun Project][nouns]:
* Snooze Tabs logo: "[Bell][bell]" by Aysgl Avcu, from the Noun Project. (Modified)
* Later Today: "[Stopwatch][stopwatch]" By Marvin Wilhelm, from the Noun Project.
* Tomorrow:  "[Future][future]" By Arthur Shlain, from the Noun Project.
* Weekend: "[Sunglasses][sunglasses]" By NAS, from the Noun Project.
* Next Month: "[Calendar][calendar]" By artworkbean, from the Noun Project. (Modified)
* Pick a Date: "[Calendar][calendar]" By artworkbean, from the Noun Project.
* Undo: "[Undo][]" By H Alberto Gongora, from the Noun Project.


[bell]: https://thenounproject.com/term/bell/242717/
[calendar]: https://thenounproject.com/term/calendar/124931/
[flow]: https://flowtype.org/
[future]: https://thenounproject.com/term/future/101713/
[grunt]: http://gruntjs.com/
[gulp]: http://gulpjs.com/
[l10n]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization
[nouns]: https://thenounproject.com/
[npm]: https://docs.npmjs.com/misc/scripts
[pontoon]: https://pontoon.mozilla.org/projects/
[sass]: http://sass-lang.com/
[spec]: https://mozilla.invisionapp.com/share/MV9F846SY#/screens
[stopwatch]: https://thenounproject.com/term/stopwatch/190330/
[sunglasses]: https://thenounproject.com/nas.ztu/collection/travel/?oq=weekend&cidx=0&i=58827
[undo]: https://thenounproject.com/search/?q=undo&i=716798
[webext]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions
