"use client";

import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();

  // The event landing page carries its own sponsor credits, so we hide the
  // global "Created by" footer there only.
  if (pathname === "/event") return null;

  return (
    <footer className="py-4 text-center flex-shrink-0">
      <p className="text-xs text-muted-light font-light">
        Created by{" "}
        <a
          href="https://www.launchbox.live/agency"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-muted transition-colors"
        >
          LaunchBox
        </a>
      </p>
    </footer>
  );
}
