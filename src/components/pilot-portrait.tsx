"use client";

import Image from "next/image";
import { useState } from "react";

export function PilotPortrait({ name, photo }: { name: string; photo?: readonly [url: string, file: string] }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]);
  return (
    <figure className="pilot-portrait">
      <div className="pilot-portrait__frame">
        {photo && !failed ? (
          <Image alt={name} src={photo[0]} fill sizes="(max-width: 600px) 96px, 136px" unoptimized onError={() => setFailed(true)} />
        ) : (
          <span className="pilot-portrait__initials mono" role="img" aria-label="Foto indisponível">
            {initials[0]}{initials.length > 1 ? initials.at(-1) : null}
          </span>
        )}
      </div>
      <figcaption>
        {photo && !failed ? <a href={"https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(photo[1])}>Créditos da foto ↗</a> : "Foto indisponível"}
      </figcaption>
    </figure>
  );
}
