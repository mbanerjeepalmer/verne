import { Template, waitForPort } from "e2b";

export const vibeTemplate = Template()
  .fromPythonImage("3.12")
  .pipInstall(["mistral-vibe", "fastapi", "uvicorn"])
  .copy("server.py", "/home/user/server.py")
  .setStartCmd(
    "cd /home/user && python -m uvicorn server:app --host 0.0.0.0 --port 8000",
    waitForPort(8000)
  );
