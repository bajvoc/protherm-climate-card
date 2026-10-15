import { html, TemplateResult, css, CSSResultGroup } from 'lit';
import { property } from 'lit/decorators.js';
import { fireEvent } from 'custom-card-helpers';

import type { ProthermClimateCardConfig } from './types';
import { LitElementEx } from './lit-element-ex';

export class LitEditor extends LitElementEx {
  @property({ attribute: false }) config!: ProthermClimateCardConfig;

  protected override firstUpdated(): void {
    super.firstUpdated();
    if (!this.config) {
      throw new Error('Config not initialized');
    }
  }

  protected configValueTarget(ev: Event):
    | (EventTarget & {
        configValue?: keyof ProthermClimateCardConfig;
        value?: string;
        type?: string;
        checked?: boolean;
      })
    | null {
    return ev.target as EventTarget & {
      configValue?: keyof ProthermClimateCardConfig;
      value?: string;
      type?: string;
      checked?: boolean;
    };
  }

  protected valueChanged(ev: Event): void {
    if (!this.config || !this.hass) {
      return;
    }
    const target = this.configValueTarget(ev);
    if (!target?.configValue) {
      return;
    }

    const newValue = target.checked !== undefined ? target.checked : target.value;
    if (this.config[target.configValue] === newValue) {
      return;
    }

    if (target.value === '') {
      const tmpConfig = { ...this.config };
      delete tmpConfig[target.configValue];
      this.config = tmpConfig;
    } else {
      this.config = {
        ...this.config,
        [target.configValue]: newValue,
      };
    }

    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }

  protected renderSelect(
    label: string,
    key: string,
    entities: string[],
    onChange: (ev: Event) => void = this.valueChanged,
  ): TemplateResult {
    return html`
      <ha-select
        .label=${label}
        .value=${this.config?.[key] || ''}
        .configValue=${key}
        @change=${onChange}
        @closed=${(ev: Event) => ev.stopPropagation()}
      >
        ${entities.map((entity) => html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`)}
      </ha-select>
    `;
  }
}
