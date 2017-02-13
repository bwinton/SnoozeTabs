import sinon from 'sinon';

global.browser = {
  i18n: {
    getMessage: sinon.spy(),
    getAcceptLanguages: sinon.spy(() => new Promise(resolve =>
      resolve(['en-US']))),
  }
};
