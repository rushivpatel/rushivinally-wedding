"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

const AUDIO_SRC = encodeURI("/audio/ghar music only.mp3");

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false),
      );
    }
  }

  function handleVolumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(event.target.value);
    setVolume(value);
    if (value > 0 && isMuted) setIsMuted(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="none" />

      <div className="liquid-glass-lite flex items-center gap-4 rounded-full px-5 py-3.5">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause music" : "Play music"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-tertiary transition-transform hover:scale-105"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="shrink-0 text-secondary/70 drop-shadow-[0_0_4px_var(--color-secondary)] transition-colors hover:text-secondary"
        >
          {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
          className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-secondary/30 accent-secondary"
        />
      </div>
    </div>
  );
}
