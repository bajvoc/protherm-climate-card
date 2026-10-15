import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import { MultiSliderConfig } from './multi-slider/types';

declare global {
  interface HTMLElementTagNameMap {
    'protherm-climate-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface BaseCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  show_timestamps?: boolean;
  test_gui?: boolean;
  area?: string;
  icon?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  press_action?: ActionConfig;
  release_action?: ActionConfig;
  card_style?: 'default' | 'compact' | 'detailed' | 'minimal';
  accent_color?: [number, number, number];
  layout?: 'vertical' | 'horizontal';
  display_mode?: 'card' | 'badge';
  attribute_limit?: number;
}

export interface ClimateEntityConfig extends BaseCardConfig {
  entity?: string;
  external_temperature_entity?: string;
  schedule_entity?: string;
  return_temperature_entity?: string;
  temperature_alarm_entity?: string;
  pressure_alarm_entity?: string;
  season_entity?: string;
  monthly_consumption_entity?: string;
  season_consumption_entity?: string;
}

export interface ProthermClimateCardConfig extends BaseCardConfig, ClimateEntityConfig, MultiSliderConfig {}

/*export interface GaugeData {
  heatingEnabled: boolean;
  //seasaon: string;
  state: string;
  tempAlarm: boolean;
  pressureAlarm: boolean;
  targetTemp: number;
  currentTemp: number;
  outsideTemp?: string;
  returnTemp?: string;
  schedule?: ProgressData;
  //monthlyConsumption: number;
  //seasonConsumption: number;
}

export interface ProgressData {
  progress: number;
  start: string;
  end: string;
  next_trigger: string;
}*/
