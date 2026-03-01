"use client";

import { motion } from "framer-motion";
import VerneLogo from "@/components/icons/verne-logo";
import { BarVisualizer } from "@/components/ui/bar-visualizer";
import { FullPodcastCard } from "@/components/full-podcast-card";
import QueryBlock from "@/components/query-block/query-block";
import Websocket from "@/components/websocket/websocket";
import { usePodcasts } from "@/stores/usePodcasts";
import { Mic, Search, Headphones, Zap } from "lucide-react";
import Spacer from "@/components/spacer/spacer";


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const features = [
  {
    icon: Mic,
    title: "Voice-First Search",
    description:
      "Speak naturally. Verne understands what you're looking for and finds the perfect podcast moments.",
  },
  {
    icon: Search,
    title: "Semantic Discovery",
    description:
      "Go beyond keyword matching. Search by ideas, topics, or questions and discover content you'd never find otherwise.",
  },
  {
    icon: Headphones,
    title: "Clip Playback",
    description:
      "Jump straight to the relevant moments. No more scrubbing through hours of audio to find what matters.",
  },
  {
    icon: Zap,
    title: "AI-Powered Agent",
    description:
      "An intelligent agent that understands context, learns your taste, and surfaces the best content for you.",
  },
];

export default function LandingPage() {
  const { podcasts, message, messages, clearMessages, clearPodcasts, setMessage } = usePodcasts();

  const handleNewConversation = async () => {
    try {
      await fetch("/api/sandbox/restart", { method: "POST" });
    } catch (err) {
      console.error("Failed to restart sandbox:", err);
    }
    clearMessages();
    clearPodcasts();
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/[0.06]"
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <VerneLogo className="size-5" />
            <span className="text-[15px] font-semibold tracking-tight">
              Verne
            </span>
          </div>
          <div className="flex items-center gap-4">
            {messages.length > 0 && (
              <button
                onClick={handleNewConversation}
                className="text-[13px] font-medium text-black/50 hover:text-black transition-colors cursor-pointer"
              >
                New conversation
              </button>
            )}
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-[13px] font-medium text-black/50 hover:text-black transition-colors cursor-pointer"
            >
              Learn more
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-32 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
          <div className="w-full max-w-4xl">
            <BarVisualizer
              state="speaking"
              demo
              barCount={24}
              centerAlign
              minHeight={10}
              maxHeight={90}
              className="bg-transparent h-48 rounded-none"
            />
          </div>
        </div>

        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Experience podcasts
            <br />
            <span className="text-black/25">in a new way.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-lg sm:text-xl text-black/50 max-w-xl mx-auto leading-relaxed"
          >
            Verne uses AI to search, discover, and play the exact podcast
            moments that matter to you. Just ask.
          </motion.p>
        </motion.div>
      </section>

      {/* Chat Interface */}
      <section className="px-6 pb-16">
        <Websocket />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.4,
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
          }}
          className="max-w-2xl mx-auto"
        >
          {messages.length > 0 && (
            <div className="mb-4 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-[15px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-black text-white self-end max-w-[85%] ml-auto"
                      : "bg-black/[0.04] text-black/70 self-start max-w-[85%]"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          )}
          <QueryBlock />
          {podcasts.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              {podcasts.map((podcast, index) => (
                <FullPodcastCard key={index} podcast={podcast} />
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-black/[0.06]" />
      </div>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p
              custom={0}
              variants={fadeUp}
              className="text-[13px] font-medium text-black/40 uppercase tracking-widest mb-4"
            >
              Features
            </motion.p>
            <motion.h2
              custom={1}
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Built for how you
              <br />
              actually listen.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-1"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  custom={i}
                  variants={fadeUp}
                  className="group p-8 rounded-xl border border-transparent hover:border-black/[0.06] hover:bg-black/[0.015] transition-all duration-300"
                >
                  <div className="size-10 rounded-lg bg-black/[0.04] flex items-center justify-center mb-4 group-hover:bg-black/[0.07] transition-colors">
                    <Icon className="size-5 text-black/60" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-tight mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-black/45">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-black/[0.06]" />
      </div>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p
              custom={0}
              variants={fadeUp}
              className="text-[13px] font-medium text-black/40 uppercase tracking-widest mb-4"
            >
              How it works
            </motion.p>
            <motion.h2
              custom={1}
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Simple, fast, precise.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="space-y-0"
          >
            {[
              {
                step: "01",
                title: "Ask anything",
                desc: "Type or speak your query — a topic, a question, even a vague idea.",
              },
              {
                step: "02",
                title: "AI finds the moments",
                desc: "Our agent searches across podcasts to find the exact clips that match.",
              },
              {
                step: "03",
                title: "Listen instantly",
                desc: "Play clips right away. Jump to the moments that matter, skip the rest.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={fadeUp}
                className="flex gap-6 py-8 border-b border-black/[0.06] last:border-0 group"
              >
                <span className="text-[13px] font-mono text-black/20 pt-1 shrink-0 group-hover:text-black/40 transition-colors">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-[15px] text-black/45 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VerneLogo className="size-4 opacity-40" />
            <span className="text-[13px] text-black/30">Verne</span>
          </div>
          <p className="text-[13px] text-black/25">
            © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
