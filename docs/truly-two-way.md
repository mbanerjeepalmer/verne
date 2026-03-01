# Truly two way

We have an interface where the user can send queries to the agent. The agent responds with the results of ListenNotes searches. The user can send back additional queries. But the agent doesn't get context of what the user is listening to.

We want a flow where the user can be listening to a podcast and then invoke the voice transcription (or text box) and say 'Is this true?' and the backend agent sees the user's position in the current episode and other items in the current messages/episodes.

Think through how to implement this (I assume it's something along the lines of prepending to the user message or making a tool call beforehand).

Feel free to ask clarifying questions before starting.
