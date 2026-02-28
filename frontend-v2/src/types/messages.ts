import { IPodcast } from "./podcast";

export interface BroadcastMessage {
  event_type: string;
  payload: {
    message?: string;
    podcast?: IPodcast;
    podcasts?: IPodcast[];
  };
}
