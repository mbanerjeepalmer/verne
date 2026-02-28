# Messages interface

We currently have a hardcoded frontend. We are able to record audio and have it be transcribed or simply type in the text. I believe that currently when we press 'Submit' nothing happens.

We now want hardcoded responses from the backend. When the text is submitted we want the NextJS backend (in `frontend-v2`) to hit the Hono server (currently in `backend/server.ts`) to post a message asking for clarification. Then after the second submit it hits the Hono server again, but this time with a message and three podcast episodes.

Look at the makefile to find out how to run both servers.
