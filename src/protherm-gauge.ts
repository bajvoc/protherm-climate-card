import { html, TemplateResult, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { GaugeConfig } from './gauge-types';
import { GaugeElement } from './gauge-renderer'; // Import base class

import { ProthermData, ProgressData } from './protherm-types';

@customElement('protherm-gauge')
export class ProthermGaugeElement extends GaugeElement {
  @property({ type: Object }) public config?: ProthermData;
  /*protected override min = 0;
  protected override max = 134;
  protected override strokeWidth = 4;
  protected override radius = 60;*/

  /*protected override renderContainer(gaugeData: GaugeConfig): TemplateResult {
    gaugeData.enabled = true;
    gaugeData.currentValue = 15;
    gaugeData.targetValue = 68;
    gaugeData.isTrackActive = gaugeData.enabled ? true : false;
    gaugeData.isBridgeActive = gaugeData.enabled ? true : false;

    return super.renderContainer(gaugeData);
  }*/
  protected override render(): TemplateResult | void {
    let element: TemplateResult | void;

    if (!this.config) {
      element = this.showError('No configuration provided');
    } else {
      const isHeating = this.config.state === 'heat';
      const gaugeData: GaugeConfig = {
        state: this.config.state,
        enabled: this.config.enabled,
        isOff: this.config.state === 'off',
        isBridgeActive: isHeating,
        isTrackActive: isHeating,
        targetValue: this.config.targetTemp,
        currentValue: this.config.currentTemp,
        gaugeLength: this.max,
      };

      element = this.renderContainer(gaugeData);
    }
    return element;
  }

  protected override renderInfo(gaugeData: GaugeConfig): TemplateResult {
    let element: TemplateResult;

    if (!this.config) {
      element = this.showError('No configuration provided');
    } else {
      const parentHtml = super.renderInfo(gaugeData);
      /*const progressData: ProgressData = {
        progress: 20,
        start: '06:00',
        end: '14:40',
        next_trigger: '14:45',
      };
      const prothermData: ProthermData = {
        tempAlarm: false,
        pressureAlarm: false,
        outsideTemp: '21.5',
        returnTemp: '46.5',
        schedule: progressData,
      };*/

      element = html`${parentHtml}
        <div class="temp-display-container">
          ${this._renderTempContainer(gaugeData.currentValue, this.config.tempAlarm, this.config.pressureAlarm)}
        </div>

        <div class="target-label">
          ${this._renderSchedule(gaugeData, this.config)} ${this._renderTimeRemaining(gaugeData, this.config)}
          ${this._renderTempFooter(this.config.tempAlarm, this.config.outsideTemp, this.config.returnTemp)}
        </div>`;
    }
    return element;
  }

  private _renderTempContainer(currentTemp: number, tempAlarm: boolean, pressureAlarm: boolean): TemplateResult {
    const currentTempParts = currentTemp.toString().split('.');

    return html`<!-- Left Alarm: Temperature -->
      <div class="left-alarm">
        <span class="alarm-icon left ${tempAlarm ? 'active' : ''}">
          <ha-icon icon="mdi:thermometer-alert"></ha-icon>
        </span>
      </div>

      <div class="main-temp">
        <p class="value">
          <span>${currentTempParts[0]}</span>
          <span class="addon">
            <span class="decimal">.${currentTempParts[1] || '0'}</span>
            <span class="unit">°C</span>
          </span>
        </p>
      </div>

      <!-- Right Alarm: Pressure -->
      <div class="right-alarm">
        <span class="alarm-icon right ${pressureAlarm ? 'active' : ''}">
          <ha-icon icon="mdi:gauge-full"></ha-icon>
        </span>
      </div>`;
  }

  private _renderSchedule(gaugeData: GaugeConfig, prothermData: ProthermData): TemplateResult {
    const progressData = prothermData.schedule;
    const targetTemp = gaugeData.targetValue;
    return html`<div class="label-row ${gaugeData.enabled ? '' : 'disabled'}">
        ${this._renderScheduleStartEnd('start', progressData?.start)}
        <span class="target-text"> ${targetTemp}°C </span>
        ${this._renderScheduleStartEnd('end', progressData?.end)}
      </div>

      ${this._renderScheduleProgress(gaugeData, prothermData)}`;
  }

  private _renderScheduleStartEnd(type: 'start' | 'end', timeStr: string | undefined): TemplateResult {
    const [hours, minutes] = timeStr?.split(':') || ['00', '00'];

    return html`
      <div class="time-container ${type} ${timeStr ? '' : 'inactive'}">
        <span class="hours">${type === 'end' ? minutes : hours}</span>
        <span class="colon-align">:</span>
        <span class="minutes">${type === 'end' ? hours : minutes}</span>
      </div>
    `;
  }

  private _renderScheduleProgress(gaugeData: GaugeConfig, prothermData: ProthermData): TemplateResult {
    const progress = prothermData.schedule?.progress;
    if (!progress) return html``;

    return html`<div class="progress-track ${gaugeData.enabled ? '' : 'disabled'}">
      <div class="progress-fill" style="width: ${progress}%"></div>
    </div>`;
  }

  private _renderTempFooter(
    tempAlarm: boolean,
    outsideTemp: string | undefined,
    returnTemp: string | undefined,
  ): TemplateResult {
    return html`<div class="temp-footer">
      ${returnTemp !== undefined
        ? html`<span class="footer-temp return ${tempAlarm ? 'active' : ''}">${returnTemp} °C</span>`
        : ''}
      ${outsideTemp !== undefined ? html`<span class="footer-temp outside">${outsideTemp} °C</span>` : ''}
    </div>`;
  }

  private _renderTimeRemaining(gaugeData: GaugeConfig, prothermData: ProthermData): TemplateResult {
    const schedule = prothermData.schedule;
    if (!schedule || !schedule.next_trigger) return html``;

    const nextTrigger = schedule?.next_trigger || '';
    return html` <div class="time-remaining ${gaugeData.enabled ? '' : 'disabled'}">
      <div class="last-updated">${nextTrigger}</div>
    </div>`;
  }

  static override get styles(): CSSResultGroup {
    const parentStyles = super.styles;

    const styles = css`
      .temp-display-container {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        width: 100%;
      }

      .left-alarm,
      .right-alarm {
        /* Equal widths force the main-temp to the absolute center */
        flex: 0 0 clamp(30px, 18cqw, 50px);
        height: 100%;
        display: flex;
        align-items: flex-end;
      }

      .left-alarm {
        justify-content: flex-end;
      }

      .right-alarm {
        justify-content: flex-start;
      }

      .alarm-icon {
        visibility: hidden;
        color: #ff0000;
        font-size: clamp(20px, 10cqw, 30px);
        line-height: 1;
      }

      .alarm-icon.active {
        visibility: visible;
        animation: alarm-flash 0.8s infinite;
      }

      @keyframes alarm-flash {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.2;
        }
        100% {
          opacity: 1;
        }
      }

      .main-temp {
        /* Clamp: Min ~32px on narrow mobile, Maxes out at original 3.5rem (~56px) on PC */
        font-size: clamp(32px, 18cqw, 3.5rem);
        font-weight: 300;
        line-height: 1;
        display: flex;
        justify-content: center;
        align-items: baseline;
        margin: 0 clamp(4px, 2cqw, 10px);
      }

      .value {
        display: flex;
        margin: 0px;
        direction: ltr;
      }

      .addon {
        display: flex;
        flex-direction: column-reverse;
        padding: clamp(2px, 1cqw, 4px) 0px;
      }

      .decimal {
        /* Clamp: Min ~16px, Maxes out at original 1.75rem (~28px) */
        font-size: clamp(16px, 9cqw, 1.75rem);
        font-weight: 400;
        display: inline-block;
      }

      .unit {
        /* Clamp: Min ~12px, Maxes out at original 1.1rem (~17.6px) */
        font-size: clamp(12px, 5.5cqw, 1.1rem);
        line-height: 1;
        font-weight: 500;
        margin-bottom: 2px;
      }

      .target-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }

      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        width: 120px;
        margin-bottom: 2px;
        padding-bottom: 4px;
      }

      .label-row.disabled {
        opacity: 0.4;
        filter: grayscale(100%);
        pointer-events: none; /* Prevents clicking the gauge when off */
        transition: all 0.4s ease;
      }

      .time-container {
        display: flex;
        position: relative;
        font-size: 0.7rem;
        color: var(--secondary-text-color);
        width: 0;
        justify-content: center;
        align-items: flex-end; /* Align the colon to the bottom */
        height: 1em; /* Give it a height so 'bottom' has a reference */
        visibility: visible;
      }

      .target-text {
        font-size: 1.4rem; /* Assuming it's double the size of the time */
        line-height: 1; /* Prevents extra ghost padding at the bottom */
        font-weight: bold;
      }

      .time-container.inactive {
        visibility: hidden;
      }

      .time-container .hours,
      .time-container .colon-align,
      .time-container .minutes {
        position: absolute;
        bottom: 0; /* Anchor them to the bottom of the time-container */
        line-height: 1;
      }

      .time-container.start .hours {
        right: 4px;
      }
      .time-container.start .minutes {
        left: 4px;
      }

      .time-container.end .minutes {
        right: 4px;
      }
      .time-container.end .hours {
        left: 4px;
      }

      /* The Colon sits exactly above the start/end of the bar */
      .colon-align {
        font-weight: bold;
      }

      .progress-track {
        width: 120px;
        height: 4px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-track.disabled {
        opacity: 0.4;
        filter: grayscale(100%);
        pointer-events: none; /* Prevents clicking the gauge when off */
        transition: all 0.4s ease;
      }

      .progress-fill {
        height: 100%;
        background-color: #4caf50;
        transition: width 0.5s ease;
      }

      .temp-footer {
        display: flex;
        justify-content: center; /* This centers the group */
        align-items: center;
        gap: 12px; /* Space between the two numbers */
        width: 100%;
        margin-top: 4px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .footer-temp {
        line-height: 1;
        white-space: nowrap;
      }

      /* Outside Temp: Always visible and Blue */
      .footer-temp.outside {
        color: #448aff; /* Nice vibrant blue */
      }

      /* Return Temp: Red and only shown during alarm */
      .footer-temp.return {
        display: none; /* Use display:none so 'outside' can take the center spot */
        color: #ff4444; /* Red */
      }

      .footer-temp.return.active {
        display: inline; /* Revealed during alarm */
      }

      .time-remaining {
        display: flex;
        position: relative;
        font-size: 0.7rem; /* Half temperature size */
        color: var(--secondary-text-color);
        width: 100%;
        justify-content: center;
        margin-top: 2px;
      }

      .time-remaining.disabled {
        opacity: 0.4;
        filter: grayscale(100%);
        pointer-events: none; /* Prevents clicking the gauge when off */
        transition: all 0.4s ease;
      }

      .ebusd-footer {
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid var(--divider-color);
        font-size: 0.9rem;
      }
    `;

    return [...(Array.isArray(parentStyles) ? parentStyles : [parentStyles]), styles];
  }
}
