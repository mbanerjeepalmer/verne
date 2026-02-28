"use client";

import PageLayout from "@/components/page-layout/page-layout";
import QueryBlock from "@/components/query-block/query-block";
import { PodcastClipCard } from "@/components/podcast-clip-card";
import { FullPodcastCard } from "@/components/full-podcast-card";
import { PodcastClipCardSkeleton } from "@/components/podcast-clip-card-skeleton";
import Spacer from "@/components/spacer/spacer";
import type { IPodcast } from "@/types/podcast";

export default function Home() {
  const clips: IPodcast[] = [
    {
      name: "Event-Driven Architecture with Kafka",
      src: "",
      duration: 3300, // 55:00
      cover_image:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&h=128&fit=crop&q=80",
      start_time: 322,  // 05:22
      end_time: 752,     // 12:32 (7:10 clip)
    },
    {
      name: "Kafka Streams for Real-Time Data Pipelines",
      src: "",
      duration: 2700, // 45:00
      cover_image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=128&h=128&fit=crop&q=80",
      start_time: 848,  // 14:08
      end_time: 1238,   // 20:38 (6:30 clip)
    },
    {
      name: "Scaling Microservices with Apache Kafka",
      src: "",
      duration: 3600, // 60:00
      cover_image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&q=80",
      start_time: 525,  // 08:45
      end_time: 1020,   // 17:00 (8:15 clip)
    },
  ];

  const fullPodcasts: IPodcast[] = [
    {
      name: "System Design for Real-Time Architectures",
      src: "",
      duration: 2900, // ~48:20
      cover_image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&q=80",
      start_time: 765,  // 12:45 (current position)
      end_time: 2900,
    },
  ];

  return (
    <PageLayout>
      <QueryBlock />
      <Spacer size="large" />
      <div className="w-full max-w-2xl px-2">
        <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6 pl-1 uppercase">
          Clips from Podcasts
        </h2>

        <div className="flex flex-col gap-5 mb-12">
          {clips.map((clip, idx) => (
            <PodcastClipCard key={idx} podcast={clip} />
          ))}
        </div>

        <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6 pl-1 uppercase mt-10">
          Full Episodes
        </h2>

        <div className="flex flex-col gap-5">
          {fullPodcasts.map((pod, idx) => (
            <FullPodcastCard key={idx} podcast={pod} />
          ))}
        </div>

        <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6 pl-1 uppercase mt-10">
          Loading States (Skeletons)
        </h2>

        <div className="flex flex-col gap-5">
          <PodcastClipCardSkeleton />
          <PodcastClipCardSkeleton />
        </div>
      </div>
    </PageLayout>
  );
}
