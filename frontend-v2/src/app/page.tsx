import { PodcastClipCard } from "@/components/podcast-clip-card"
import { FullPodcastCard } from "@/components/full-podcast-card"
import { PodcastClipCardSkeleton } from "@/components/podcast-clip-card-skeleton"

export default function Home() {
  const clips = [
    {
      podcastName: "Software Engineering Daily",
      title: "Event-Driven Architecture with Kafka",
      clipLength: "7:10",
      clipStartTime: "05:22",
      fullEpisodeLength: "55:00",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&h=128&fit=crop&q=80",
    },
    {
      podcastName: "Data Engineering Podcast",
      title: "Kafka Streams for Real-Time Data Pipelines",
      clipLength: "6:30",
      clipStartTime: "14:08",
      fullEpisodeLength: "45:00",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=128&h=128&fit=crop&q=80",
    },
    {
      podcastName: "The Distributed Systems Pod",
      title: "Scaling Microservices with Apache Kafka",
      clipLength: "8:15",
      clipStartTime: "08:45",
      fullEpisodeLength: "60:00",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&q=80",
    },
  ]

  const fullPodcasts = [
    {
      podcastName: "The Distributed Systems Pod",
      title: "System Design for Real-Time Architectures",
      currentTimeString: "12:45",
      totalTimeString: "48:20",
      progressValue: (12.75 / 48.33) * 100, // Roughly 26%
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&h=128&fit=crop&q=80",
    }
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center py-20 px-6 font-sans">
      <div className="w-full max-w-2xl px-2">
        <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6 pl-1 uppercase">
          Clips from Podcasts
        </h2>

        <div className="flex flex-col gap-5 mb-12">
          {clips.map((clip, idx) => (
            <PodcastClipCard
              key={idx}
              podcastName={clip.podcastName}
              title={clip.title}
              clipStartTime={clip.clipStartTime}
              clipLength={clip.clipLength}
              fullEpisodeLength={clip.fullEpisodeLength}
              imageUrl={clip.imageUrl}
            />
          ))}
        </div>

        <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6 pl-1 uppercase mt-10">
          Full Episodes
        </h2>

        <div className="flex flex-col gap-5">
          {fullPodcasts.map((pod, idx) => (
            <FullPodcastCard
              key={idx}
              podcastName={pod.podcastName}
              title={pod.title}
              currentTimeString={pod.currentTimeString}
              totalTimeString={pod.totalTimeString}
              progressValue={pod.progressValue}
              imageUrl={pod.imageUrl}
            />
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
    </div>
  )
}
