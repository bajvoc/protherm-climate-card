import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { HassEntity } from 'home-assistant-js-websocket';
import {
  HomeAssistant, // The main hass object — passed down from HA on every state change
} from 'custom-card-helpers'; // Community-maintained helpers: https://github.com/custom-cards/custom-card-helpers

export class LitElementEx extends LitElement {
  // `hass` is set by HA on every state change anywhere in the system.
  // `attribute: false` means it is set as a JS property, not an HTML attribute
  // (the object is too large to serialize as an attribute).
  // Lit will schedule a re-render whenever this property reference changes.
  @property({ attribute: false }) public hass!: HomeAssistant;

  /*protected override firstUpdated(): void {
    if (!this.hass) {
      throw new Error('HomeAssistant not initialized');
    }
  }*/

  protected getEntity(entityId?: string): HassEntity | undefined {
    let entity = undefined;
    if (entityId) {
      entity = this.hass.states[entityId];
    }
    return entity;
  }

  protected getEntityState<T = string>(entityId?: string, defaultValue?: T): T {
    let retVal = (defaultValue ?? '') as unknown as T;
    const entity = this.getEntity(entityId);
    if (entity) {
      const state = entity.state;

      if (state != null && !['unavailable', 'unknown'].includes(state)) {
        switch (typeof defaultValue) {
          case 'number': {
            const parsed = parseFloat(state);
            retVal = (isNaN(parsed) ? defaultValue : parsed) as unknown as T;
            break;
          }
          case 'boolean': {
            retVal = (state === 'on' || state === 'true') as unknown as T;
            break;
          }
          case 'string': {
            retVal = state as unknown as T;
            break;
          }
          case 'object': {
            if (defaultValue instanceof Date) {
              const parsedDate = new Date(state);
              retVal = (isNaN(parsedDate.getTime()) ? defaultValue : parsedDate) as unknown as T;
            } else {
              // Handle JSON strings (e.g., attributes or list states)
              try {
                retVal = JSON.parse(state) as unknown as T;
              } catch {
                retVal = defaultValue; // Fallback if parsing fails
              }
            }
            break;
          }
          default:
            console.warn(`Unhandled type ${typeof defaultValue}`);
            retVal = state as unknown as T;
            break;
        }
        //console.log(`getEntityState: entityId: ${entityId}, retVal: ${retVal}`);
      }
    }
    return retVal;
  }

  protected callService(entityId?: string, newState?: string): void {
    if (entityId) {
      const stateObj = this.getEntity(entityId);

      if (stateObj) {
        let service = 'more_info';
        let serviceData: Record<string, unknown> = { entity_id: entityId };
        const state = stateObj.state;
        const domain = stateObj.entity_id.split('.')[0];

        switch (domain) {
          case 'light':
          case 'switch':
          case 'fan':
            service = 'toggle';
            break;
          case 'cover':
            service = state === 'open' ? 'close_cover' : 'open_cover';
            break;
          case 'lock':
            service = state === 'locked' ? 'unlock' : 'lock';
            break;
          case 'input_number':
            service = 'set_value';
            serviceData = { entity_id: entityId, value: newState };
            break;
          default:
            console.warn(`callService: Unhandled domain ${domain}`);
            break;
        }

        if (service !== 'more_info') {
          this._callService(domain, service, serviceData);
        } else {
          this.showMoreInfo(entityId);
        }
      } else {
        console.warn('callService: serviceData not provided, or entityId not found in HA');
      }
    } else {
      console.warn('callService: entityId not provided');
    }
  }

  protected showMoreInfo(entityId?: string): void {
    throw new Error(
      `Method not implemented. ${entityId ? `Unhandled eindity: ${entityId}` : 'entityId not  provided'}`,
    );
  }

  /** change to private, for  now  protected  until changes made in climate card */
  protected _callService(domain: string, service: string, serviceData: Record<string, unknown>): void {
    this.hass.callService(domain, service, serviceData);
  }
}
