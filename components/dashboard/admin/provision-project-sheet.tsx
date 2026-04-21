"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Server, Mail, Info } from "lucide-react";

export function ProvisionProjectSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [handoverEmail, setHandoverEmail] = useState("");

  const queryClient = useQueryClient();

  const createProject = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name,
        slug: slug || undefined,
        description: description || undefined,
        allowedOrigins: ["http://localhost:3000"],
        handoverEmail: handoverEmail.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setSlug("");
      setDescription("");
      setHandoverEmail("");
      setOpen(false);
      toast.success("Project provisioned successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2 shadow-sm font-bold">
          <Plus className="size-4" /> Provision Project
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md border-l border-border bg-card/95 backdrop-blur-md">
        <SheetHeader className="space-y-4 pb-6 border-b border-border/50">
          <div className="flex items-center gap-2 text-primary">
            <Server className="size-5" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]">New Instance</p>
          </div>
          <SheetTitle className="text-2xl font-bold">Deploy Tenant</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">
            Configure a new isolated Project CMS environment. This will provision dedicated database scopes and security domains.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-8">
          <div className="space-y-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Identity</Label>
                <div className="space-y-3">
                  <Input
                    placeholder="Project Name (e.g. Acme Marketing)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50 border-border/60 focus:ring-primary/20"
                  />
                  <div className="relative">
                    <Input
                      placeholder="Slug (e.g. acme-marketing)"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="bg-background/50 border-border/60 focus:ring-primary/20 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/50">
                      url-safe
                    </div>
                  </div>
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Context</Label>
                <Textarea
                  placeholder="What is the primary purpose of this project?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background/50 border-border/60 min-h-[120px] resize-none focus:ring-primary/20"
                />
             </div>

             <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Owner</Label>
                  <Mail className="size-3.5 text-muted-foreground/40" />
                </div>
                <Input
                  placeholder="Developer or Manager Email"
                  value={handoverEmail}
                  onChange={(e) => setHandoverEmail(e.target.value)}
                  className="bg-background/50 border-border/60 focus:ring-primary/20"
                />
                <div className="flex items-start gap-2 px-1 py-1">
                  <Info className="size-3 text-muted-foreground mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    This user will be automatically granted <span className="text-foreground font-semibold">Manager</span> permissions on the project.
                  </p>
                </div>
             </div>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 w-full p-6 bg-card/80 backdrop-blur-sm border-t border-border/50">
          <Button
            className="w-full font-bold h-12 text-base"
            onClick={() => createProject.mutate()}
            disabled={!name.trim() || createProject.isPending}
          >
            {createProject.isPending ? "Provisioning Agent Active..." : "Deploy Tenant Instance"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
