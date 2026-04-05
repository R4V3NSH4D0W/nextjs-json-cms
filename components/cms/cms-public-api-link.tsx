"use client";

import { ExternalLink } from "lucide-react";
import { absoluteApiUrl } from "@/lib/cms/absolute-url";
import { trimPublicApiPathDisplay } from "@/lib/cms/public-site-api-paths";

export interface CmsPublicApiLinkProps {
  /** Path starting with `/api/v1/cms/...` */
  apiPath: string;
  /** Extra context for the link tooltip */
  titleHint?: string;
}

/**
 * Opens the public JSON URL for a CMS resource (new tab), same idea as the CMS pages list.
 */
export function CmsPublicApiLink({ apiPath, titleHint }: CmsPublicApiLinkProps) {
  const href = absoluteApiUrl(apiPath);
  const title = titleHint ? `${href}\n${titleHint}` : href;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 font-mono text-xs text-primary underline-offset-2 hover:underline"
      title={title}
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      <span className="min-w-0 truncate">{trimPublicApiPathDisplay(apiPath)}</span>
    </a>
  );
}
