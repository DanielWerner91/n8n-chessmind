"use client";

import { useEffect, useRef } from "react";

export function TermlyEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termlyUuid = process.env.NEXT_PUBLIC_TERMLY_WEBSITE_UUID;

  useEffect(() => {
    if (!containerRef.current || !termlyUuid) return;

    const embedDiv = document.createElement("div");
    embedDiv.setAttribute("name", "termly-embed");
    embedDiv.setAttribute("data-id", termlyUuid);
    embedDiv.setAttribute("data-type", "iframe");
    containerRef.current.appendChild(embedDiv);

    const script = document.createElement("script");
    script.src = "https://app.termly.io/embed-policy.min.js";
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [termlyUuid]);

  return <div ref={containerRef} className="min-h-[600px]" />;
}
