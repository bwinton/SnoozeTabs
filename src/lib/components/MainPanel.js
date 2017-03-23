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
            <ul className="times">
              { times.map(item => this.renderTime(item)) }
            </ul>
          </div>
          <div className="footer">
            <div className="manage" onClick={ () => this.handleManageClick() }><span>{
              browser.i18n.getMessage('mainManageButton')
            }</span></div>
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
      <li className="option" key={item.id} id={item.id} onClick={ ev => this.handleOptionClick(ev, item) }>
        <img src={ `../icons/${item.icon || 'nightly.svg'}` } className="icon" />
        <div className="title">{item.title || '&nbsp;'}</div>
        <div className="date" onClick={ev => this.handleOptionDateClick(ev, item)}>{date}</div>
      </li>
    );
  }

  shouldIgnoreClicks() {
    const { active } = this.props;
    const { datepickerActive } = this.state;
    return !active || datepickerActive;
  }

  handleOptionClick(ev, item) {
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

  handleOptionDateClick(ev, item) {
    if (this.shouldIgnoreClicks()) { return; }
    ev.stopPropagation();
    const [time, ] = timeForId(this.props.moment(), item.id);
    this.setState({
      datepickerActive: true,
      defaultDateChoice: time
    });
  }

  handleManageClick() {
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
