import { html, TemplateResult } from 'lit';
import { HassEntity } from 'home-assistant-js-websocket';
import { HomeAssistant } from 'custom-card-helpers';

export class ProthermRenderer {
  public static renderGauge(stateObj: HassEntity, hass: HomeAssistant): TemplateResult {
    const state = stateObj.state;
    //const currentTemp = stateObj.attributes.current_temperature || 0;
    //const targetTemp = stateObj.attributes.temperature || 0;
    const currentTemp = (hass.states['input_number.current_temp']?.state as unknown as number) || 0;
    const targetTemp = (hass.states['input_number.target_temp']?.state as unknown as number) || 0;
    const currentTempParts = currentTemp.toString().split('.');

    // Change 'sensor.ebusd_return_temp' to your actual sensor name
    const returnTemp = (hass.states['input_number.return_temp']?.state as unknown as number) || 0;

    // Grey-out logic for 'off' state
    const isOff = state === 'off';
    //const isHeating = state === 'auto';
    const isHeating = state === 'heat';

    // Configuration for the gauge range
    const min = 10;
    const max = 35;
    // The total length of a 270-degree arc with radius 40 is ~188.5
    const totalLength = 188.5;

    // Calculate percentage for the active track (0 to 1)
    const currentFactor = Math.max(0, Math.min(1, (currentTemp - min) / (max - min)));
    const targetFactor = Math.max(0, Math.min(1, (targetTemp - min) / (max - min)));
    const targetLength = targetFactor * totalLength;
    const currentLength = currentFactor * totalLength;
    const bridgeLength = Math.abs(targetLength - currentLength);
    const offset = Math.min(targetLength, currentLength);

    // Calculate Positions
    const currentPos = this._calculatePoint(currentTemp, min, max);
    const targetPos = this._calculatePoint(targetTemp, min, max);

    // Colors based on your request
    const trackColor = isHeating ? '#727272' : 'var(--energy-members-color, #ff9800)';
    const thumbColor = isOff ? '#727272' : 'var(--primary-text-color)';
    // Track color (Grey) vs Active color (Orange/Theme)
    const activeColor = isOff ? '#727272' : 'var(--energy-members-color, #ff9800)';
    const currentStyle = !isHeating ? '#727272;' : 'white; opacity: 0.5; shadow: 0 0 2px black;';
    const backgroundColor = '#ebebeb';

    return html`
      <ha-card>
        <div class="container">
          <div class="gauge-container">
            <svg viewBox="0 0 100 100" class="gauge">
              <path
                class="gauge-track-bg"
                d="M 21.716 78.284 A 40 40 0 1 1 78.284 78.284"
                style="stroke: ${backgroundColor};"
              />
              <path
                class="gauge-track ${isHeating ? 'heating' : ''}"
                d="M 21.716 78.284 A 40 40 0 1 1 78.284 78.284"
                style="stroke: ${activeColor}; stroke-dasharray: ${targetLength} ${totalLength};"
              />
              <path
                class="gauge-bridge ${isHeating ? 'heating' : ''}"
                d="M 21.716 78.284 A 40 40 0 1 1 78.284 78.284"
                style="stroke: ${activeColor};  stroke-dasharray: ${bridgeLength} ${totalLength}; stroke-dashoffset: -${offset};"
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

            <div class="gauge-center">
              <div class="state-label">${state.toUpperCase()}</div>
              <div class="main-temp">
                <p class="value">
                  <span>${currentTempParts[0]}</span>
                  <span class="addon">
                    <span class="decimal">.${currentTempParts[1] || '0'}</span>
                    <span class="unit">°C</span>
                  </span>
                </p>
              </div>
              <div class="target-label">${targetTemp} °C -> ${ProthermRenderer._renderTargetAction(stateObj)}</div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
    /*
    <div class="main-temp">${currentTempParts[0]}<span class="decimal-container">
      <span class="decimal">.${currentTempParts[1] || '0'}</span><span class="unit">°C</span></span
    >
    <!--div class="stats-grid">
            <div class="stat">
              <span class="label">Target</span>
              <span class="value">${targetTemp}°C</span>
            </div>
            <div class="stat">
              <span class="label">Boiler Return</span>
              <span class="value">${returnTemp}°C</span>
            </div>
          </div>

          <div class="controls">
            <ha-icon-button .path="${'M19,13H5V11H19V13Z'}" @click="${() => this._setTemp(-0.5)}"></ha-icon-button>
            <ha-icon-button .path="${'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z'}" @click="${() => this._setTemp(0.5)}"></ha-icon-button>
          </div-->
    */
  }

  private static _calculatePoint(temp: number, min: number, max: number) {
    const radius = 40; // Must match the 'A 40 40' in the SVG path
    const centerX = 50;
    const centerY = 50;
    const startAngle = 135; // Start of the 3/4 circle
    const totalAngle = 270; // 3/4 of 360

    // Clamp temp so markers don't fly off the track
    const safeTemp = Math.max(min, Math.min(max, temp));
    const factor = (safeTemp - min) / (max - min);

    const angleDeg = startAngle + factor * totalAngle;
    const angleRad = (angleDeg * Math.PI) / 180;

    return {
      x: centerX + radius * Math.cos(angleRad),
      y: centerY + radius * Math.sin(angleRad),
    };
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
}
