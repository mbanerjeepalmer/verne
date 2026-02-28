import { motion } from "framer-motion";
import { Play, Pause, ExternalLink, AudioLines } from "lucide-react";
import { useState } from "react";

interface ClipCardProps {
  title: string;
  podcastName: string;
  timestamp: string;
  duration: string;
  imageUrl?: string;
  index: number;
  onPlayFull?: () => void;
}

export function ClipCard({
  title,
  podcastName,
  timestamp,
  duration,
  imageUrl,
  index,
  onPlayFull,
}: ClipCardProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.4 }}
      className="glass-card p-4 relative overflow-hidden"
    >
      {/* Clip indicator stripe on left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />

      {/* Clip badge */}
      <div className="flex items-center gap-1.5 mb-3 ml-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <AudioLines size={10} /> Clip
        </span>
        <span className="text-[10px] text-muted-foreground">
          {duration} from {podcastName}
        </span>
      </div>

      <div className="flex items-start gap-3 ml-2">
        {imageUrl ? (
          <div className="w-12 h-12 rounded-lg bg-secondary flex-shrink-0 overflow-hidden relative">
            <img src={imageUrl} alt={podcastName} className="w-full h-full object-cover" />
            <button
              onClick={() => setPlaying(!playing)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            >
              {playing ? (
                <Pause size={14} className="text-white" />
              ) : (
                <Play size={14} className="text-white ml-0.5" />
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPlaying(!playing)}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 glow-primary hover:scale-105 transition-transform"
          >
            {playing ? (
              <Pause size={16} className="text-primary-foreground" />
            ) : (
              <Play size={16} className="text-primary-foreground ml-0.5" />
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-medium text-foreground text-sm">{title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>@ {timestamp}</span>
            <span>·</span>
            <span>{duration}</span>
          </div>
        </div>
      </div>

      {/* Clip progress — shows segment within full episode */}
      <div className="mt-3 ml-2">
        <div className="h-1 rounded-full bg-secondary overflow-hidden relative">
          {/* Full episode background with clip segment highlighted */}
          <div className="absolute left-[15%] w-[25%] h-full bg-primary/20 rounded-full" />
          <motion.div
            className="h-full bg-primary rounded-full relative z-10"
            style={{ marginLeft: "15%" }}
            initial={{ width: "0%" }}
            animate={{ width: playing ? "25%" : "0%" }}
            transition={{ duration: playing ? 8 : 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>{timestamp}</span>
          <span>Full episode</span>
        </div>
      </div>

      {onPlayFull && (
        <button
          onClick={onPlayFull}
          className="mt-2 ml-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink size={12} /> Listen to full episode
        </button>
      )}
    </motion.div>
  );
}
