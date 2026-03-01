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
    description: "The catastrophic implosion of the OceanGate Titan submersible shocked the world. We examine the engineering hubris, ignored warnings, and what it means for the future of deep sea exploration.",
    pub_date_ms: 1687910400000,
    podcast_title: "60 Minutes Extra Minutes",
    publisher: "60 Minutes Australia",
    highlights: [
      { timestamp: 45, text: "Background on the Oceangate Titan expedition" },
      { timestamp: 312, text: "Engineering failures and warning signs" },
      { timestamp: 580, text: "Human hubris in extreme exploration" },
      { timestamp: 890, text: "Impact on deep sea research going forward" },
    ],
  },
  {
    name: "Ocean Exploration Trust - Live Streamed Deep Sea Exploration with the EV Nautilus",
    src: "https://audio.listennotes.com/e/p/9e5e854676a54b65b5cdaac4603e2661/",
    duration: 1914,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/ocean-science-radio-ocean-science-radio-pojL4mEaJKk-XpKOU61VIZc.1400x1400.jpg",
    start_time: 0,
    end_time: 1914,
    description: "Dr. Robert Ballard's Ocean Exploration Trust takes us aboard the EV Nautilus for live-streamed deep sea dives, discovering new species and mapping the ocean floor in real time.",
    pub_date_ms: 1695168000000,
    podcast_title: "Ocean Science Radio",
    publisher: "Ocean Science Radio",
    highlights: [
      { timestamp: 120, text: "What is the Ocean Exploration Trust?" },
      { timestamp: 490 },
      { timestamp: 830, text: "Live streaming from the deep ocean floor" },
      { timestamp: 1400, text: "Species discovered on recent dives" },
    ],
  },
  {
    name: "Into the Unknown: Dangers of Deep Sea Exploration",
    src: "https://audio.listennotes.com/e/p/5f6a85130feb409b81979a1032dcf182/",
    duration: 1065,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/off-the-radar-the-national-weather-desk-2oKg9kmYJ8e-idOqa6fPsz5.1400x1400.jpg",
    start_time: 0,
    end_time: 1065,
    description: "From crushing pressures to equipment failures, deep sea exploration remains one of humanity's most dangerous endeavours. We break down the physics and the risks.",
    pub_date_ms: 1690502400000,
    podcast_title: "Off The Radar",
    publisher: "The National Weather Desk",
    highlights: [
      { timestamp: 60, text: "The physics of deep sea pressure" },
      { timestamp: 350, text: "Submersible design and safety" },
      { timestamp: 700, text: "What went wrong with the OceanGate Titan" },
    ],
  },
  {
    name: "Deep sea exploration",
    src: "https://audio.listennotes.com/e/p/a498fa0d2765484bb60d0c2dfac1ba96/",
    duration: 2242,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/discovery-bbc-world-service-CkZcqWFOxB9-HD-NUTMYr9I.1400x1400.jpg",
    start_time: 0,
    end_time: 2242,
    podcast_title: "Discovery",
    publisher: "BBC World Service",
  },
  {
    name: "PIT STOP: The Deep Sea Exploration Straight Out of a HORROR FLICK",
    src: "https://audio.listennotes.com/e/p/b5132861b3214fb9add4204a556324bd/",
    duration: 285,
    cover_image:
      "https://cdn-images-3.listennotes.com/podcasts/cryptids-across/pit-stop-the-deep-sea-MO2n9DIgPGJ-25cxj8mhqtF.1400x1400.jpg",
    start_time: 0,
    end_time: 285,
    description: "A quick dive into a real deep-sea expedition that went terrifyingly wrong — stranger than any horror movie.",
    pub_date_ms: 1701388800000,
    podcast_title: "Cryptids Across",
    publisher: "Cryptids Across",
  },
];
