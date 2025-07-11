# Interval Timer Audio Files

This directory contains audio files for the interval timer feature. The application will use these files if present, otherwise it will fall back to generated beep sounds.

## Required Audio Files

Place the following audio files in this directory to use custom sounds:

1. **interval-start.mp3** - Played when starting a work or rest interval
   - Recommended: A clear, motivating sound (e.g., bell, chime)
   - Duration: 200-500ms

2. **interval-end.mp3** - Played when ending an interval
   - Recommended: A distinct sound different from start (e.g., double beep, gong)
   - Duration: 300-600ms

3. **interval-countdown.mp3** - Played during the 3-2-1 countdown
   - Recommended: Short, sharp sound (e.g., tick, click)
   - Duration: 100-200ms

4. **interval-warning.mp3** - (Optional) Played as a warning before interval ends
   - Recommended: Attention-grabbing sound
   - Duration: 150-300ms

## Audio File Requirements

- **Format**: MP3 (preferred), WAV, or OGG
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps or higher for MP3
- **Volume**: Normalized to prevent clipping

## Default Sounds

If audio files are not present, the application will generate synthetic beep sounds:
- Start: 880Hz (A5) - High beep
- End: 440Hz (A4) - Medium beep
- Countdown: 660Hz (E5) - Quick beep
- Warning: 520Hz (C5) - Alert beep

## Usage

Simply place the audio files in this directory with the exact filenames listed above. The application will automatically detect and use them.

## Free Sound Resources

You can find suitable sounds at:
- [Freesound.org](https://freesound.org)
- [Zapsplat.com](https://www.zapsplat.com)
- [Soundbible.com](http://soundbible.com)
- [OpenGameArt.org](https://opengameart.org)

Make sure to check the license requirements for any sounds you download.