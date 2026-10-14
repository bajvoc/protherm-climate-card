import { LitElement, html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fireEvent } from 'custom-card-helpers';
import { MIN_TEMPERATURE, MAX_TEMPERATURE, COMFORT_TEMPERATURE } from './const';
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

    return html`
      <div class="slider-container">
        <div class="slider-track"></div>
        ${pointers.map(
          (slider, index) => html`
            <div
              class="slider-pointer"
              style="left: ${slider.pos}%"
              @pointerdown="${(e: PointerEvent) => this._onPointerDown(index, e)}"
            ></div>
          `,
        )}
      </div>
      <div class="result-container">
        <div>Min: ${min}°C</div>
        <div>Comfort: ${comfort}°C</div>
        <div>Max: ${max}°C</div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .slider-container {
        position: relative;
        width: 100%;
        height: 40px;
        background-color: transparent;
        cursor: pointer;
        touch-action: none;
      }
      .slider-track {
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        height: 6px;
        transform: translateY(-50%);
        background-color: var(--secondary-background-color, #ddd);
        border-radius: 3px;
      }
      .slider-pointer {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background-color: var(--primary-color, #0066cc);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        z-index: 2;
      }
      .slider-pointer:hover {
        transform: translate(-50%, -50%) scale(1.1);
      }
      .result-container {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 12px;
      }
    `;
  }
}
