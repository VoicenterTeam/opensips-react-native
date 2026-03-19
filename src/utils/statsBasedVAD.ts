// @ts-nocheck
export class StatsBasedVAD {
    constructor(peerConnection, options = {}) {
      this.pc = peerConnection;
      this.pollIntervalMs = options.pollIntervalMs || 200;

      // Thresholds (linear 0..1; silence floor on iOS ≈ 0.0008)
      this.speechThreshold = options.speechThreshold || 0.01;    // ~-40 dBov
      this.silenceThreshold = options.silenceThreshold || 0.005; // ~-46 dBov

      // Debounce prevents rapid toggling
      this.speechMinDurationMs = options.speechMinDurationMs || 250;
      this.silenceMinDurationMs = options.silenceMinDurationMs || 600;

      this.isSpeaking = false;
      this._speechStart = 0;
      this._silenceStart = 0;
      this._timer = null;
      this._prevEnergy = 0;
      this._prevDuration = 0;

      this.onSpeechStart = options.onSpeechStart || (() => {});
      this.onSpeechEnd = options.onSpeechEnd || (() => {});
      this.onAudioLevel = options.onAudioLevel || null;
    }

    start() {
      this._timer = setInterval(() => this._poll(), this.pollIntervalMs);
    }

    stop() {
      if (this._timer) clearInterval(this._timer);
      this._timer = null;
    }

    async _poll() {
      try {
        const stats = await this.pc.getStats();
        let level = 0;

        stats.forEach((report) => {
          if (report.type === 'media-source' && report.kind === 'audio') {
            if (report.totalAudioEnergy !== undefined &&
                report.totalSamplesDuration !== undefined) {
              const energyDelta = report.totalAudioEnergy - this._prevEnergy;
              const durationDelta = report.totalSamplesDuration - this._prevDuration;
              if (durationDelta > 0) {
                level = Math.sqrt(energyDelta / durationDelta);
              }
              this._prevEnergy = report.totalAudioEnergy;
              this._prevDuration = report.totalSamplesDuration;
            } else if (report.audioLevel !== undefined) {
              level = report.audioLevel; // instantaneous fallback
            }
          }
        });

        if (this.onAudioLevel) this.onAudioLevel(level);
        this._updateState(level);
      } catch (_) {
        // getStats() may throw during call teardown — ignore
      }
    }

    _updateState(level) {
      const now = Date.now();

      if (!this.isSpeaking) {
        if (level > this.speechThreshold) {
          if (!this._speechStart) this._speechStart = now;
          else if (now - this._speechStart >= this.speechMinDurationMs) {
            this.isSpeaking = true;
            this._silenceStart = 0;
            this.onSpeechStart();
          }
        } else {
          this._speechStart = 0;
        }
      } else {
        if (level < this.silenceThreshold) {
          if (!this._silenceStart) this._silenceStart = now;
          else if (now - this._silenceStart >= this.silenceMinDurationMs) {
            this.isSpeaking = false;
            this._speechStart = 0;
            this.onSpeechEnd();
          }
        } else {
          this._silenceStart = 0;
        }
      }
    }
  }
