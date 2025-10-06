/**
 * Audio notification utilities for WebRTC calls
 */

class AudioNotificationManager {
  constructor() {
    this.ringtone = null;
    this.isPlaying = false;
    this.audioContext = null;
  }

  /**
   * Initialize audio context and create ringtone
   */
  async initialize() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a simple ringtone using Web Audio API
      this.createRingtone();
      
      console.log('✅ Audio notification manager initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize audio notifications:', error);
    }
  }

  /**
   * Create a simple ringtone using oscillators
   */
  createRingtone() {
    if (!this.audioContext) return;

    // Create a simple two-tone ringtone pattern
    this.ringtonePattern = [
      { frequency: 800, duration: 0.4 },
      { frequency: 0, duration: 0.2 },
      { frequency: 1000, duration: 0.4 },
      { frequency: 0, duration: 0.8 }
    ];
  }

  /**
   * Play a single tone
   */
  playTone(frequency, duration, startTime = 0) {
    if (!this.audioContext || frequency === 0) {
      return startTime + duration;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'sine';

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    return startTime + duration;
  }

  /**
   * Play the ringtone pattern
   */
  playRingtonePattern() {
    if (!this.audioContext || !this.ringtonePattern) return;

    const currentTime = this.audioContext.currentTime;
    let nextTime = currentTime;

    this.ringtonePattern.forEach(tone => {
      nextTime = this.playTone(tone.frequency, tone.duration, nextTime);
    });

    return nextTime - currentTime;
  }

  /**
   * Start playing incoming call ringtone
   */
  async startIncomingCallRingtone() {
    if (this.isPlaying) return;

    try {
      // Initialize if not already done
      if (!this.audioContext) {
        await this.initialize();
      }

      // Resume audio context if suspended (required by browser policies)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      console.log('🔊 Starting incoming call ringtone');

      // Play ringtone in a loop
      const playLoop = () => {
        if (!this.isPlaying) return;

        const patternDuration = this.playRingtonePattern();
        
        // Schedule next iteration
        setTimeout(() => {
          if (this.isPlaying) {
            playLoop();
          }
        }, patternDuration * 1000);
      };

      playLoop();
    } catch (error) {
      console.error('❌ Failed to start ringtone:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Stop playing ringtone
   */
  stopIncomingCallRingtone() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    console.log('🔇 Stopping incoming call ringtone');
  }

  /**
   * Play a short notification sound
   */
  async playNotificationSound() {
    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Play a short notification beep
      const currentTime = this.audioContext.currentTime;
      this.playTone(800, 0.2, currentTime);
      
      console.log('🔔 Played notification sound');
    } catch (error) {
      console.warn('⚠️ Failed to play notification sound:', error);
    }
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    this.stopIncomingCallRingtone();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🧹 Audio notification manager cleaned up');
  }
}

// Create singleton instance
const audioNotificationManager = new AudioNotificationManager();

export default audioNotificationManager;
export { AudioNotificationManager };
