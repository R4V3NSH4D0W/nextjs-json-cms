"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProjectMember,
  ProjectToken,
  ProjectUserDirectoryEntry,
} from "@/lib/projects/api";
import {
  ShieldCheck,
  Users,
  Key,
  Layers,
  ChevronLeft,
  Globe,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  Info,
  RotateCcw,
  FileText,
  ImageIcon,
  Timer,
  Trash2 as DeleteIcon,
} from "lucide-react";
import { cn } from "@/lib/shared/utils";

type ProjectFields = {
  name: string;
  description: string;
  primaryDomain: string;
  allowedOrigins: string;
};

export function ProjectSummaryStats(props: {
  memberCount: number;
  tokenCount: number;
  serviceCount: number;
  isLoading?: boolean;
}) {
  const stats = [
    {
      label: "Team Members",
      value: props.memberCount,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active Tokens",
      value: props.tokenCount,
      icon: Key,
      color: "text-amber-500",
    },
    {
      label: "Platform Services",
      value: props.serviceCount,
      icon: Layers,
      color: "text-primary",
    },
    {
      label: "Security Status",
      value: "Verified",
      icon: ShieldCheck,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-xl font-bold tabular-nums">
                {props.isLoading ? "..." : stat.value}
              </p>
            </div>
            <div className={cn("p-2 rounded-lg bg-background/50", stat.color)}>
              <stat.icon className="size-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProjectSettingsHero(props: {
  projectName: string;
  projectSlug: string;
  isAdmin: boolean;
  canManageProject: boolean;
  memberRole: "admin" | null;
}) {
  const roleLabel = props.isAdmin ? "Super admin" : props.memberRole ? "Project admin" : "Viewer";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={props.isAdmin ? "/admin/projects" : "/dashboard"}
          className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        >
          <ChevronLeft className="size-3" /> All Projects
        </Link>
        <span>•</span>
        <span>Project Settings</span>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{props.projectName}</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {props.projectSlug}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="h-6">
              <ShieldCheck className="mr-1 size-3.5" />
              {roleLabel}
            </Badge>
            <span>
              {props.canManageProject
                ? "Can manage project"
                : "Read-only access"}
            </span>
          </div>
        </div>

        <div>
          <Button variant="outline" size="sm" asChild className="h-9 gap-2">
            <Link
              href={`/dashboard/projects/select?slug=${encodeURIComponent(props.projectSlug)}&redirect=/dashboard`}
            >
              Open Project Dashboard <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProjectProfileCard(props: {
  fields: ProjectFields;
  onFieldChange: (key: keyof ProjectFields, value: string) => void;
  onSave: () => void;
  savePending: boolean;
}) {
  const origins = props.fields.allowedOrigins
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Globe className="size-4" />
          <span className="text-xs uppercase tracking-wide">
            Project Profile
          </span>
        </div>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Update project details and allowed origins for API access.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Project name
              </label>
              <Input
                placeholder="Project name"
                value={props.fields.name}
                onChange={(e) => props.onFieldChange("name", e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Shown in dashboard, logs, and notifications.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <Textarea
                placeholder="What this project is for"
                value={props.fields.description}
                onChange={(e) =>
                  props.onFieldChange("description", e.target.value)
                }
                className="min-h-35 resize-none"
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Primary domain
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="https://example.com"
                  value={props.fields.primaryDomain}
                  onChange={(e) =>
                    props.onFieldChange("primaryDomain", e.target.value)
                  }
                  className="h-10 pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4" /> Allowed origins
                </label>
              </div>

              {origins.length > 0 && (
                <div className="flex min-h-12 flex-wrap gap-2 rounded-md border p-3">
                  {origins.map((origin, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="font-mono text-xs"
                    >
                      {origin}
                    </Badge>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="https://app.example.com&#10;https://staging.example.com"
                value={props.fields.allowedOrigins}
                onChange={(e) =>
                  props.onFieldChange("allowedOrigins", e.target.value)
                }
                rows={4}
                className="p-3 font-mono text-xs"
              />
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Enter one origin per line. Wildcards are not supported.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button
            onClick={props.onSave}
            disabled={props.savePending}
            className="h-10 px-6"
          >
            {props.savePending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectTokensCard(props: {
  newTokenLabel: string;
  onTokenLabelChange: (value: string) => void;
  onCreateToken: () => void;
  createTokenPending: boolean;
  plainToken: string | null;
  tokens: ProjectToken[];
  onRevokeToken: (tokenId: string) => void;
  revokeTokenPending: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <Key className="size-4" />
          <span className="text-xs uppercase tracking-wide">API Tokens</span>
        </div>
        <CardTitle>Access Tokens</CardTitle>
        <CardDescription>
          Create and revoke tokens used by external clients.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-5">
        <div className="flex gap-2">
          <Input
            placeholder="Token label (for example: Production Frontend)"
            value={props.newTokenLabel}
            onChange={(e) => props.onTokenLabelChange(e.target.value)}
            className="h-10"
          />
          <Button
            onClick={props.onCreateToken}
            disabled={!props.newTokenLabel.trim() || props.createTokenPending}
            className="h-10 px-4"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {props.plainToken ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-700/40 dark:bg-amber-950/20">
            <div className="mb-2 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
              <Lock className="size-3.5" /> Copy token now
            </div>
            <p className="mb-2 text-muted-foreground">
              This token is shown once and cannot be viewed again.
            </p>
            <div className="select-all break-all rounded border bg-background p-2 font-mono text-[11px]">
              {props.plainToken}
            </div>
          </div>
        ) : null}

        <div className="min-h-50 max-h-100 flex-1 space-y-3 overflow-y-auto pr-1">
          {props.tokens.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed py-8 text-center">
              <ShieldCheck className="mb-2 size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tokens yet.</p>
            </div>
          ) : null}
          {props.tokens.map((token) => (
            <div
              key={token.id}
              className={cn(
                "rounded-md border p-3",
                token.active ? "bg-card" : "bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      token.active
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {token.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={token.active ? "outline" : "secondary"}
                      className="h-5 px-2 text-[10px]"
                    >
                      {token.active ? "Active" : "Archived"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => props.onRevokeToken(token.id)}
                  disabled={!token.active || props.revokeTokenPending}
                  className={cn(
                    "h-8 px-3",
                    token.active ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {token.active ? "Revoke" : "Revoked"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectGovernanceCard(props: {
  isAdmin: boolean;
  handoverEmail: string;
  onHandoverEmailChange: (value: string) => void;
  onHandover: () => void;
  handoverPending: boolean;
  memberUserId: string;
  onMemberUserIdChange: (value: string) => void;
  onAddMember: () => void;
  addMemberPending: boolean;
  users: ProjectUserDirectoryEntry[];
  usersLoading: boolean;
  newUserEmail: string;
  onNewUserEmailChange: (value: string) => void;
  newUserPassword: string;
  onNewUserPasswordChange: (value: string) => void;
  onCreateUser: () => void;
  createUserPending: boolean;
  members: ProjectMember[];
  onRemoveMember: (userId: string) => void;
  removeMemberPending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" />
          <span className="text-sm">Governance</span>
        </div>
        <CardTitle>Team and Access</CardTitle>
        <CardDescription>
          Manage project admins with simplified role controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid h-10 w-full grid-cols-1 sm:w-auto">
            <TabsTrigger value="members">Project admins</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {props.isAdmin ? (
              <div className="grid gap-6 rounded-md border p-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="size-4" /> Handover manager
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Transfer manager role by email.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Manager email address"
                      value={props.handoverEmail}
                      onChange={(e) =>
                        props.onHandoverEmailChange(e.target.value)
                      }
                      className="h-10"
                    />
                    <Button
                      onClick={props.onHandover}
                      disabled={
                        !props.handoverEmail.trim() || props.handoverPending
                      }
                      className="h-10"
                    >
                      Handover
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Plus className="size-4" /> Create user
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Create a user and then assign them to this project.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <Input
                      placeholder="new.user@example.com"
                      value={props.newUserEmail}
                      onChange={(e) =>
                        props.onNewUserEmailChange(e.target.value)
                      }
                      className="h-9"
                    />
                    <Input
                      placeholder="Security password (min 8 chars)"
                      type="password"
                      value={props.newUserPassword}
                      onChange={(e) =>
                        props.onNewUserPasswordChange(e.target.value)
                      }
                      className="h-9"
                    />
                    <Button
                      size="sm"
                      onClick={props.onCreateUser}
                      disabled={
                        !props.newUserEmail.trim() ||
                        props.newUserPassword.length < 8 ||
                        props.createUserPending
                      }
                      className="h-9"
                    >
                      Create user
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <label className="text-sm font-medium">Add existing user</label>
              <div className="flex gap-3">
                <Select
                  value={props.memberUserId}
                  onValueChange={props.onMemberUserIdChange}
                >
                  <SelectTrigger className="bg-background/50 border-border/60 flex-1 h-11">
                    <SelectValue
                      placeholder={
                        props.usersLoading
                          ? "Synchronizing Directory..."
                          : props.users.length === 0
                            ? "No users available"
                            : "Select a user"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {props.users.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                        disabled={user.alreadyMember}
                      >
                        {user.email}
                        {user.alreadyMember ? " (active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={props.onAddMember}
                  disabled={!props.memberUserId || props.addMemberPending}
                  className="h-11"
                >
                  Add member
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {props.members.length === 0 ? (
                <div className="col-span-full rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                  <Users className="size-8 mb-2" />
                  <p>No members assigned yet.</p>
                </div>
              ) : null}
              {props.members.map((member) => {
                return (
                  <Card key={member.user.id} className="border">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="truncate pr-4 text-sm font-medium">
                            {member.user.email}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase"
                            >
                              Project admin
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Joined{" "}
                              {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => props.onRemoveMember(member.user.id)}
                          disabled={props.removeMemberPending}
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Project admins have full CMS and service access by default in the simplified model.
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function formatRetentionCountdown(purgeEligibleAt: string): string {
  const now = Date.now();
  const target = new Date(purgeEligibleAt).getTime();
  const diffMs = target - now;
  if (!Number.isFinite(target) || diffMs <= 0) return "Eligible for purge";
  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h left`;
}

export function ProjectRecycleBinCard(props: {
  deletedPages: Array<{
    id: string;
    title: string;
    slug: string;
    deletedAt: string;
    purgeEligibleAt: string;
  }>;
  deletedBlocks: Array<{
    id: string;
    type: string;
    page: { title: string; slug: string };
    deletedAt: string;
    purgeEligibleAt: string;
  }>;
  mediaTrashItems: Array<{
    trashKey: string;
    type: "file" | "folder";
    name: string;
    originalRelativePath: string | null;
    previewUrl: string | null;
    deletedAt: string;
    purgeEligibleAt: string;
  }>;
  onRestorePage: (pageId: string) => void;
  onRestoreBlock: (blockId: string) => void;
  onRestoreMedia: (trashKey: string) => void;
  onPurgePage: (pageId: string) => void;
  onPurgeBlock: (blockId: string) => void;
  onPurgeMedia: (trashKey: string) => void;
  restorePending: boolean;
}) {
  const totalItems =
    props.deletedPages.length +
    props.deletedBlocks.length +
    props.mediaTrashItems.length;

  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <Trash2 className="size-4" />
          <span className="text-sm">Recycle Bin</span>
        </div>
        <CardTitle>Soft Deleted Content</CardTitle>
        <CardDescription>
          Retention window is 30 days. Restore items before they become eligible
          for permanent purge.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {totalItems === 0 ? (
          <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            Recycle bin is empty.
          </div>
        ) : (
          <Tabs defaultValue="pages" className="space-y-4">
            <TabsList className="grid h-10 w-full grid-cols-3">
              <TabsTrigger value="pages">
                Pages ({props.deletedPages.length})
              </TabsTrigger>
              <TabsTrigger value="blocks">
                Blocks ({props.deletedBlocks.length})
              </TabsTrigger>
              <TabsTrigger value="media">
                Media ({props.mediaTrashItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pages" className="space-y-3">
              {props.deletedPages.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No deleted pages.
                </p>
              ) : (
                props.deletedPages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="size-3.5" /> {page.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{page.slug}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Timer className="size-3" />{" "}
                        {formatRetentionCountdown(page.purgeEligibleAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => props.onRestorePage(page.id)}
                        disabled={props.restorePending}
                        className="h-8"
                      >
                        <RotateCcw className="size-3.5" /> Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Permanently delete page “${page.title}”? This cannot be undone.`,
                            )
                          ) {
                            props.onPurgePage(page.id);
                          }
                        }}
                        disabled={props.restorePending}
                      >
                        <DeleteIcon className="size-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="blocks" className="space-y-3">
              {props.deletedBlocks.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No deleted blocks.
                </p>
              ) : (
                props.deletedBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{block.type}</p>
                      <p className="text-xs text-muted-foreground">
                        Page: {block.page.title}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Timer className="size-3" />{" "}
                        {formatRetentionCountdown(block.purgeEligibleAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => props.onRestoreBlock(block.id)}
                        disabled={props.restorePending}
                        className="h-8"
                      >
                        <RotateCcw className="size-3.5" /> Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Permanently delete block “${block.type}”? This cannot be undone.`,
                            )
                          ) {
                            props.onPurgeBlock(block.id);
                          }
                        }}
                        disabled={props.restorePending}
                      >
                        <DeleteIcon className="size-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="media" className="space-y-3">
              {props.mediaTrashItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No trashed media files or folders.
                </p>
              ) : (
                props.mediaTrashItems.map((item) => (
                  <div
                    key={item.trashKey}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                        {item.type === "file" && item.previewUrl ? (
                          <Image
                            src={item.previewUrl}
                            alt={item.name}
                            width={64}
                            height={64}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <ImageIcon className="size-3.5" /> {item.name}
                        </p>
                        {item.originalRelativePath ? (
                          <p className="truncate text-xs text-muted-foreground">
                            Original: {item.originalRelativePath}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="h-5 px-2 text-[10px] uppercase"
                          >
                            {item.type}
                          </Badge>
                          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Timer className="size-3" />{" "}
                            {formatRetentionCountdown(item.purgeEligibleAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => props.onRestoreMedia(item.trashKey)}
                        disabled={props.restorePending}
                        className="h-8"
                      >
                        <RotateCcw className="size-3.5" /> Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Permanently delete ${item.name}? This cannot be undone.`,
                            )
                          ) {
                            props.onPurgeMedia(item.trashKey);
                          }
                        }}
                        disabled={props.restorePending}
                      >
                        <DeleteIcon className="size-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
