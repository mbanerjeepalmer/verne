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
}
