export interface GaugeConfig {
  state: string;
  enabled: boolean;
  isOff: boolean;
  isBridgeActive: boolean;
  isTrackActive: boolean;
  targetValue: number;
  currentValue: number;
  gaugeLength: number;
}
