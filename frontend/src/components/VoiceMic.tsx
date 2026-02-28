import { motion } from "framer-motion";
import { Mic } from "lucide-react";

interface VoiceMicProps {
  isListening: boolean;
  onClick: () => void;
  size?: "lg" | "md";
}

export function VoiceMic({ isListening, onClick, size = "lg" }: VoiceMicProps) {
  const dim = size === "lg" ? "w-28 h-28" : "w-16 h-16";
  const iconSize = size === "lg" ? 40 : 24;

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center focus:outline-none"
    >
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <span className={`absolute ${dim} rounded-full bg-primary/30 animate-pulse-ring`} />
          <span
            className={`absolute ${dim} rounded-full bg-primary/20 animate-pulse-ring`}
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}

      <motion.div
        className={`relative ${dim} rounded-full flex items-center justify-center cursor-pointer transition-colors ${
          isListening
            ? "bg-primary glow-primary-intense"
            : "bg-secondary hover:bg-secondary/80 glow-primary"
        }`}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
      >
        <Mic
          size={iconSize}
          className={isListening ? "text-primary-foreground" : "text-primary"}
        />
      </motion.div>
    </button>
  );
}
