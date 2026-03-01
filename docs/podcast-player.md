This application needs to function as a podcast player. That means:
- ensure that episodes posted to the client are actually playable audio
- all the rest of the standard player behaviours such as only one item playing at a time, volume control

Your process:
1. Start by running the application as normal, submit a query from the homepage and then a follow-up. 
2. Grab the data that was actually posted across and then you can use that for mocking/testing (so that we're not hitting the real agent all the time).
3. Build all the standard podcast player functionality around it.

Notes:
- You should do this in very small stages, you should ask my permission to move along at each step.
- Importantly we need a concept of clips/slices/highlights/whatever term you think is appropriate. These should be stacked underneath each player with timestamps and, optionally, text visible (similar to YouTube's pattern).
- If an episode is playing and we try to scroll past it, then stickied to either the top or sitting above the input field of the scrollable chat interface so that we don't lose it
- You'll likely need to bulk out a lot of the data exchange. We may need changes to the post episodes tool. For example if we get an episode we (by the time you reach one of your last stages) need to be able to view the episode's show. But don't worry about this at first.
