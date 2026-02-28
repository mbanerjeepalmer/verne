"use client";

import { FullPodcastCard } from "@/components/full-podcast-card";
import PageLayout from "@/components/page-layout/page-layout";
import QueryBlock from "@/components/query-block/query-block";
import Spacer from "@/components/spacer/spacer";
import TTSPlayer from "@/components/tts-player/tts-player";
import Websocket from "@/components/websocket/websocket";
import { usePodcasts } from "@/stores/usePodcasts";

export default function Home() {
  const { podcasts } = usePodcasts();
  return (
    <PageLayout>
      <Websocket />
      <QueryBlock />
      <Spacer size="large" />
      <TTSPlayer text="This is a test" />
      <Spacer size="medium" />
      {podcasts.map((podcast, index) => (
        <FullPodcastCard key={index} podcast={podcast} />
      ))}
    </PageLayout>
  );
}
