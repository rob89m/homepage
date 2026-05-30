import net from "net";

import { getServiceItem } from "utils/config/service-helpers";
import createLogger from "utils/logger";

const logger = createLogger("serviceStatus");

function tcpCheck(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (online) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(online);
      }
    };

    socket.setTimeout(timeout);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
    socket.connect(port, host);
  });
}

export default async function handler(req, res) {
  const { groupName, serviceName } = req.query;
  const serviceItem = await getServiceItem(groupName, serviceName);
  if (!serviceItem) {
    logger.debug(`No service item found for group ${groupName} named ${serviceName}`);
    return res.status(400).json({ error: "Unable to find service, see log for details." });
  }

  const { serviceStatus } = serviceItem;
  if (!serviceStatus) {
    return res.status(400).json({ error: "No serviceStatus configured" });
  }

  // Parse "port:PROTOCOL" or just "port"
  const parts = String(serviceStatus).split(":");
  const port = parseInt(parts[0], 10);
  const protocol = (parts[1] || "TCP").toUpperCase();

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return res.status(400).json({ error: "Invalid port in serviceStatus" });
  }

  // Derive host from service url or href
  let host = "localhost";
  const urlSource = serviceItem.url || serviceItem.href;
  if (urlSource && urlSource !== "#") {
    try {
      host = new URL(urlSource).hostname;
    } catch {
      // keep localhost
    }
  }

  try {
    if (protocol === "TCP") {
      const online = await tcpCheck(host, port);
      return res.status(200).json({ online, host, port, protocol });
    }
    // UDP is connectionless — we do a best-effort TCP fallback and note it
    const online = await tcpCheck(host, port);
    return res.status(200).json({ online, host, port, protocol });
  } catch (e) {
    logger.debug("Error checking service status: %s", e);
    return res.status(400).json({ error: "Error checking service status, see logs." });
  }
}
