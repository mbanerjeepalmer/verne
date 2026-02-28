import { motion } from "framer-motion";
import { Play, Pause, Clock, Headphones } from "lucide-react";
import { useState } from "react";

interface PodcastCardProps {
  title: string;
  author: string;
  duration: string;
  description: string;
  imageUrl: string;
  progress?: number;
  index: number;
  onSelect: () => void;
}

export function PodcastCard({
  title,
  author,
  duration,
  description,
  imageUrl,
  progress = 0,
  index,
  onSelect,
}: PodcastCardProps) {
  const [playing, setPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(progress);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(!playing);
    if (!playing) {
      // Simulate progress
      const interval = setInterval(() => {
        setCurrentProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setPlaying(false);
            return 0;
          }
          return p + 0.5;
        });
      }, 200);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      onClick={onSelect}
      className="glass-card p-4 cursor-pointer group hover:border-primary/40 transition-all duration-300"
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-lg bg-secondary flex-shrink-0 overflow-hidden relative">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {playing ? (
              <Pause size={24} className="text-white" />
            ) : (
              <Play size={24} className="text-white ml-0.5" />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{author}</p>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: `${progress}%` }}
          animate={{ width: `${currentProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {duration}
          </span>
          <span className="flex items-center gap-1">
            <Headphones size={12} /> Podcast
          </span>
        </div>
        {currentProgress > 0 && (
          <span className="text-xs text-primary font-medium">{Math.round(currentProgress)}%</span>
        )}
      </div>
    </motion.div>
  );
}
