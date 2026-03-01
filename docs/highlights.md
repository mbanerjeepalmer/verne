# Highlights

We already have a data model that supports the notion of highlights. These are timestamps and sections of text. You can see examples in `frontend-v2/src/data/mock-episodes.ts`.

But we're not getting that from the Mistral Vibe agent. There are a couple of reasons for this:
1. The agent can't transcribe audio with diarisation. ListenNotes does sometimes provide transcripts, but it's unclear whether those are timestamped. (If they are, happy days.) So we need to use Voxtral as a CLI via Bedrock (or Mistral API to start with if Bedrock is being difficult).
2. The post-episodes interface doesn't support highlights.


Note that transcription is likely to take some time. Therefore we'll want the agent to post the episodes basically immediately, transcribe them then post them again, including diarised transcripts and highlights.
