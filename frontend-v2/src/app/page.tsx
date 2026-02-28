"use client";

import PageLayout from "@/components/page-layout/page-layout";
import QueryBlock from "@/components/query-block/query-block";
import Spacer from "@/components/spacer/spacer";
import TTSPlayer from "@/components/tts-player/tts-player";
import Websocket from "@/components/websocket/websocket";

export default function Home() {
  return (
    <PageLayout>
      <Websocket />
      <QueryBlock />
      <Spacer size="large" />
      <TTSPlayer text="This is a test" />
    </PageLayout>
  );
}
