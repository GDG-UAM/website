import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from "react";
import { PlayButton, PauseButton } from "@/components/Buttons";

interface AudioVisualizerProps {
  bars?: number;
  mobileBars?: number;
  audioUrl?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ bars = 100, mobileBars, audioUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [segmentRMS, setSegmentRMS] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const [isManuallyPaused, setManualPause] = useState(true);
  const [tempPaused, setTempPaused] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [pauseOffset, setPauseOffset] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const dragStartRef = useRef(0);
  const dragWasPlayingRef = useRef(false);
  const pressStartTimeRef = useRef(0);

  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const MOVE_THRESHOLD = 6;
  const HOLD_THRESHOLD = 100;

  // Detect if device is mobile (phone, not tablet)
  useEffect(() => {
    const checkIsMobile = () => {
      // Check if it's a phone (max-width: 640px, which is typical for phones in portrait)
      const isPhone = window.matchMedia("(max-width: 640px)").matches;
      setIsMobile(isPhone);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    window.addEventListener("orientationchange", () => {
      setTimeout(checkIsMobile, 100);
    });

    return () => {
      window.removeEventListener("resize", checkIsMobile);
      window.removeEventListener("orientationchange", checkIsMobile);
    };
  }, []);

  // Calculate effective bar count based on device
  const effectiveBars = isMobile ? (mobileBars ?? bars) : bars;

  const computeRMS = (buffer: AudioBuffer, n: number) => {
    const len = buffer.length;
    const ch = buffer.numberOfChannels;
    const segSize = Math.max(1, Math.floor(len / n));
    const rms = new Float32Array(n);
    for (let s = 0; s < n; s++) {
      let sum = 0,
        count = 0;
      const start = s * segSize;
      const end = s === n - 1 ? len : Math.min(len, start + segSize);
      for (let c = 0; c < ch; c++) {
        const data = buffer.getChannelData(c);
        for (let i = start; i < end; i++) {
          sum += data[i] * data[i];
          count++;
        }
      }
      rms[s] = count ? Math.sqrt(sum / count) : 0;
    }
    const max = Math.max(...rms) || 1;
    return Array.from(rms, (v) => v / max);
  };

  // Load audio from URL
  useEffect(() => {
    if (!audioUrl) {
      setAudioBuffer(null);
      setSegmentRMS([]);
      setLoadError(false);
      setIsLoadingAudio(false);
      return;
    }

    setIsLoadingAudio(true);

    const loadAudio = async () => {
      setLoadError(false);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioCtx(ctx);

        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);

        setAudioBuffer(buffer);
        setSegmentRMS(computeRMS(buffer, effectiveBars));
        setPauseOffset(0);
        setManualPause(true);
        setLoadError(false);
      } catch (error) {
        console.error("Failed to load audio:", error);
        setLoadError(true);
        setAudioBuffer(null);
        setSegmentRMS([]);
      } finally {
        setIsLoadingAudio(false);
      }
    };

    loadAudio();
  }, [audioUrl, effectiveBars]);

  const getCurrentTime = useCallback(() => {
    if (!audioBuffer) return 0;
    return audioCtx && !isManuallyPaused && !tempPaused
      ? pauseOffset + (audioCtx.currentTime - startTime)
      : pauseOffset;
  }, [audioBuffer, audioCtx, isManuallyPaused, tempPaused, pauseOffset, startTime]);

  const stopPlayback = useCallback(() => {
    if (source) {
      source.onended = null;
      source.stop();
      setSource(null);
    }
  }, [source]);

  const startPlayback = () => {
    if (!audioBuffer || !audioCtx) return;
    stopPlayback();
    const newSource = audioCtx.createBufferSource();
    newSource.buffer = audioBuffer;
    newSource.connect(audioCtx.destination);
    newSource.start(0, pauseOffset);
    setStartTime(audioCtx.currentTime);
    setSource(newSource);
    setManualPause(false);
    newSource.onended = () => {
      setSource(null);
      setPauseOffset(0);
      setManualPause(true);
    };
  };

  const pausePlayback = () => {
    if (!audioCtx || !source) return;
    setPauseOffset(pauseOffset + (audioCtx.currentTime - startTime));
    stopPlayback();
  };

  // Update display time during playback
  useEffect(() => {
    if (isManuallyPaused || tempPaused) {
      setDisplayTime(pauseOffset);
      return;
    }

    const interval = setInterval(() => {
      const current = getCurrentTime();

      // Check if we've reached or exceeded the duration
      if (audioBuffer && current >= audioBuffer.duration) {
        stopPlayback();
        setPauseOffset(0);
        setDisplayTime(0);
        setManualPause(true);
        return;
      }

      setDisplayTime(current);
    }, 50); // Update every 50ms for smooth display

    return () => clearInterval(interval);
  }, [
    isManuallyPaused,
    tempPaused,
    pauseOffset,
    getCurrentTime,
    audioBuffer,
    stopPlayback,
    isLoadingAudio
  ]);

  // Handle canvas sizing for high DPI screens
  useLayoutEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = 40; // Fixed display height

      // Set canvas internal resolution for crisp rendering
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      // Set canvas display size
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // Scale context to match DPI
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      setCanvasSize({ width: displayWidth, height: displayHeight });
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Listen to window resize events (covers orientation changes)
    window.addEventListener("resize", updateCanvasSize);

    // Listen to orientation change events specifically
    window.addEventListener("orientationchange", () => {
      // Use a small delay to ensure the layout has updated
      setTimeout(updateCanvasSize, 100);
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("orientationchange", updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const displayWidth = canvasSize.width;
      const displayHeight = canvasSize.height;

      if (displayWidth === 0 || displayHeight === 0) return;

      ctx.clearRect(0, 0, displayWidth, displayHeight);
      const pad = 4;
      const innerW = displayWidth - pad * 2;
      const barFullW = innerW / effectiveBars;
      const barW = Math.max(2, Math.floor(barFullW * 0.85));
      const hMid = displayHeight / 2;
      const maxBarH = displayHeight / 2 - 4;
      const minBarH = 3;
      const curTime = getCurrentTime();
      const curIndex = audioBuffer
        ? Math.floor((curTime / audioBuffer.duration) * segmentRMS.length)
        : -1;

      // If no audio is loaded, draw bars at minimum height
      if (!audioBuffer || segmentRMS.length === 0) {
        for (let i = 0; i < effectiveBars; i++) {
          const barH = minBarH;
          const x = pad + i * barFullW + (barFullW - barW) / 2;
          const y = hMid - barH;

          ctx.fillStyle = "#e2e8f0"; // gray-200

          const radius = Math.min(barW / 2, 3);
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + barW - radius, y);
          ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
          ctx.lineTo(x + barW, y + barH * 2 - radius);
          ctx.quadraticCurveTo(x + barW, y + barH * 2, x + barW - radius, y + barH * 2);
          ctx.lineTo(x + radius, y + barH * 2);
          ctx.quadraticCurveTo(x, y + barH * 2, x, y + barH * 2 - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Draw normal waveform
        segmentRMS.forEach((v, i) => {
          const barH = Math.max(minBarH, v * maxBarH);
          const x = pad + i * barFullW + (barFullW - barW) / 2;
          const y = hMid - barH;

          // Use CSS variable colors
          const isActive = i < curIndex;
          const isCurrent = i === curIndex;
          ctx.fillStyle = isCurrent
            ? "#1a73e8" // google-blue
            : isActive
              ? "#94a3b8" // gray-400
              : "#e2e8f0"; // gray-200

          const radius = Math.min(barW / 2, 3);
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + barW - radius, y);
          ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
          ctx.lineTo(x + barW, y + barH * 2 - radius);
          ctx.quadraticCurveTo(x + barW, y + barH * 2, x + barW - radius, y + barH * 2);
          ctx.lineTo(x + radius, y + barH * 2);
          ctx.quadraticCurveTo(x, y + barH * 2, x, y + barH * 2 - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
        });
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [
    segmentRMS,
    audioBuffer,
    effectiveBars,
    isManuallyPaused,
    tempPaused,
    pauseOffset,
    startTime,
    source,
    audioCtx,
    getCurrentTime,
    canvasSize.width,
    canvasSize.height
  ]);

  const handlePlayPause = () => {
    if (!audioBuffer || !audioCtx) return;
    if (isManuallyPaused) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      startPlayback();
    } else {
      pausePlayback();
      setManualPause(true);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    dragStartRef.current = e.clientX;
    dragWasPlayingRef.current = !isManuallyPaused;
    pressStartTimeRef.current = performance.now();
    setIsMouseDown(true);
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || !isMouseDown) return;
    const elapsed = performance.now() - pressStartTimeRef.current;
    const moved = Math.abs(e.clientX - dragStartRef.current) > MOVE_THRESHOLD;
    if (!isDragging && (moved || elapsed > HOLD_THRESHOLD)) {
      setIsDragging(true);
      if (dragWasPlayingRef.current && !tempPaused) {
        setTempPaused(true);
        pausePlayback();
      }
    }

    if (isDragging) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setPauseOffset(frac * (audioBuffer?.duration || 0));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    setIsMouseDown(false);
    const rect = canvasRef.current!.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const elapsed = performance.now() - pressStartTimeRef.current;
    const moved = Math.abs(e.clientX - dragStartRef.current) > MOVE_THRESHOLD;
    const wasDrag = isDragging || moved || elapsed > HOLD_THRESHOLD;

    // Calculate new offset and clamp it to be slightly before the end to prevent overflow
    const newOffset = frac * audioBuffer.duration;
    const clampedOffset = Math.min(newOffset, audioBuffer.duration - 0.1);
    setPauseOffset(clampedOffset);

    if (wasDrag && dragWasPlayingRef.current && !isManuallyPaused) {
      setTempPaused(false);
      startPlayback();
    } else if (!wasDrag) {
      // Click action
      if (!isManuallyPaused) startPlayback();
      setTempPaused(false);
    }

    setIsDragging(false);
  };

  const formatTime = (seconds: number, hasAudio: boolean) => {
    if (!hasAudio) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalTime = audioBuffer?.duration || 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden"
      }}
    >
      {/* Audio player container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "8px 12px",
          background: "transparent",
          border: "2px solid var(--color-gray-300)",
          borderRadius: "12px",
          maxHeight: "80px",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {/* Play/Pause button */}
        {isManuallyPaused ? (
          <PlayButton
            onClick={handlePlayPause}
            disabled={loadError || (!audioBuffer && !isLoadingAudio)}
            iconSize={24}
            color="primary"
            isLoading={isLoadingAudio}
            showSpinner={isLoadingAudio}
          />
        ) : (
          <PauseButton
            onClick={handlePlayPause}
            disabled={loadError || (!audioBuffer && !isLoadingAudio)}
            iconSize={24}
            color="primary"
            isLoading={isLoadingAudio}
            showSpinner={isLoadingAudio}
          />
        )}
        {/* Waveform and time display */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            padding: "4px 0 12px",
            minWidth: 0,
            overflow: "hidden"
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "40px",
              cursor: audioBuffer ? "pointer" : "default",
              borderRadius: "4px",
              maxWidth: "100%",
              display: "block"
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "var(--color-gray-600)",
              fontFamily: "ui-monospace, monospace"
            }}
          >
            <span>{formatTime(displayTime, !!audioBuffer)}</span>
            <span>{formatTime(totalTime, !!audioBuffer)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;
