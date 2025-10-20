"use client";

import AudioPlayerVisualizer from "@/components/audio/AudioPlayerVisualizer";

export default function AdminAudioPage() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
      <div style={{ margin: 48, marginTop: -8, width: "100%" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <AudioPlayerVisualizer
            bars={100}
            audioUrl="https://archive.org/serve/mjs-e1/leire_julian.mp3"
          />
        </div>
      </div>
    </div>
  );
}
