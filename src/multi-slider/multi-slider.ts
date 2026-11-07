import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fireEvent } from 'custom-card-helpers';
import { MIN_TEMPERATURE, MAX_TEMPERATURE, COMFORT_TEMPERATURE, IDX_MIN, IDX_MAX, IDX_COMFORT } from './const';
import { MultiSliderConfig } from './types';
import { LitElementEx } from '../lit-element-ex';

@customElement('multi-slider')
export class ProthermMultiSlider extends LitElementEx {
  @property({ attribute: false }) config!: MultiSliderConfig;
  @property({ type: Number }) public minLimit: number = MIN_TEMPERATURE;
  @property({ type: Number }) public maxLimit: number = MAX_TEMPERATURE;

  @state() private _activeIndex: number | null = null;

  protected override render() {
    const enabled =
      this.config.min_temperature_entity &&
      this.config.comfort_temperature_entity &&
      this.config.max_temperature_entity;

    const min = this._getConfigValue('min', MIN_TEMPERATURE);
    const comfort = this._getConfigValue('comfort', COMFORT_TEMPERATURE);
    const max = this._getConfigValue('max', MAX_TEMPERATURE);

    const pointers = [
      { value: min, pos: this._valueToPercent(min) },
      { value: comfort, pos: this._valueToPercent(comfort) },
      { value: max, pos: this._valueToPercent(max) },
    ];

    return html`
      <div class="slider-container${!enabled ? ' disabled' : ''}">
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
              <div class="slider-label">${slider.value.toFixed(1)} °C</div>
              <div class="slider-pointer"></div>
            </div>
          `,
        )}
      </div>
    `;
  }

  private _valueToPercent(val: number): number {
    return ((val - this.minLimit) / (this.maxLimit - this.minLimit)) * 100;
  }

  private _percentToValue(percent: number): number {
    const raw = this.minLimit + (percent / 100) * (this.maxLimit - this.minLimit);
    return Math.round(raw * 2) / 2;
  }

  private _setValue(idx: number, newValue: number) {
    let valKey = '';
    switch (idx) {
      case IDX_MIN:
        valKey = 'min';
        break;
      case IDX_MAX:
        valKey = 'max';
        break;
      case IDX_COMFORT:
        valKey = 'comfort';
        break;
      default:
        break;
    }
    if (valKey.length) {
      this.config = {
        ...this.config,
        [`${valKey}_temperature`]: newValue,
      };
      fireEvent(this, 'config-changed', { config: this.config });
    }
  }

  private _getConfigValue(valKey: 'min' | 'comfort' | 'max', fallback: number): number {
    return this.config?.[`${valKey}_temperature`] ?? fallback;
  }

  private _onPointerDown(index: number, e: PointerEvent) {
    e.preventDefault();
    this._activeIndex = index;
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  private _onPointerMove = (e: PointerEvent) => {
    if (this._activeIndex === null) {
      console.warn('_onPointerDown: Pointer move event received but no active index is set.');
      return;
    }

    const container = this.shadowRoot?.querySelector('.slider-container');
    if (!container) {
      console.warn('_onPointerDown: slider-container not found');
      return;
    }

    const rect = container.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (offsetX / rect.width) * 100;
    let newValue = this._percentToValue(percent);
    let entityId = undefined;

    switch (this._activeIndex) {
      case IDX_MIN: {
        const comfort = this._getConfigValue('comfort', COMFORT_TEMPERATURE);
        newValue = Math.max(this.minLimit, Math.min(newValue, comfort));
        entityId = this.config?.min_temperature_entity;
        break;
      }
      case IDX_COMFORT: {
        const min = this._getConfigValue('min', MIN_TEMPERATURE);
        const max = this._getConfigValue('max', MAX_TEMPERATURE);
        newValue = Math.max(min, Math.min(newValue, max));
        entityId = this.config?.comfort_temperature_entity;
        break;
      }
      case IDX_MAX: {
        const comfort = this._getConfigValue('comfort', COMFORT_TEMPERATURE);
        newValue = Math.max(comfort, Math.min(newValue, this.maxLimit));
        entityId = this.config?.max_temperature_entity;
        break;
      }
      default:
        break;
    }
    if (entityId) {
      this._setValue(this._activeIndex, newValue);
      this._setEntityState(entityId, newValue);
      this.requestUpdate();
    }
  };

  private _onPointerUp = () => {
    this._activeIndex = null;
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  };

  private _setEntityState(entityId?: string, state?: number): void {
    this.callService(entityId, state?.toString());
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
      .slider-container.disabled {
        opacity: 0.45;
        pointer-events: none;
        cursor: not-allowed;
        filter: grayscale(80%);
      }
      .slider-track,
      .slider-range-fill {
        position: absolute;
        top: 42px;
        height: 6px;
        border-radius: 3px;
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
