// Alarm System for Weapon Detection Alerts

export type AlarmType = 'weapon' | 'critical' | 'emergency' | 'warning';

export interface AlarmConfig {
  duration: number; // in milliseconds
  pattern: 'continuous' | 'pulse' | 'rapid';
  volume: number; // 0 to 1
}

class AlarmSystem {
  private audioContext: AudioContext | null = null;
  private currentAlarm: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private alarmInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Generate siren sound using Web Audio API
  private createSiren(frequency: number, duration: number, pattern: 'continuous' | 'pulse' | 'rapid') {
    if (!this.audioContext) {
      console.warn('AudioContext not available');
      return;
    }

    // Stop any existing alarm
    this.stopAlarm();

    this.isPlaying = true;
    const startTime = this.audioContext.currentTime;

    if (pattern === 'continuous') {
      this.playContinuousSiren(frequency, duration);
    } else if (pattern === 'pulse') {
      this.playPulseSiren(frequency, duration);
    } else if (pattern === 'rapid') {
      this.playRapidSiren(frequency, duration);
    }

    // Auto-stop after duration
    setTimeout(() => {
      this.stopAlarm();
    }, duration);
  }

  private playContinuousSiren(baseFrequency: number, duration: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime);

    // Create sweep effect (siren going up and down)
    const now = this.audioContext.currentTime;
    const sweepDuration = 1.5;
    
    for (let i = 0; i < duration / 1000 / sweepDuration; i++) {
      const time = now + (i * sweepDuration);
      oscillator.frequency.setValueAtTime(baseFrequency, time);
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 1.5, time + sweepDuration / 2);
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency, time + sweepDuration);
    }

    this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    
    oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    oscillator.start();
    this.currentAlarm = oscillator;
  }

  private playPulseSiren(baseFrequency: number, duration: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime);

    // Create pulse effect
    const now = this.audioContext.currentTime;
    const pulseDuration = 0.5;
    
    for (let i = 0; i < duration / 1000 / pulseDuration; i++) {
      const time = now + (i * pulseDuration);
      this.gainNode.gain.setValueAtTime(0.3, time);
      this.gainNode.gain.setValueAtTime(0, time + pulseDuration / 2);
    }

    oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    oscillator.start();
    this.currentAlarm = oscillator;
  }

  private playRapidSiren(baseFrequency: number, duration: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    
    // Rapid frequency modulation
    const now = this.audioContext.currentTime;
    const rapidDuration = 0.2;
    
    for (let i = 0; i < duration / 1000 / rapidDuration; i++) {
      const time = now + (i * rapidDuration);
      oscillator.frequency.setValueAtTime(baseFrequency, time);
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 2, time + rapidDuration / 2);
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency, time + rapidDuration);
    }

    this.gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    
    oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    oscillator.start();
    this.currentAlarm = oscillator;
  }

  // Public method to trigger alarm
  public triggerAlarm(type: AlarmType, config?: Partial<AlarmConfig>) {
    const defaultConfig: AlarmConfig = {
      duration: 5000,
      pattern: 'continuous',
      volume: 0.3,
    };

    const finalConfig = { ...defaultConfig, ...config };

    let frequency = 800;
    let pattern: 'continuous' | 'pulse' | 'rapid' = finalConfig.pattern;

    switch (type) {
      case 'weapon':
        frequency = 900;
        pattern = 'continuous';
        break;
      case 'critical':
        frequency = 1000;
        pattern = 'rapid';
        break;
      case 'emergency':
        frequency = 850;
        pattern = 'pulse';
        break;
      case 'warning':
        frequency = 700;
        pattern = 'pulse';
        break;
    }

    console.log(`🚨 ALARM TRIGGERED: ${type.toUpperCase()} - Pattern: ${pattern}, Duration: ${finalConfig.duration}ms`);
    this.createSiren(frequency, finalConfig.duration, pattern);
    
    // Also trigger visual notification
    this.triggerVisualAlert(type);
  }

  private triggerVisualAlert(type: AlarmType) {
    // Create visual alert banner
    if (typeof document !== 'undefined') {
      const existingBanner = document.getElementById('alarm-banner');
      if (existingBanner) {
        existingBanner.remove();
      }

      const banner = document.createElement('div');
      banner.id = 'alarm-banner';
      banner.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        padding: 16px 32px;
        background: linear-gradient(135deg, #EF4444, #DC2626);
        color: white;
        border-radius: 12px;
        font-weight: bold;
        font-size: 18px;
        box-shadow: 0 10px 40px rgba(239, 68, 68, 0.4);
        animation: pulse 1s infinite;
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      const icon = document.createElement('div');
      icon.innerHTML = '🚨';
      icon.style.fontSize = '24px';

      const text = document.createElement('span');
      text.textContent = `${type.toUpperCase()} ALERT: Weapon Detected - Response Initiated`;

      banner.appendChild(icon);
      banner.appendChild(text);
      document.body.appendChild(banner);

      // Add animation styles
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.02); }
        }
      `;
      document.head.appendChild(style);

      // Remove banner after 8 seconds
      setTimeout(() => {
        banner.remove();
        style.remove();
      }, 8000);
    }
  }

  public stopAlarm() {
    if (this.currentAlarm) {
      this.currentAlarm.stop();
      this.currentAlarm.disconnect();
      this.currentAlarm = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }

    this.isPlaying = false;
  }

  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  // Test alarm
  public testAlarm() {
    console.log('🔊 Testing alarm system...');
    this.triggerAlarm('weapon', { duration: 3000 });
  }
}

// Export singleton instance
export const alarmSystem = new AlarmSystem();

// Convenience functions
export function triggerWeaponAlarm(duration: number = 5000) {
  alarmSystem.triggerAlarm('weapon', { duration, pattern: 'continuous' });
}

export function triggerCriticalAlarm(duration: number = 8000) {
  alarmSystem.triggerAlarm('critical', { duration, pattern: 'rapid' });
}

export function stopAllAlarms() {
  alarmSystem.stopAlarm();
}
