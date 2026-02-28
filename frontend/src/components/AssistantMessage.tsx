import { motion } from "framer-motion";
import { Podcast } from "lucide-react";

interface AssistantMessageProps {
  message: string;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 max-w-lg mx-auto"
    >
      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Podcast size={16} className="text-primary" />
      </div>
      <p className="text-foreground/90 text-sm leading-relaxed pt-1">{message}</p>
    </motion.div>
  );
}
