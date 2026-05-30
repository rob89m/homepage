import useSWR from "swr";

export default function ServiceStatus({ groupName, serviceName, style }) {
  const { data, error } = useSWR(
    `/api/serviceStatus?${new URLSearchParams({ groupName, serviceName }).toString()}`,
    { refreshInterval: 30000 },
  );

  let colorClass = "text-black/20 dark:text-white/40 opacity-20";
  let backgroundClass = "bg-theme-500/10 dark:bg-theme-900/50 px-1.5 py-0.5";
  let statusTitle = "Service Status";
  let statusText = "";

  if (error || (data && data.error)) {
    colorClass = "text-rose-500";
    statusText = "ERR";
    statusTitle = "Service Status: Error";
  } else if (!data) {
    statusText = "...";
    statusTitle = "Service Status: Checking…";
  } else if (data.online) {
    colorClass = "text-emerald-500/80";
    statusTitle = `Service Status: Online (${data.protocol}:${data.port})`;
    statusText = "UP";
  } else {
    colorClass = "text-rose-500/80";
    statusTitle = `Service Status: Offline (${data.protocol}:${data.port})`;
    statusText = "DOWN";
  }

  if (style === "dot") {
    backgroundClass = "p-4";
    colorClass = colorClass.replace(/text-/g, "bg-").replace(/\/\d\d/g, "");
    return (
      <div className={`w-auto text-center rounded-b-[3px] overflow-hidden service-status ${backgroundClass}`} title={statusTitle}>
        <div className={`rounded-full h-3 w-3 ${colorClass}`} />
      </div>
    );
  }

  // Traffic light circle indicator
  const dotColor = error || (data && data.error)
    ? "bg-rose-500"
    : !data
      ? "bg-gray-400"
      : data.online
        ? "bg-emerald-500"
        : "bg-rose-500";

  return (
    <div
      className={`w-auto text-center rounded-b-[3px] overflow-hidden service-status ${backgroundClass} flex items-center gap-1`}
      title={statusTitle}
    >
      <div className={`rounded-full h-2.5 w-2.5 shrink-0 ${dotColor}`} />
      <div className={`font-bold uppercase text-[8px] ${colorClass}`}>{statusText}</div>
    </div>
  );
}
