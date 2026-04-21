"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@/lib/shared/react-query";
import { projectsApi } from "@/lib/projects/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus, Loader2 } from "lucide-react";

export function UserCreationDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => projectsApi.createUser({ email, password, isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User account created successfully");
      setOpen(false);
      setEmail("");
      setPassword("");
      setIsAdmin(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-bold h-10 px-6">
          <UserPlus className="size-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-border/50 shadow-2xl">
        <DialogHeader>
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Plus className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Provision Account</DialogTitle>
          <DialogDescription className="text-sm">
            Create a new platform user. They will be able to log in immediately and request project access.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-muted/30"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Temporary Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-muted/30"
            />
            <p className="text-[10px] text-muted-foreground italic">Minimum 8 characters required.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/10">
            <div className="space-y-0.5">
              <Label htmlFor="admin" className="text-sm font-bold">Platform Super Admin</Label>
              <p className="text-xs text-muted-foreground">Grant full access to system infrastructure.</p>
            </div>
            <Switch
              id="admin"
              checked={isAdmin}
              onCheckedChange={setIsAdmin}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => mutation.mutate()}
            disabled={!email || password.length < 8 || mutation.isPending}
            className="w-full h-11 font-bold"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Provisioning...
              </>
            ) : (
              "Deploy Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
