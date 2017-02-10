# SnoozeTabs

[![CircleCI](https://circleci.com/gh/bwinton/SnoozeTabs.svg?style=svg)](https://circleci.com/gh/bwinton/SnoozeTabs)

An add-on to let you snooze your tabs for a while.

## How to run
* `npm install`

* To develop: `npm start`
  * Builds the extension
  * Starts a file watcher to rebuild on changes
  * Launches Firefox Dev Edition with the extension, reloaded on changes

* If youʼre on Windows, youʼll need to use `npm run start-win`
  * Builds the extension
  * Starts a file watcher to rebuild on changes

* To run once: `npm run build && npm run run`

* To build for release: `npm run build`

* To lint: `npm run lint`

* To work with a production-style release, set the env var `NODE_ENV=production`.
  This will turn on production optiimzations, while turning off logging &
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


[flow]: https://flowtype.org/
[gulp]: http://gulpjs.com/
[grunt]: http://gruntjs.com/
[l10n]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization
[npm]: https://docs.npmjs.com/misc/scripts
[pontoon]: https://pontoon.mozilla.org/projects/
[sass]: http://sass-lang.com/
[spec]: https://mozilla.invisionapp.com/share/MV9F846SY#/screens
[webext]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions
[nouns]: https://thenounproject.com/
[bell]: https://thenounproject.com/term/bell/242717/
[stopwatch]: https://thenounproject.com/term/stopwatch/190330/
[future]: https://thenounproject.com/term/future/101713/
[sunglasses]: https://thenounproject.com/nas.ztu/collection/travel/?oq=weekend&cidx=0&i=58827
[calendar]: https://thenounproject.com/term/calendar/124931/