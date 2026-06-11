import { html, TemplateResult } from 'lit';
import { GaugeData } from './types';
import { BACKGROUNDCOLOR, MAX, MIN, TOTALLENGTH } from './const';
import { ProthermClimateCard } from './protherm-climate-card';
import { calculatePoint } from './protherm-helpers';

export class ProthermRenderer {
  public static renderGaugeContainer(card: ProthermClimateCard, gaugeData: GaugeData): TemplateResult {
    return html`
      <div class="container">
        <div class="gauge-container">
          ${ProthermRenderer._renderGauge(gaugeData, card)}

          <div class="gauge-center">${ProthermRenderer._renderGaugeInfo(gaugeData)}</div>
        </div>
      </div>
    `;
  }

  private static _renderGauge(gaugeData: GaugeData, card: ProthermClimateCard): TemplateResult {
    const isOff = gaugeData.state === 'off';
    const isHeating = gaugeData.state === 'heat';
    const activeColor = isOff ? '#727272' : 'var(--energy-members-color, #ff9800)';
    const currentStyle = !isHeating ? '#727272;' : 'white; opacity: 0.5; shadow: 0 0 2px black;';
    const currentFactor = Math.max(0, Math.min(1, (gaugeData.currentTemp - MIN) / (MAX - MIN)));
    const targetFactor = Math.max(0, Math.min(1, (gaugeData.targetTemp - MIN) / (MAX - MIN)));
    const targetLength = targetFactor * TOTALLENGTH;
    const currentLength = currentFactor * TOTALLENGTH;
    const bridgeLength = Math.abs(targetLength - currentLength);
    const offset = Math.min(targetLength, currentLength);

    // Calculate Positions
    const currentPos = calculatePoint(gaugeData.currentTemp, MIN, MAX);
    const targetPos = calculatePoint(gaugeData.targetTemp, MIN, MAX);

    return html`
      <svg viewBox="0 0 100 100" class="gauge ${gaugeData.heatingEnabled ? '' : 'disabled'}">
        <path
          class="gauge-track-bg"
          d="M 21.716 78.284 A 40 40 0 1 1 78.284 78.284"
          style="stroke: ${BACKGROUNDCOLOR};"
          @click=${card.handleGaugeClick}
        />
        <path
          class="gauge-track ${isHeating ? 'heating' : ''}"
          d="M 21.716 78.284 A 40 40 0 1 1 78.284 78.284"
          style="stroke: ${activeColor}; stroke-dasharray: ${targetLength} ${TOTALLENGTH};"
        />
        <path
          class="gauge-bridge ${isHeating ? 'heating' : ''}"
          d="M 21.716 78.284 A 40 40 0 1 1 78.284 78.284"
          style="stroke: ${activeColor};  stroke-dasharray: ${bridgeLength} ${TOTALLENGTH}; stroke-dashoffset: -${offset};"
        />
        <circle
          class="target-marker"
          cx="${targetPos.x}"
          cy="${targetPos.y}"
          r="3.25"
          style="stroke: ${activeColor};"
        />
        <circle
          class="current-marker"
          cx="${currentPos.x}"
          cy="${currentPos.y}"
          r="1.5"
          style="fill: ${currentStyle};"
        />
      </svg>
    `;
  }

  private static _renderGaugeInfo(gaugeData: GaugeData): TemplateResult {
    return html`<div class="state-label">${gaugeData.state.toUpperCase()}</div>

      <div class="temp-display-container">
        ${ProthermRenderer._renderTempContainer(gaugeData.currentTemp, gaugeData.tempAlarm, gaugeData.pressureAlarm)}
      </div>

      <div class="target-label">
        ${ProthermRenderer._renderSchedule(gaugeData)} ${ProthermRenderer._renderTimeRemaining(gaugeData)}
        ${ProthermRenderer._renderTempFooter(gaugeData.tempAlarm, gaugeData.outsideTemp, gaugeData.returnTemp)}
      </div>`;
  }

  private static _renderTempContainer(currentTemp: number, tempAlarm: boolean, pressureAlarm: boolean): TemplateResult {
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

  private static _renderSchedule(gaugeData: GaugeData): TemplateResult {
    const progressData = gaugeData.schedule;
    const targetTemp = gaugeData.targetTemp;
    return html`<div class="label-row ${gaugeData.heatingEnabled ? '' : 'disabled'}">
        ${ProthermRenderer._renderScheduleStartEnd('start', progressData?.start)}
        <span class="target-text"> ${targetTemp}°C </span>
        ${ProthermRenderer._renderScheduleStartEnd('end', progressData?.end)}
      </div>

      ${ProthermRenderer._renderScheduleProgress(gaugeData)}`;
  }

  private static _renderScheduleStartEnd(type: 'start' | 'end', timeStr: string | undefined): TemplateResult {
    const [hours, minutes] = timeStr?.split(':') || ['00', '00'];

    return html`
      <div class="time-container ${type} ${timeStr ? '' : 'inactive'}">
        <span class="hours">${type === 'end' ? minutes : hours}</span>
        <span class="colon-align">:</span>
        <span class="minutes">${type === 'end' ? hours : minutes}</span>
      </div>
    `;
  }

  private static _renderScheduleProgress(gaugeData: GaugeData): TemplateResult {
    const progress = gaugeData.schedule?.progress;
    if (!progress) return html``;

    return html`<div class="progress-track ${gaugeData.heatingEnabled ? '' : 'disabled'}">
      <div class="progress-fill" style="width: ${progress}%"></div>
    </div>`;
  }

  private static _renderTempFooter(
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

  private static _renderTimeRemaining(gaugeData: GaugeData): TemplateResult {
    const schedule = gaugeData.schedule;
    if (!schedule || !schedule.next_trigger) return html``;

    const nextTrigger = schedule?.next_trigger || '';
    return html` <div class="time-remaining ${gaugeData.heatingEnabled ? '' : 'disabled'}">
      <div class="last-updated">${nextTrigger}</div>
    </div>`;
  }
}
