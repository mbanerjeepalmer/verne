import type { IPodcast } from "@/types/podcast";

// TODO: Check whether we should use ListenNotes wrapper URLs (e.g. https://audio.listennotes.com/e/p/<id>/)
// or the raw redirect targets (e.g. https://pdst.fm/e/traffic.omny.fm/...).
// ListenNotes URLs may offer more consistency/reliability across episodes,
// but the raw URLs avoid an extra redirect hop.

export const MOCK_EPISODES: IPodcast[] = [
  {
    name: "Oceangate Titan sub, human hubris, and the impact on deep sea exploration",
    src: "https://audio.listennotes.com/e/p/e078c14aa9244fc09bc36910afa4d963/",
    duration: 1207,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/60-minutes-extra-minutes-60-minutes-australia-BN_SwqY6MFc-B3qiJeZaIXd.1400x1400.jpg",
    start_time: 0,
    end_time: 1207,
  },
  {
    name: "Ocean Exploration Trust - Live Streamed Deep Sea Exploration with the EV Nautilus",
    src: "https://audio.listennotes.com/e/p/9e5e854676a54b65b5cdaac4603e2661/",
    duration: 1914,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/ocean-science-radio-ocean-science-radio-pojL4mEaJKk-XpKOU61VIZc.1400x1400.jpg",
    start_time: 0,
    end_time: 1914,
  },
  {
    name: "Into the Unknown: Dangers of Deep Sea Exploration",
    src: "https://audio.listennotes.com/e/p/5f6a85130feb409b81979a1032dcf182/",
    duration: 1065,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/off-the-radar-the-national-weather-desk-2oKg9kmYJ8e-idOqa6fPsz5.1400x1400.jpg",
    start_time: 0,
    end_time: 1065,
  },
  {
    name: "Deep sea exploration",
    src: "https://audio.listennotes.com/e/p/a498fa0d2765484bb60d0c2dfac1ba96/",
    duration: 2242,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/discovery-bbc-world-service-CkZcqWFOxB9-HD-NUTMYr9I.1400x1400.jpg",
    start_time: 0,
    end_time: 2242,
  },
  {
    name: "PIT STOP: The Deep Sea Exploration Straight Out of a HORROR FLICK",
    src: "https://audio.listennotes.com/e/p/b5132861b3214fb9add4204a556324bd/",
    duration: 285,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/cryptids-across/pit-stop-the-deep-sea-MO2n9DIgPGJ-25cxj8mhqtF.1400x1400.jpg",
    start_time: 0,
    end_time: 285,
  },
];
