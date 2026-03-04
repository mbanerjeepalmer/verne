import { Template, waitForPort } from "e2b";

export const vibeTemplate = Template()
  .fromPythonImage("3.12")
  .aptInstall(["jq"])
  .pipInstall([
    "anthropic",
    "fastapi",
    "uvicorn",
    "requests",
    "opentelemetry-api",
    "opentelemetry-sdk",
    "opentelemetry-exporter-otlp-proto-http",
    "opentelemetry-processor-baggage",
  ])
  .copy("server.py", "/home/user/server.py")
  .copy("agent_loop.py", "/home/user/agent_loop.py")
  .setStartCmd(
    "cd /home/user && python -m uvicorn server:app --host 0.0.0.0 --port 8000",
    waitForPort(8000),
  );
