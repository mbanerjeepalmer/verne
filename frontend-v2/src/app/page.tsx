"use client";

import { FullPodcastCard } from "@/components/full-podcast-card";
import PageLayout from "@/components/page-layout/page-layout";
import QueryBlock from "@/components/query-block/query-block";
import Spacer from "@/components/spacer/spacer";
import Websocket from "@/components/websocket/websocket";
import { usePodcasts } from "@/stores/usePodcasts";

export default function Home() {
  const { podcasts, message } = usePodcasts();
  return (
    <PageLayout>
      <Websocket />
      <QueryBlock />
      <Spacer size="large" />

      {message && (
        <>
          <div className="w-full max-w-2xl px-2">
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">{message}</p>
            </div>
          </div>
          <Spacer size="medium" />
        </>
      )}

      {podcasts.length > 0 && (
        <div className="w-full max-w-2xl px-2">
          <div className="flex flex-col gap-4">
            {podcasts.map((podcast, index) => (
              <FullPodcastCard key={index} podcast={podcast} />
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
