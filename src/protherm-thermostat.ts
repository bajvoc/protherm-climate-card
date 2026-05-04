import { html, TemplateResult } from 'lit';
import { HassEntity } from 'home-assistant-js-websocket';
import { HomeAssistant } from 'custom-card-helpers';
import { BACKGROUNDCOLOR, CENTERX, CENTERY, MAX, MIN, RADIUS, STARTANGLE, TOTALANGLE, TOTALLENGTH } from './const';

export class ProthermRenderer {
  public static renderGauge(stateObj: HassEntity, hass: HomeAssistant): TemplateResult {
    return html`
      <ha-card>
          <div class="container">
            <div class="gauge-container"> 
                ${ProthermRenderer._renderGauge(stateObj, hass)}

              <div class="gauge-center">
                ${ProthermRenderer._renderGaugeInfo(stateObj, hass)}
              </div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  private static _renderGauge(stateObj: HassEntity, hass: HomeAssistant): TemplateResult {
    //const stateObject = hass.states[config.climate];
    const state = stateObj.state;
    const isOff = state === 'off';
    //const isHeating = state === 'auto';
    const isHeating = state === 'heat';

    const activeColor = isOff ? '#727272' : 'var(--energy-members-color, #ff9800)';
    const currentStyle = !isHeating ? '#727272;' : 'white; opacity: 0.5; shadow: 0 0 2px black;';

    //const currentTemp = stateObj.attributes.current_temperature.value;
    //const targetTemp = stateObj.attributes.target_temperature.value;
    const currentTemp = (hass.states['input_number.current_temp']?.state as unknown as number) || 0;
    const targetTemp = (hass.states['input_number.target_temp']?.state as unknown as number) || 0;

    const currentFactor = Math.max(0, Math.min(1, (currentTemp - MIN) / (MAX - MIN)));
    const targetFactor = Math.max(0, Math.min(1, (targetTemp - MIN) / (MAX - MIN)));
    const targetLength = targetFactor * TOTALLENGTH;
    const currentLength = currentFactor * TOTALLENGTH;
    const bridgeLength = Math.abs(targetLength - currentLength);
    const offset = Math.min(targetLength, currentLength);

    // Calculate Positions
    const currentPos = ProthermRenderer._calculatePoint(currentTemp, MIN, MAX);
    const targetPos = ProthermRenderer._calculatePoint(targetTemp, MIN, MAX);

    return html`
      <svg viewBox="0 0 100 100" class="gauge">
        <path
          class="gauge-track-bg"
          d="M 21.716 78.284 A 40 40 0 1 1 78.284 78.284"
          style="stroke: ${BACKGROUNDCOLOR};"
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

  private static _renderGaugeInfo(stateObj: HassEntity, hass: HomeAssistant): TemplateResult {
    //const stateObject = hass.states[config.climate];
    const state = stateObj.state;

    return html`<div class="state-label">${state.toUpperCase()}</div>

      <div class="temp-display-container">${ProthermRenderer._renderTempContainer(stateObj, hass)}</div>

      <div class="target-label">
        ${ProthermRenderer._renderSchedule(stateObj, hass)} ${ProthermRenderer._renderTempFooter(stateObj, hass)}
      </div>`;
  }

  private static _renderTempContainer(stateObj: HassEntity, hass: HomeAssistant): TemplateResult {
    //const stateObject = hass.states[config.climate];
    //const currentTemp = stateObj.attributes.current_temperature.value;
    const currentTemp = (hass.states['input_number.current_temp']?.state as unknown as number) || 0;
    const currentTempParts = currentTemp.toString().split('.');
    const tempAlarm = hass.states['binary_sensor.return_temperature_alarm']?.state === 'on';
    const pressureAlarm = hass.states['binary_sensor.water_pressure_alarm']?.state === 'on';

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

  private static _renderSchedule(stateObj: HassEntity, hass: HomeAssistant): TemplateResult {
    const schedule = hass.states['switch.schedule_spring_and_autumn'];
    //const stateObject = hass.states[config.climate];
    //const targetTemp = stateObj.attributes.target_temperature.value;
    //const progressData = ProthermRenderer._calculateprogressPercentage(schedule);
    const targetTemp = (hass.states['input_number.target_temp']?.state as unknown as number) || 0;
    const progressData = ProthermRenderer._mock_calculateprogressPercentage();
    const startParts = progressData.start.split(':');
    const endParts = progressData.end.split(':');

    return html`<div class="label-row">
        <div class="time-container start">
          <span class="hours">${startParts[0]}</span>
          <span class="colon-align">:</span>
          <span class="minutes">${startParts[1]}</span>
        </div>

        <span class="target-text"> ${targetTemp}°C </span>

        <!-- End time: Minutes/Colon at edge, Hour hangs right -->
        <div class="time-container end">
          <span class="minutes">${endParts[0]}</span>
          <span class="colon-align">:</span>
          <span class="hours">${endParts[1]}</span>
        </div>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width: ${progressData.progress}%"></div>
      </div>`;
  }

  private static _renderTempFooter(stateObj: HassEntity, hass: HomeAssistant): TemplateResult {
    const tempAlarm = hass.states['binary_sensor.return_temperature_alarm']?.state === 'on';
    const outsideTemp = hass.states['sensor.ebusd_broadcast_outsidetemp']?.state;
    const returnTemp = hass.states['sensor.ebusd_bai_status01_temp_1']?.state;

    return html`<div class="temp-footer">
      <span class="footer-temp return ${tempAlarm ? 'active' : ''}"> ${returnTemp}°C </span>
      <span class="footer-temp outside"> ${outsideTemp}°C </span>
    </div>`;
  }

  private static _calculatePoint(temp: number, min: number, max: number) {
    // Clamp temp so markers don't fly off the track
    const safeTemp = Math.max(min, Math.min(max, temp));
    const factor = (safeTemp - min) / (max - min);

    const angleDeg = STARTANGLE + factor * TOTALANGLE;
    const angleRad = (angleDeg * Math.PI) / 180;

    return {
      x: CENTERX + RADIUS * Math.cos(angleRad),
      y: CENTERY + RADIUS * Math.sin(angleRad),
    };
  }

  private static _mock_calculateprogressPercentage(): {
    progress: number;
    start: string;
    end: string;
  } {
    return { progress: 20, start: '13:00', end: '18:00' };
  }

  private static _calculateprogressPercentage(currentSchedule: HassEntity): {
    progress: number;
    start: string;
    end: string;
  } {
    if (!currentSchedule || !currentSchedule.attributes) return { progress: 0, start: '', end: '' };

    const timeSlot = currentSchedule.attributes.timeslots[currentSchedule.attributes.current_slot];
    const [startStr, endStr] = timeSlot.split(' - ').map((t: string) => t.substring(0, 5));

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const windowStart = ProthermRenderer._getMinutes(startStr);
    const windowEnd = ProthermRenderer._getMinutes(endStr === '00:00' ? '24:00' : endStr);
    const totalDuration = windowEnd - windowStart;
    const elapsed = currentTime - windowStart;

    // Ensure percentage is between 0 and 100
    let progressPercentage = (elapsed / totalDuration) * 100;
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));

    return { progress: progressPercentage, start: startStr, end: endStr };
  }

  private static _toTimeRemaining(timeStr: string | undefined): string {
    if (!timeStr) return '';

    // Parse the ISO string to a Date object and get seconds from now
    const target = new Date(timeStr).getTime();
    const now = new Date().getTime();
    const seconds = Math.floor((target - now) / 1000);

    if (seconds <= 0) return 'now';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    // Formats to: "1h 30m" or just "30m" if hours are 0
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  }

  private static _toShortTime(timeStr: string | undefined): string {
    if (!timeStr) return '';

    // The time "HH:MM" starts at index 11 and ends at 16
    // "2026-04-29T20:30:00+02:00" -> "20:30"
    return timeStr.slice(11, 16);
  }

  private static _renderTargetAction(stateObj: HassEntity): string {
    //const attributes = stateObj.attributes || '';
    const attributes = { next_trigger: '2026-04-29T23:30:00+02:00' };

    if (!attributes) return '';

    const nextAction = ProthermRenderer._toShortTime(attributes.next_trigger);
    //const temperature = attributes.actions[attributes.current_slot].data.temperature;

    return nextAction;
  }

  private static _getMinutes(str: string): number {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  }
}
