import React from 'react';

import classnames from 'classnames';

import MainPanel from './MainPanel';
import ManagePanel from './ManagePanel';
import { makeLogger } from '../utils';

const log = makeLogger('FE <SnoozePopup>');

// HACK: Arbitrary breakpoint for styles below which to use "narrow" variant
// The panel width is specified in Firefox in em units, so it can vary between
// platforms. OS X is around 224px, Windows is around 248px.
const NARROW_PANEL_MIN_WIDTH = 300;

export default class SnoozePopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activePanel: 'main',
      tabIsSnoozable: true,
      narrowPopup: false,
      dontShow: false,
      entries: []
    };
  }

  componentDidMount() {
    this.detectTabIsSnoozable();
    this.fetchEntries();

    this.storageHandler = (changes, area) => {
      // TODO: granularly apply the changes, rather than triggering a refresh?
      if (area === 'local') { this.fetchEntries(); }
    };
    browser.storage.onChanged.addListener(this.storageHandler);

    this.handleResize();
    this.boundHandleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundHandleResize);
  }

  componentWillUnmount() {
    browser.storage.onChanged.removeListener(this.storageHandler);
    window.removeEventListner('resize', this.boundHandleResize);
  }

  // Resize handler that lets us switch styles & rendering when the popup is
  // summoned from the toolbar versus from the menu panel. Toolbar size is based
  // on content size, menu panel body size is forcibly fixed.
  handleResize() {
    const clientWidth = document.body.clientWidth;
    if (clientWidth === 0) { return; }

    const newNarrowPopup = (clientWidth < NARROW_PANEL_MIN_WIDTH);
    log('resize', clientWidth, this.state.narrowPopup, newNarrowPopup);

    if (newNarrowPopup !== this.state.narrowPopup) {
      this.setState({ narrowPopup: newNarrowPopup });
    }
  }

  detectTabIsSnoozable() {
    const { activePanel } = this.state;
    this.props.queryTabIsSnoozable().then(tabIsSnoozable => {
      this.setState({
        tabIsSnoozable,
        activePanel: tabIsSnoozable ? activePanel : 'manage'
      });
    }).catch(reason => log('queryTabIsSnoozable got rejected', reason));
  }

  fetchEntries() {
    this.props.getAlarmsAndProperties().then(data => {
      const dontShow = data.dontShow;
      const entries = Object.values(data.alarms || {});
      log('fetched entries', dontShow, entries);
      this.setState({ dontShow, entries });
    }).catch(reason => {
      log('fetchEntries storage get rejected', reason);
    });
  }

  switchPanel(name) {
    this.setState({ activePanel: name });
  }

  render() {
    const { activePanel, tabIsSnoozable, narrowPopup } = this.state;
    const passProps = {
      ...this.props,
      ...this.state,
      switchPanel: this.switchPanel.bind(this)
    };
    return (
      <div className={classnames('panel-wrapper', { 'popup-narrow': narrowPopup })}>
        {tabIsSnoozable && <MainPanel {...passProps} id="main" active={'main' === activePanel} />}
        <ManagePanel {...passProps} id="manage" active={'manage' === activePanel} />
      </div>
    );
  }
}
