import { LitElement, html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fireEvent } from 'custom-card-helpers';
import { MIN_TEMPERATURE, MAX_TEMPERATURE, COMFORT_TEMPERATURE, IDX_MIN, IDX_MAX } from './const';
import { ProthermClimateCardConfig } from '../types';

@customElement('multi-slider')
export class ProthermMultiSlider extends LitElement {
  @property({ attribute: false }) config!: ProthermClimateCardConfig;

  private minLimit = MIN_TEMPERATURE;
  private maxLimit = MAX_TEMPERATURE;

  @state() private _activeIndex: number | null = null;

  private _valueToPercent(val: number): number {
    return ((val - MIN_TEMPERATURE) / (MAX_TEMPERATURE - MIN_TEMPERATURE)) * 100;
  }

  private _percentToValue(percent: number): number {
    const raw = MIN_TEMPERATURE + (percent / 100) * (MAX_TEMPERATURE - MIN_TEMPERATURE);
    return Math.round(raw * 2) / 2;
  }

  private _onPointerDown(index: number, e: PointerEvent) {
    e.preventDefault();
    this._activeIndex = index;

    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  private _onPointerMove = (e: PointerEvent) => {
    if (this._activeIndex === null) {
      console.warn('Pointer move event received but no active index is set.');
      return;
    }

    const container = this.shadowRoot?.querySelector('.slider-container');
    if (!container) {
      console.warn('slider-container not found');
      return;
    }

    const rect = container.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (offsetX / rect.width) * 100;
    const min = this.config?.min_temperature ?? MIN_TEMPERATURE;
    const comfort = this.config?.comfort_temperature ?? COMFORT_TEMPERATURE;
    const max = this.config?.max_temperature ?? MAX_TEMPERATURE;
    let newValue = this._percentToValue(percent);
    let configValue = '';

    // Enforce strict hierarchical boundaries (min <= comfort <= max)
    switch (this._activeIndex) {
      case 0:
        configValue = 'min_temperature';
        newValue = Math.max(MIN_TEMPERATURE, Math.min(newValue, comfort));
        break;
      case 1:
        configValue = 'comfort_temperature';
        newValue = Math.max(min, Math.min(newValue, max));
        break;
      case 2:
        configValue = 'max_temperature';
        newValue = Math.max(comfort, Math.min(newValue, MAX_TEMPERATURE));
        break;
      default:
        break;
    }
    // checks is empty string
    if (configValue?.length) {
      //console.log(`_onPointerMove: configValue ${configValue} min ${min}, comfort ${comfort}, max ${max}`);
      this.config = {
        ...this.config,
        [configValue]: newValue,
      };

      fireEvent(this, 'config-changed', { config: this.config });
      this.requestUpdate();
    }
  };

  private _onPointerUp = () => {
    this._activeIndex = null;
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  };

  protected override firstUpdated(): void {
    if (!this.config) {
      throw new Error('Config not initialized');
    }
  }

  protected override render() {
    const min = this.config?.min_temperature ?? MIN_TEMPERATURE;
    const comfort = this.config?.comfort_temperature ?? COMFORT_TEMPERATURE;
    const max = this.config?.max_temperature ?? MAX_TEMPERATURE;

    const pointers = [
      { value: min, pos: this._valueToPercent(min) },
      { value: comfort, pos: this._valueToPercent(comfort) },
      { value: max, pos: this._valueToPercent(max) },
    ];

    //console.log(`render: left: ${min}%; width: ${max - min}%`);
    //console.log(`render: min pointer: ${JSON.stringify(pointers[0])}`);
    return html`
      <div class="slider-container">
        <div class="slider-track"></div>

        <div
          class="slider-range-fill"
          style="left: ${pointers[IDX_MIN].pos}%; right: ${100 - pointers[IDX_MAX].pos}%"
        ></div>

        ${pointers.map(
          (slider, index) => html`
            <div
              class="slider-handle"
              style="left: ${slider.pos}%"
              @pointerdown="${(e: PointerEvent) => this._onPointerDown(index, e)}"
            >
              <div class="slider-label">${slider.value.toFixed(1)}°C</div>
              <div class="slider-pointer"></div>
            </div>
          `,
        )}
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .slider-container {
        position: relative;
        width: 100%;
        height: 60px;
        margin-top: 20px;
        touch-action: none;
      }
      .slider-track,
      .slider-range-fill {
        position: absolute;
        top: 42px;
        height: 6px;
        border-radius: 3px;
        background-color: #00d2ff; /* Brighter electric cyan-blue */
        box-shadow: 0 0 6px rgba(0, 210, 255, 0.8); /* Makes it pop against both blue and red gradient areas */
        z-index: 1;
        pointer-events: none;
      }
      .slider-track {
        left: 0;
        width: 100%;
        background: linear-gradient(to right, #0066cc, #ff3300);
        z-index: 0;
      }
      .slider-range-fill {
        background-color: #0066cc;
        z-index: 1;
        pointer-events: none;
      }
      .slider-handle {
        position: absolute;
        top: 45px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        z-index: 2;
        cursor: pointer;
        touch-action: none;
      }
      .slider-pointer {
        position: absolute;
        top: 0;
        left: 0;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: var(--primary-color, #0066cc);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .slider-label {
        position: absolute;
        bottom: 14px;
        left: 0;
        transform: translateX(-50%);
        font-size: 10px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        color: var(--primary-text-color, #333);
        background: var(--card-background-color, #fff);
        padding: 1px 4px;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }
      .slider-handle:hover .slider-pointer {
        transform: translate(-50%, -50%) scale(1.15);
      }
    `;
  }
}
