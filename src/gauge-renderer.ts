import { LitElement, html, svg, TemplateResult, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { BACKGROUNDCOLOR, MAX, MIN, RADIUS, CURRENT_MARKER_SCALE, TARGET_MARKER_SCALE, CENTERX } from './gauge-const';
import { GaugeConfig } from './gauge-types';
import { calculatePoint, getGaugeLength, renderPath } from './gauge-helpers';

@customElement('gauge-element')
export class GaugeElement extends LitElement {
  @property({ type: String }) protected state = 'ON';
  @property({ type: Boolean }) protected enabled = false;
  @property({ type: Boolean }) protected isOff = false;
  @property({ type: Boolean }) protected isActive = false;
  @property({ type: Number }) protected targetValue = 24;
  @property({ type: Number }) protected currentValue = 18;
  @property({ type: Number }) protected min = MIN;
  @property({ type: Number }) protected max = MAX;
  @property({ type: Number }) protected radius = RADIUS;
  @property({ type: Number }) protected strokeWidth = 8;

  protected render(): TemplateResult | void {
    const gaugeData: GaugeConfig = {
      state: this.state,
      enabled: this.enabled,
      isOff: this.isOff,
      isBridgeActive: false,
      isTrackActive: false,
      targetValue: this.targetValue,
      currentValue: this.currentValue,
      gaugeLength: this.max,
    };

    return this.renderContainer(gaugeData);
  }

  protected renderContainer(gaugeData: GaugeConfig): TemplateResult {
    return html`
      <div class="container">
        <div class="gauge-container">${this._renderGauge(gaugeData)}</div>

        <div class="gauge-center">${this.renderInfo(gaugeData)}</div>
      </div>
    `;
  }

  protected renderInfo(gaugeData: GaugeConfig): TemplateResult {
    return html`<div class="state-label">${gaugeData.state.toUpperCase()}</div>`;
  }

  protected showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      //origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  private _renderGauge(gaugeData: GaugeConfig): TemplateResult {
    const activeColor = gaugeData.isOff ? '#727272' : 'var(--energy-members-color, #ff9800)';
    const currentStyle =
      !gaugeData.isBridgeActive && !gaugeData.isTrackActive ? '#727272;' : 'red; opacity: 0.5; shadow: 0 0 2px black;';
    const currentFactor = Math.max(0, Math.min(1, (gaugeData.currentValue - this.min) / (this.max - this.min)));
    const targetFactor = Math.max(0, Math.min(1, (gaugeData.targetValue - this.min) / (this.max - this.min)));
    const totalLength = getGaugeLength(this.radius);
    const targetLength = targetFactor * totalLength;
    const currentLength = currentFactor * totalLength;
    const bridgeLength = Math.abs(targetLength - currentLength);
    const offset = Math.min(targetLength, currentLength);

    // Calculate Positions
    const currentPos = calculatePoint(gaugeData.currentValue, this.min, this.max, this.radius);
    const currentMarkerRadius = this.strokeWidth * CURRENT_MARKER_SCALE;
    const targetPos = calculatePoint(gaugeData.targetValue, this.min, this.max, this.radius);
    const targetMarkerRadius = this.strokeWidth * TARGET_MARKER_SCALE;
    const gaugePath = renderPath(this.radius);
    const padding = this.strokeWidth * 2;
    const minCoord = CENTERX - this.radius - padding;
    const size = (this.radius + padding) * 2;

    return html`
      <svg viewBox="${minCoord} ${minCoord} ${size} ${size}" class="gauge ${gaugeData.enabled ? '' : 'disabled'}">
        ${this._renderBackground(gaugePath)}
        ${this._renderTrack(
          `gauge-track ${gaugeData.isTrackActive ? 'activeGauge' : ''}`,
          gaugePath,
          activeColor,
          `${targetLength} ${totalLength}`,
        )}
        ${this._renderTrack(
          `gauge-bridge ${gaugeData.isBridgeActive ? 'activeGauge' : ''}`,
          gaugePath,
          activeColor,
          `${bridgeLength} ${totalLength}`,
          `-${offset}`,
        )}
        ${this._renderMarker(
          'target-marker',
          targetPos.x,
          targetPos.y,
          targetMarkerRadius,
          `stroke: ${activeColor}; stroke-width: ${Math.max(1, this.strokeWidth * 0.15)}`,
        )}
        ${this._renderMarker(
          'current-marker',
          currentPos.x,
          currentPos.y,
          currentMarkerRadius,
          `fill: ${currentStyle}`,
        )}
      </svg>
    `;
  }

  private _renderBackground(path: string): TemplateResult {
    return svg` <path
      class="gauge-track-bg"
      d="${path}"
      style="stroke: ${BACKGROUNDCOLOR}; stroke-width: ${this.strokeWidth}"
    />`;
  }

  private _renderTrack(
    className: string,
    path: string,
    strokeColor: string,
    dashArray: string,
    dashOffset?: string,
  ): TemplateResult {
    const offsetStyle = dashOffset ? `stroke-dashoffset: ${dashOffset};` : '';
    return svg` <path
      class="${className}"
      d="${path}"
      style="stroke: ${strokeColor}; stroke-width: ${this.strokeWidth}; stroke-dasharray: ${dashArray}; ${offsetStyle}"
    />`;
  }

  private _renderMarker(className: string, cx: number, cy: number, radius: number, style: string): TemplateResult {
    return svg`<circle
      class="${className}"
      cx="${cx}"
      cy="${cy}"
      r="${radius.toFixed(2)}"
      style="${style}"
    />`;
  }

  static get styles(): CSSResultGroup {
    return css`
      /* ───────────────────── Gauge styles ───────────────────── */
      .container {
        padding: 24px;
        text-align: center;
        transition: all 0.4s ease;
      }
      .container.disabled {
        opacity: 0.4;
        filter: grayscale(100%);
        pointer-events: none; /* Prevents clicking the gauge when off */
        transition: all 0.4s ease;
      }
      .state-off {
        opacity: 0.6;
      }

      .header-controls {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 10;
      }

      .power-button {
        cursor: pointer;
        transition: color 0.3s ease;
      }

      /* Color when heating is ON */
      .power-button.on {
        color: var(--success-color, #4caf50);
        /* Optional: add a subtle glow */
        filter: drop-shadow(0 0 3px var(--primary-color));
      }

      /* Color when heating is OFF */
      .power-button.off {
        color: var(--error-color, #f44336);
      }

      ha-icon-button {
        --switch-checked-button-color: var(--primary-color);
        --switch-checked-track-color: var(--primary-color);
      }

      .gauge-container {
        position: relative;
        width: 100%;
        max-width: 280px;
        margin: 0 auto;
        /* Define this as a container context so children can scale relative to its width */
        container-type: inline-size;
      }

      .activeGauge {
        visibility: visible !important;
      }

      .gauge {
        fill: none;
        stroke-linecap: round;
        overflow: visible;
      }

      .gauge.disabled {
        opacity: 0.4;
        filter: grayscale(100%);
        pointer-events: none;
        transition: all 0.4s ease;
      }

      .gauge-track-bg {
        fill: none;
        opacity: 1;
      }

      .gauge-track {
        fill: none;
        stroke-linecap: round;
        transition: stroke-dasharray 0.5s ease;
        opacity: 0.5;
        visibility: hidden;
      }

      .gauge-bridge {
        fill: none;
        stroke-linecap: round;
        opacity: 1;
        transition: stroke-dasharray 0.5s ease;
        visibility: hidden;
      }

      .target-marker {
        fill: var(--ha-card-background, var(--card-background-color, white));
        stroke-width: 1;
      }

      .current-marker {
        transition: all 0.3s ease;
      }
      /* ───────────────────── Info styles ───────────────────── */
      .gauge-center {
        position: absolute;
        top: 50%;
        left: 50%;
        /* Adjusted from -85% to -45% to prevent the text stacking too high on narrow viewports */
        transform: translate(-50%, -45%);
        width: 100%;
        margin-top: 0px; /* Removed fixed margin in favor of proportional translate placement */
        pointer-events: none;
      }

      .state-label {
        /* Clamp: Min ~10px, Scales at 4cqw, Maxes out at 0.8rem (~13px) */
        font-size: clamp(10px, 4cqw, 0.8rem);
        color: var(--secondary-text-color);
        letter-spacing: 2px;
      }
    `;
  }
}
