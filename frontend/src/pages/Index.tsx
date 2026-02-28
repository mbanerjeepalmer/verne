import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceMic } from "@/components/VoiceMic";
import { WaveformBars } from "@/components/WaveformBars";
import { PodcastCard } from "@/components/PodcastCard";
import { ClipCard } from "@/components/ClipCard";
import { AssistantMessage } from "@/components/AssistantMessage";
import { ArrowLeft, Podcast } from "lucide-react";

type Step = "welcome" | "listening" | "podcasts" | "refine-listening" | "clips";

// Stage 1: User says "Kafka" — system assumes the writer
const KAFKA_WRITER_PODCASTS = [
  {
    title: "The Metamorphosis Revisited",
    author: "Literary Lens Podcast",
    duration: "42 min",
    description: "A deep dive into Franz Kafka's most famous novella and its influence on existential literature.",
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop",
    progress: 0,
  },
  {
    title: "Kafka & the Absurd",
    author: "Philosophy Bites",
    duration: "35 min",
    description: "Exploring Kafka's relationship with absurdism, Camus, and 20th-century European thought.",
    imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200&h=200&fit=crop",
    progress: 0,
  },
  {
    title: "Prague's Literary Giant",
    author: "The Book Club Show",
    duration: "50 min",
    description: "Tracing Kafka's life in Prague and how the city shaped his dark, surreal storytelling.",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop",
    progress: 0,
  },
];

// Stage 2: User clarifies "Apache Kafka / microservices" — correct content
const KAFKA_MICROSERVICES_CLIPS = [
  {
    title: "Event-Driven Architecture with Kafka",
    podcastName: "Software Engineering Daily",
    timestamp: "05:22",
    duration: "7:10",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=200&fit=crop",
  },
  {
    title: "Kafka Streams for Real-Time Data Pipelines",
    podcastName: "Data Engineering Podcast",
    timestamp: "14:08",
    duration: "6:30",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop",
  },
  {
    title: "Scaling Microservices with Apache Kafka",
    podcastName: "The Distributed Systems Pod",
    timestamp: "08:45",
    duration: "8:15",
    imageUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=200&h=200&fit=crop",
  },
];

const Index = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [userQuery, setUserQuery] = useState("");
  const [refinedQuery, setRefinedQuery] = useState("");

  const simulateListening = useCallback((nextStep: Step, setQuery: (q: string) => void, query: string) => {
    // Simulate 2s of listening then transition
    setTimeout(() => {
      setQuery(query);
      setStep(nextStep);
    }, 2000);
  }, []);

  const handleMicClick = () => {
    if (step === "welcome") {
      setStep("listening");
      simulateListening("podcasts", setUserQuery, "Kafka");
    } else if (step === "podcasts") {
      setStep("refine-listening");
      simulateListening("clips", setRefinedQuery, "Apache Kafka for microservices");
    }
  };

  const handleReset = () => {
    setStep("welcome");
    setUserQuery("");
    setRefinedQuery("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          {step !== "welcome" && (
            <button onClick={handleReset} className="text-muted-foreground hover:text-foreground transition-colors mr-2">
              <ArrowLeft size={20} />
            </button>
          )}
          <Podcast size={24} className="text-primary" />
          <span className="font-display font-semibold text-lg text-foreground">PodVoice</span>
        </div>
        {userQuery && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full"
          >
            {userQuery}
          </motion.span>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {/* WELCOME */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
                  What do you want to <span className="text-gradient">listen</span> to?
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Tap the mic and tell us a topic. We'll find the best podcasts for you.
                </p>
              </div>
              <VoiceMic isListening={false} onClick={handleMicClick} />
              <p className="text-xs text-muted-foreground">Tap to speak</p>
            </motion.div>
          )}

          {/* LISTENING */}
          {step === "listening" && (
            <motion.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <VoiceMic isListening onClick={() => {}} />
              <WaveformBars />
              <p className="text-sm text-muted-foreground">Listening...</p>
            </motion.div>
          )}

          {/* PODCASTS RESULTS */}
          {step === "podcasts" && (
            <motion.div
              key="podcasts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xl flex flex-col gap-6"
            >
              <AssistantMessage
                message={`Here are 3 full podcasts about "${userQuery}". These seem to be about Franz Kafka the writer — not what you meant? Tap the mic to clarify!`}
              />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Podcasts</p>

              <div className="flex flex-col gap-3 mt-2">
                {KAFKA_WRITER_PODCASTS.map((p, i) => (
                  <PodcastCard
                    key={i}
                    {...p}
                    index={i}
                    onSelect={() => {
                      setStep("refine-listening");
                      simulateListening("clips", setRefinedQuery, "Apache Kafka for microservices");
                    }}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 mt-4">
                <p className="text-xs text-muted-foreground">Or refine your search by voice</p>
                <VoiceMic isListening={false} onClick={handleMicClick} size="md" />
              </div>
            </motion.div>
          )}

          {/* REFINE LISTENING */}
          {step === "refine-listening" && (
            <motion.div
              key="refine-listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <VoiceMic isListening onClick={() => {}} />
              <WaveformBars />
              <p className="text-sm text-muted-foreground">Tell me what specific topic...</p>
            </motion.div>
          )}

          {/* CLIPS */}
          {step === "clips" && (
            <motion.div
              key="clips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xl flex flex-col gap-6"
            >
              <AssistantMessage
                message={`Got it — you meant Apache Kafka! Here are the top 3 specific clips about "${refinedQuery}" from relevant podcasts.`}
              />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clips from Podcasts</p>

              <div className="flex flex-col gap-3 mt-2">
                {KAFKA_MICROSERVICES_CLIPS.map((c, i) => (
                  <ClipCard key={i} {...c} index={i} onPlayFull={() => {}} />
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 mt-4">
                <p className="text-xs text-muted-foreground">Search for something else</p>
                <VoiceMic isListening={false} onClick={handleReset} size="md" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
