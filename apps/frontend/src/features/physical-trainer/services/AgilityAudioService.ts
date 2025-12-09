'use client';

class AgilityAudioService {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private volume: number = 1;
  private rate: number = 1;
  private pitch: number = 1;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.isSupported = true;
      this.initializeVoice();
    }
  }

  private initializeVoice() {
    if (!this.synthesis) return;

    // Wait for voices to load
    const loadVoices = () => {
      const voices = this.synthesis!.getVoices();
      // Prefer English voices
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      this.selectedVoice = englishVoice;
    };

    loadVoices();
    this.synthesis.onvoiceschanged = loadVoices;
  }

  speak(text: string, options?: {
    volume?: number;
    rate?: number;
    pitch?: number;
    interrupt?: boolean;
  }) {
    if (!this.isSupported || !this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel current speech if interrupting
    if (options?.interrupt) {
      this.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.selectedVoice;
    utterance.volume = options?.volume ?? this.volume;
    utterance.rate = options?.rate ?? this.rate;
    utterance.pitch = options?.pitch ?? this.pitch;

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);

    return new Promise<void>((resolve) => {
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        this.currentUtterance = null;
        resolve();
      };
    });
  }

  cancel() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  pause() {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setRate(rate: number) {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }

  setPitch(pitch: number) {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }

  // Agility-specific speech methods
  announceWarmup() {
    return this.speak("Starting warmup phase. Get ready to move!", { interrupt: true });
  }

  announceDrill(drillName: string, description: string) {
    const text = `Next drill: ${drillName}. ${description}`;
    return this.speak(text, { interrupt: true });
  }

  announceInstructions(instructions: string[]) {
    const text = "Instructions: " + instructions.join(". ");
    return this.speak(text, { rate: 0.9 });
  }

  announceCoachingCues(cues: string[]) {
    const text = "Remember: " + cues.join(". ");
    return this.speak(text, { rate: 0.95 });
  }

  announceStart() {
    return this.speak("Go!", { interrupt: true, pitch: 1.2 });
  }

  announceStop() {
    return this.speak("Stop! Well done.", { interrupt: true });
  }

  announceRest(seconds: number) {
    return this.speak(`Rest for ${seconds} seconds`, { interrupt: true });
  }

  announceCountdown(count: number) {
    if (count <= 3 && count > 0) {
      return this.speak(count.toString(), { interrupt: true, pitch: 1.1 });
    }
  }

  announceRepetition(current: number, total: number) {
    return this.speak(`Rep ${current} of ${total}`, { interrupt: true });
  }

  announceCompletion() {
    return this.speak("Drill complete! Great job!", { interrupt: true, pitch: 1.1 });
  }

  announceCooldown() {
    return this.speak("Starting cooldown phase. Time to recover.", { interrupt: true });
  }

  announceSessionComplete() {
    return this.speak("Agility session complete! Excellent work today!", { 
      interrupt: true, 
      pitch: 1.2 
    });
  }

  announceTime(seconds: number) {
    const formatted = seconds < 10 ? seconds.toFixed(1) : Math.round(seconds).toString();
    return this.speak(`Time: ${formatted} seconds`, { interrupt: true });
  }

  announcePerformance(time: number, targetTime?: { elite: number; good: number; average: number }) {
    if (!targetTime) return;
    
    let level = "Good effort";
    if (time <= targetTime.elite) {
      level = "Elite performance!";
    } else if (time <= targetTime.good) {
      level = "Good time!";
    } else if (time <= targetTime.average) {
      level = "Average time.";
    }
    
    return this.speak(level, { interrupt: true });
  }
}

// Export singleton instance
export const agilityAudioService = new AgilityAudioService();