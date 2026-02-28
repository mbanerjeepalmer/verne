"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Play, Pause } from "lucide-react";
import {
  ScrubBarContainer,
  ScrubBarTrack,
  ScrubBarProgress,
  ScrubBarThumb,
} from "@/components/ui/scrub-bar";
import type { IPodcast } from "@/types/podcast";

function formatSecondsToTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface FullPodcastCardProps {
  podcast: IPodcast;
}

export function FullPodcastCard({ podcast }: FullPodcastCardProps) {
  const { name, duration, cover_image, start_time } = podcast;
  const totalSeconds = duration || 1;

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(
    (start_time / totalSeconds) * 100,
  );

  const currentSeconds = (progress / 100) * totalSeconds;
  const dynamicTimeString = formatSecondsToTime(currentSeconds);

  const handleScrub = (time: number) => {
    setProgress((time / totalSeconds) * 100);
  };

  const handleScrubStart = () => {};

  const handleScrubEnd = () => {
    setIsPlaying(true);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="group relative overflow-hidden w-full rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 py-3.5 hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer duration-200 ease-in-out">
      {/* Main Content: Thumbnail and Title */}
      <div className="flex items-start gap-4">
        <button
          className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/10 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
        >
          <img
            src={cover_image}
            alt={name}
            className={`object-cover w-full h-full opacity-95 transition-transform duration-500 ${isPlaying ? "scale-105" : "group-hover:scale-105"}`}
          />
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? "bg-black/40" : "bg-black/20 group-hover:bg-black/40"}`}
          >
            <div
              className={`backdrop-blur-sm rounded-full p-2 transition-all duration-300 shadow-sm ${isPlaying ? "bg-white/20 scale-110" : "bg-white/10 group-hover:bg-white/20 group-hover:scale-110"}`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="currentColor" />
              ) : (
                <Play
                  className="w-5 h-5 text-white ml-0.5"
                  fill="currentColor"
                />
              )}
            </div>
          </div>
        </button>

        <div className="flex flex-col pt-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight text-slate-900 dark:text-slate-50 tracking-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all duration-300 group-hover:translate-x-1 truncate">
            {name}
          </h3>
        </div>
      </div>

      {/* Progress Section — inline: time | bar | time */}
      <div className="mt-4 mb-0.5 relative group-hover:opacity-100 opacity-90 transition-opacity">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-900 dark:text-slate-100 tabular-nums shrink-0 w-10">
            {dynamicTimeString}
          </span>
          <div className="flex-1 relative">
            <ScrubBarContainer
              duration={totalSeconds}
              value={currentSeconds}
              onScrub={handleScrub}
              onScrubStart={handleScrubStart}
              onScrubEnd={handleScrubEnd}
            >
              <ScrubBarTrack className="bg-slate-200 dark:bg-slate-800 h-1 rounded-full transition-all duration-300 before:content-[''] before:absolute before:inset-x-0 before:-inset-y-3">
                <ScrubBarProgress className="bg-slate-800 dark:bg-slate-200 z-10 rounded-full" />
                <ScrubBarThumb className="bg-slate-900 dark:bg-slate-100 h-3.5 w-3.5 shadow-sm z-20" />
              </ScrubBarTrack>
            </ScrubBarContainer>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0 w-10 text-right">
            {formatSecondsToTime(totalSeconds)}
          </span>
        </div>
      </div>
    </Card>
  );
}
