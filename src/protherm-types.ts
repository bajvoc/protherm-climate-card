export interface ProthermData {
  state: string;
  enabled: boolean;
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
