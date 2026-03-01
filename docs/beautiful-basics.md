# Beautiful basics
1. Each episode should have all the basic fields mentioned in `docs/podcast-player.md` such as date, description, transcript (if available). This will almost certainly involve backend changes to the `listennotes` CLI so that Vibe can send all the correct fields onwards.
2. The recording and transcription should stop once the user submits the query.
3. Stopping the recording should not result in a duplicate of the transcript being inserted into the text box.
4. Let's stop treating messages as special. The app should start playing the first item in the list, even if that's a message. Once it's finished with the first, it moves on to the second. We can stop the message player, just like the episodes. Equally, it should ensure that starting another message/episode playback should interrupt the other (just as happens between episodes).
5. The UI shouldn't feel so 'chatbot'-like. All messages should be more justified/centred.
6. Work through the whole flow. Identify moments of jank. Raise them with me and I'll tell you how to proceed.
