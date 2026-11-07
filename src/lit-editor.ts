import { html, TemplateResult, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { fireEvent } from 'custom-card-helpers';

import type { BaseCardConfig } from './types';
import { LitElementEx } from './lit-element-ex';

export class LitEditor extends LitElementEx {
  @property({ attribute: false }) config!: BaseCardConfig;

  protected configValueTarget(ev: Event):
    | (EventTarget & {
        configValue?: keyof BaseCardConfig;
        value?: string;
        type?: string;
        checked?: boolean;
      })
    | null {
    return ev.target as EventTarget & {
      configValue?: keyof BaseCardConfig;
      value?: string;
      type?: string;
      checked?: boolean;
    };
  }

  protected valueChanged(ev: Event): void {
    if (!this.config || !this.hass) {
      console.error(`valueChanged: No config / hass object`);
      return;
    }
    const target = this.configValueTarget(ev);
    if (!target?.configValue) {
      console.error(`valueChanged: No configValue`);
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
    required: 'true' | 'false' = 'false',
    setHass: boolean = false,
    onChange: (ev: Event) => void = this.valueChanged,
  ): TemplateResult {
    const hassAttr = setHass ? this.hass : nothing;

    return html`
      <ha-select
        .hass=${hassAttr}
        .label=${label}
        .value=${this.config?.[key] || ''}
        .configValue=${key}
        required=${required}
        @change=${onChange}
        @closed=${(ev: Event) => ev.stopPropagation()}
      >
        ${entities.map((entity) => html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`)}
      </ha-select>
    `;
  }
}
