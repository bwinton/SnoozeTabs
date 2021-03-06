import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import classnames from 'classnames';

import { PICK_TIME, times, timeForId } from '../times';

import DatePickerPanel from './DatePickerPanel';

export default class MainPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      datepickerActive: false,
      dateChoice: null,
      defaultDateChoice: props.moment()
    };
  }

  render() {
    const { id, active, moment } = this.props;
    const { datepickerActive, defaultDateChoice } = this.state;

    return (
      <ReactCSSTransitionGroup component="div" transitionName="panel" transitionEnterTimeout={250} transitionLeaveTimeout={250}>
        <div id={id} className={classnames('static', 'panel', { active, obscured: datepickerActive })}>
          <div className="content">
            <ul className="times" role="listbox">
              { times.map(item => this.renderTime(item)) }
            </ul>
          </div>
          <div className="footer" role="menu">
            <div className="manage" onClick={ ev => this.handleManageClick(ev) } onKeyPress={ ev => this.handleManageClick(ev) } tabIndex={ this.shouldFocus() }>
              <span>{ browser.i18n.getMessage('mainManageButton') }</span>
            </div>
          </div>
        </div>
        {datepickerActive && <DatePickerPanel id="calendar" key="calendar"
                         active={datepickerActive}
                         header={browser.i18n.getMessage('mainCalendarHeader')}
                         defaultValue={defaultDateChoice}
                         onClose={ () => this.closeTimeSelect() }
                         onSelect={ value => this.confirmTimeSelect(value) }
                         moment={ moment } />}
      </ReactCSSTransitionGroup>
    );
  }

  renderTime(item) {
    const [, date] = timeForId(this.props.moment(), item.id);
    return (
      <li role="option" className="option" key={item.id} id={item.id} tabIndex={this.shouldFocus()} onClick={ ev => this.handleOptionClick(ev, item) }
        onKeyPress={ ev => this.handleOptionClick(ev, item) }>
        <img src={ `../icons/${item.icon || 'nightly.svg'}` } className="icon" />
        <div className="title">{item.title || '&nbsp;'}</div>
        <div className="date" tabIndex={this.setDateTabIndex(item.id)} onClick={ev => this.handleOptionDateClick(ev, item)}>{date}</div>
      </li>
    );
  }

  shouldIgnoreClicks() {
    const { active } = this.props;
    const { datepickerActive } = this.state;
    return !active || datepickerActive;
  }

  shouldFocus() {
    return this.shouldIgnoreClicks() ? -1 : 1;
  }

  shouldIgnoreKeyEvents(ev) {
    return ev.key && ev.key !== 'Enter';
  }

  handleOptionClick(ev, item) {
    ev.stopPropagation();
    if (this.shouldIgnoreKeyEvents(ev)) { return; }
    if (this.shouldIgnoreClicks()) { return; }
    const { scheduleSnoozedTab } = this.props;
    if (item.id === PICK_TIME) {
      this.setState({
        datepickerActive: true,
        defaultDateChoice: this.props.moment()
      });
      return;
    }
    const [time, ] = timeForId(this.props.moment(), item.id);
    scheduleSnoozedTab(time, item.id);
  }

  setDateTabIndex(id) {
    return this.shouldIgnoreClicks() || (id === 'next') ? -1: 1;
  }

  handleOptionDateClick(ev, item) {
    if (item.id === 'next') {return ;}
    if (this.shouldIgnoreKeyEvents(ev)) { return; }
    if (this.shouldIgnoreClicks()) { return; }
    ev.stopPropagation();
    const [time, ] = timeForId(this.props.moment(), item.id);
    this.setState({
      datepickerActive: true,
      defaultDateChoice: time
    });
  }

  handleManageClick(ev) {
    if (this.shouldIgnoreKeyEvents(ev)) { return; }
    if (this.shouldIgnoreClicks()) { return; }
    const { switchPanel } = this.props;
    switchPanel('manage');
  }

  closeTimeSelect() {
    this.setState({ datepickerActive: false });
  }

  confirmTimeSelect(dateChoice) {
    const { scheduleSnoozedTab } = this.props;
    if (!dateChoice) { return; }
    scheduleSnoozedTab(dateChoice, PICK_TIME);
  }
}

MainPanel.propTypes = {
  active: React.PropTypes.bool.isRequired,
  id: React.PropTypes.string.isRequired,
  moment: React.PropTypes.func.isRequired,
  scheduleSnoozedTab: React.PropTypes.func.isRequired,
  switchPanel: React.PropTypes.func.isRequired,
};
