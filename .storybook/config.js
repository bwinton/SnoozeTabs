import { configure } from '@kadira/storybook';

const l10nStrings = require('../dist/_locales/en_US/messages.json');

// Mockups for global APIs used in components & libs
global.browser = {
  i18n: {
    getUILanguage: () => 'en-US',
    getMessage: id => (l10nStrings[id] && l10nStrings[id].message) ?
        l10nStrings[id].message : `{${id}}`
  }
};

function loadStories() {
  require('../stories');
}

configure(loadStories, module);
