"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { Button } from "@/components/ui/button";

export default function CmsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentProject, currentAccess } = useCurrentProject();

  if (!currentProject || !currentAccess?.hasProjectAccess) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="size-10 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Project access required</h2>
          <p className="text-sm text-muted-foreground">
            Select a project you can administer before using CMS tools.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return children;
}
