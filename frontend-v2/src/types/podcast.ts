export interface IHighlight {
  timestamp: number;
  text?: string;
}

export interface IPodcast {
  name: string;
  src: string;
  duration: number;
  cover_image: string;
  start_time: number;
  end_time: number;
  highlights?: IHighlight[];
  description?: string;
  pub_date_ms?: number;
  podcast_title?: string;
  publisher?: string;
  link?: string;
}
