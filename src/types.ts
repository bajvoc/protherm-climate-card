import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';

declare global {
  interface HTMLElementTagNameMap {
    'protherm-climate-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface ProthermClimateCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  show_timestamps?: boolean;
  test_gui?: boolean;
  entity?: string;
  external_temperature_entity?: string;
  schedule_entity?: string;
  return_temperature_entity?: string;
  temperature_alarm_entity?: string;
  pressure_alarm_entity?: string;
  area?: string;
  icon?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  press_action?: ActionConfig;
  release_action?: ActionConfig;
  // Appearance
  card_style?: 'default' | 'compact' | 'detailed' | 'minimal';
  accent_color?: [number, number, number]; // RGB array [r, g, b]
  // Layout
  layout?: 'vertical' | 'horizontal';
  display_mode?: 'card' | 'badge';
  // Display
  attribute_limit?: number;
}

export interface GaugeData {
  heatingEnabled: boolean;
  state: string;
  tempAlarm: boolean;
  pressureAlarm: boolean;
  targetTemp: number;
  currentTemp: number;
  outsideTemp?: string;
  returnTemp?: string;
  schedule?: ProgressData;
}

export interface ProgressData {
  progress: number;
  start: string;
  end: string;
  next_trigger: string;
}
