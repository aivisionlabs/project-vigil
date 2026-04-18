import React from "react";
import type { DataMeta } from "../types";

interface DataBadgeProps {
  meta: DataMeta;
  className?: string;
}

export const DataBadge: React.FC<DataBadgeProps> = ({
  meta,
  className = "",
}) => {
  const isLive = meta.source === "live";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2 w-2">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-clean opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-status-clean" : "bg-status-warning"}`}
        />
      </span>
      <span className="text-xs text-text-tertiary">
        {meta.fetchedAt && (
          <span className="ml-1 text-text-tertiary/50 font-data">
            {new Date(meta.fetchedAt).toLocaleTimeString()}
          </span>
        )}
      </span>
      {meta.reason && !isLive && (
        <span className="text-xs text-status-warning/70" title={meta.reason}>
          — {meta.reason}
        </span>
      )}
    </div>
  );
};
