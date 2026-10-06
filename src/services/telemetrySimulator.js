// Official Merach Bike Sensor Telemetry Simulator (Cadence, Speed)

export class MerachSimulator {
  constructor() {
    this.targetCadence = 84; // Target RPM
    this.currentCadence = 84;
    this.currentSpeed = 28.5; // km/h
    this.simulationPreset = 'steady'; // 'steady' | 'intervals' | 'climb'
    this.tickCounter = 0;
  }

  setCadenceTarget(rpm) {
    this.targetCadence = Math.min(130, Math.max(40, rpm));
  }

  setPreset(preset) {
    this.simulationPreset = preset;
  }

  /**
   * Generates the next telemetry tick for official Merach sensors
   */
  nextTick(isPaused = false) {
    if (isPaused) {
      // In pause, flywheel gradually comes to a stop
      this.currentCadence = Math.max(0, this.currentCadence * 0.7);
      this.currentSpeed = Math.max(0, this.currentSpeed * 0.85);
      return {
        cadence: Number(Math.max(0, this.currentCadence).toFixed(1)),
        speed: Number(this.currentSpeed.toFixed(1))
      };
    }

    this.tickCounter++;

    let dynamicTargetCadence = this.targetCadence;
    if (this.simulationPreset === 'intervals') {
      const cycle = this.tickCounter % 60;
      if (cycle < 25) {
        dynamicTargetCadence = 105; // sprint acceleration
      } else {
        dynamicTargetCadence = 78; // recovery
      }
    } else if (this.simulationPreset === 'climb') {
      dynamicTargetCadence = 94; // sustained high tempo
    }

    // Natural pedaling oscillation (+/- 2.5 RPM)
    const cadenceNoise = (Math.random() - 0.5) * 3;
    this.currentCadence += (dynamicTargetCadence - this.currentCadence) * 0.22 + cadenceNoise;
    this.currentCadence = Math.min(135, Math.max(45, this.currentCadence));

    // Official Merach Speed estimation from cadence
    const baseSpeed = this.currentCadence * 0.35;
    const speedNoise = (Math.random() - 0.5) * 0.4;
    this.currentSpeed += ((baseSpeed + speedNoise) - this.currentSpeed) * 0.25;

    return {
      cadence: Number(Math.max(0, this.currentCadence).toFixed(1)),
      speed: Number(Math.max(0, this.currentSpeed).toFixed(1))
    };
  }
}
