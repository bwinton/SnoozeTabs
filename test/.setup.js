import sinon from 'sinon';

global.browser = {
  i18n: {
    getMessage: sinon.spy(),
    getUILanguage: sinon.spy(),
  }
};
