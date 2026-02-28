import { usePodcasts } from "@/stores/usePodcasts";
import QueryBlock from "../query-block/query-block";
import Spacer from "../spacer/spacer";
import { FullPodcastCard } from "../full-podcast-card";
import { BlurFade } from "../ui/blur-fade";
import { MOCK_PODCASTS } from "@/mocks/podcasts";

const MockPodcastsSection = () => {
  const { podcasts, setPodcasts } = usePodcasts();

  const handleSubmit = (text: string) => {
    console.log("Text from query block: ", text);
    setPodcasts(MOCK_PODCASTS);
  };

  return (
    <div className="w-full">
      <QueryBlock onSubmit={handleSubmit} />
      <Spacer size="small" />
      <div className="space-y-2">
        {podcasts.map((podcast, index) => (
          <BlurFade key={index} className="w-full" delay={0.05 * index}>
            <FullPodcastCard key={index} podcast={podcast} />
          </BlurFade>
        ))}
      </div>
    </div>
  );
};

export default MockPodcastsSection;
