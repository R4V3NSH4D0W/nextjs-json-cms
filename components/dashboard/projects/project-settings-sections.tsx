"use client";

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
  ServiceGrantSummary,
  ServiceKey,
} from "@/lib/projects/api";
import { SERVICE_KEYS } from "@/lib/projects/api";
import {
  ShieldCheck,
  Users,
  Key,
  Layers,
  Settings2,
  ChevronLeft,
  Globe,
  FileText,
  Plus,
  Activity,
  Trash2,
  Mail,
  Lock,
  ExternalLink,
  Info
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
    { label: "Team Members", value: props.memberCount, icon: Users, color: "text-blue-500" },
    { label: "Active Tokens", value: props.tokenCount, icon: Key, color: "text-amber-500" },
    { label: "Platform Services", value: props.serviceCount, icon: Layers, color: "text-primary" },
    { label: "Security Status", value: "Verified", icon: ShieldCheck, color: "text-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-border/50 bg-card/40 backdrop-blur-sm transition-all hover:border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold tabular-nums">{props.isLoading ? "..." : stat.value}</p>
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
  memberRole: "manager" | "member" | null;
}) {
  const roleLabel = props.isAdmin
    ? "Platform admin"
    : props.memberRole === "manager"
      ? "Project manager"
      : props.memberRole === "member"
        ? "Project member"
        : "Viewer";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href={props.isAdmin ? "/admin/projects" : "/dashboard"}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="size-3" /> All Projects
        </Link>
        <div className="size-1 rounded-full bg-border" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Node Configuration</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 leading-none">
              {props.projectName}
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[10px]">
              {props.projectSlug}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span className="font-medium text-foreground/70">{roleLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="size-3.5 text-primary" />
              <span>{props.canManageProject ? "Management Access granted" : "Restricted visibility"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="h-9 gap-2 font-semibold">
            <Link href={`/dashboard/projects/select?slug=${encodeURIComponent(props.projectSlug)}&redirect=/dashboard`}>
              Launch Console <ExternalLink className="size-3.5" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="h-9 size-9 p-0 text-muted-foreground">
            <Settings2 className="size-4" />
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
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden border-t-2 border-t-primary/40">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-8 pt-10 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-primary mb-3">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
            <Globe className="size-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Deployment Identity</span>
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight">Profile & Network Context</CardTitle>
        <CardDescription className="text-sm max-w-xl leading-relaxed">
          Manage the outward-facing identity of this tenant node and configure CORS origin policies for secure API consumption.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-10 pt-10 px-8 pb-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Instance Designation</label>
              <Input
                placeholder="Unique project identifier..."
                value={props.fields.name}
                onChange={(e) => props.onFieldChange("name", e.target.value)}
                className="bg-background/40 border-border/60 h-11 focus:ring-primary/20 transition-all"
              />
              <p className="text-[10px] text-muted-foreground/60 ml-1">Used for identification across the platform and in system emails.</p>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Strategic Description</label>
              <Textarea
                placeholder="Mission statement or context for this project instance..."
                value={props.fields.description}
                onChange={(e) => props.onFieldChange("description", e.target.value)}
                className="bg-background/40 border-border/60 min-h-[140px] resize-none focus:ring-primary/20 transition-all leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">Gateway: Primary Domain</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                <Input
                  placeholder="https://production-gateway.com"
                  value={props.fields.primaryDomain}
                  onChange={(e) => props.onFieldChange("primaryDomain", e.target.value)}
                  className="bg-background/40 border-border/60 h-11 pl-11 focus:ring-primary/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" /> Authorized Origins
                </label>
                <div className="flex items-center gap-1.5 p-1 px-2 rounded-full bg-muted/30 border border-border/40">
                  <Activity className="size-3 text-muted-foreground/40" />
                  <span className="text-[9px] text-muted-foreground/60 font-mono font-bold leading-none uppercase">CORS Policy Active</span>
                </div>
              </div>

              {origins.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-border/40 bg-muted/10 min-h-12 w-full transition-all">
                  {origins.map((origin, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-background/60 text-[10px] font-mono px-2 py-1 border-primary/20 text-primary/80 flex items-center gap-1.5 hover:border-primary/40 hover:bg-background transition-all group"
                    >
                      <div className="size-1 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
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
                className="bg-background/40 border-border/60 font-mono text-xs focus:ring-primary/20 transition-all p-4"
              />
              <div className="flex items-start gap-2 px-1">
                <Info className="size-3 text-muted-foreground/40 mt-0.5" />
                <p className="text-[10px] text-muted-foreground/60 leading-normal italic">
                  List authorized domains allowed to consume the project API. <span className="text-foreground font-semibold">Wildcards are not supported for security reasons.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border/30">
          <Button onClick={props.onSave} disabled={props.savePending} className="font-bold h-12 px-10 text-base transition-all active:scale-95">
            {props.savePending ? "Synchronizing Platform State..." : "Deploy Profile Configuration"}
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
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm flex flex-col h-full overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2 text-amber-500 mb-1">
          <Key className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Authentication</span>
        </div>
        <CardTitle className="text-xl">API Infrastructure</CardTitle>
        <CardDescription>
          Issue scoped credentials for project APIs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 flex-1 flex flex-col">
        <div className="flex gap-2">
          <Input
            placeholder="Identity label (e.g. Production Frontend)"
            value={props.newTokenLabel}
            onChange={(e) => props.onTokenLabelChange(e.target.value)}
            className="bg-background/50 border-border/60 h-10"
          />
          <Button
            onClick={props.onCreateToken}
            disabled={!props.newTokenLabel.trim() || props.createTokenPending}
            className="h-10 px-6 font-bold"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {props.plainToken ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs relative group animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-[9px] mb-2">
              <Lock className="size-3" /> Secure Exposure
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Copy this secret now. Infrastructure security policy prevents us from displaying it again.
            </p>
            <div className="break-all font-mono text-[10px] bg-background/80 p-3 rounded-lg border border-amber-500/20 select-all">
              {props.plainToken}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px] max-h-[400px] pr-1">
          {props.tokens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-50">
              <ShieldCheck className="size-8 mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground italic">
                Secure credentials library is currently empty.
              </p>
            </div>
          ) : null}
          {props.tokens.map((token) => (
            <div key={token.id} className={cn(
              "rounded-xl border p-4 transition-all",
              token.active ? "border-border/60 bg-background/40" : "border-border/30 bg-muted/40 grayscale"
            )}>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className={cn("text-xs font-bold", token.active ? "text-foreground" : "text-muted-foreground")}>
                    {token.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={token.active ? "outline" : "secondary"} className="h-4 px-1 text-[8px] font-mono leading-none">
                      {token.active ? "Active" : "Archived"}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-mono">
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
                    "h-8 h-8 px-3 text-[10px] font-bold uppercase tracking-wider",
                    token.active ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground/40"
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
  onRevokeMemberService: (userId: string, serviceKey: ServiceKey) => void;
  revokeMemberServicePending: boolean;
  enabledProjectServiceKeys: ServiceKey[];
  selectedServicesByUser: Record<string, ServiceKey[]>;
  onToggleSelectedService: (userId: string, serviceKey: ServiceKey) => void;
  onGrantMemberServices: (userId: string, serviceKeys: ServiceKey[]) => void;
  grantMemberServicesPending: boolean;
  services: ServiceGrantSummary[];
  onToggleProjectService: (serviceKey: ServiceKey, enabled: boolean) => void;
  toggleProjectServicePending: boolean;
}) {
  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2 text-blue-500 mb-1">
          <Users className="size-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Governance</span>
        </div>
        <CardTitle className="text-xl">Team and Governance</CardTitle>
        <CardDescription>
          Manage project ownership, collaborators, and provisioned platform services.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-border/50 h-10 w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="members" className="text-xs font-bold px-6 data-[state=active]:border-border/50">Members</TabsTrigger>
            <TabsTrigger value="services" className="text-xs font-bold px-6 data-[state=active]:shadow-sm">Platform Services</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6 focus-visible:outline-none">
            {props.isAdmin ? (
              <div className="grid gap-6 rounded-xl border border-border/60 bg-muted/10 p-5 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" /> Management Handover
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Promote a user to manage the overall project and grant full capability sets.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Manager email address"
                      value={props.handoverEmail}
                      onChange={(e) =>
                        props.onHandoverEmailChange(e.target.value)
                      }
                      className="bg-background/50 border-border/60 h-10"
                    />
                    <Button
                      onClick={props.onHandover}
                      disabled={
                        !props.handoverEmail.trim() || props.handoverPending
                      }
                      className="h-10 font-bold px-6"
                    >
                      Swap
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 md:border-l md:border-border/50 md:pl-6 pt-6 md:pt-0">
                  <div className="space-y-1">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <Plus className="size-4 text-blue-500" /> Direct Provisioning
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Create new identity accounts directly for project assignment.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <Input
                      placeholder="new.user@example.com"
                      value={props.newUserEmail}
                      onChange={(e) => props.onNewUserEmailChange(e.target.value)}
                      className="bg-background/50 border-border/60 h-9"
                    />
                    <Input
                      placeholder="Security password (min 8 chars)"
                      type="password"
                      value={props.newUserPassword}
                      onChange={(e) =>
                        props.onNewUserPasswordChange(e.target.value)
                      }
                      className="bg-background/50 border-border/60 h-9"
                    />
                    <Button
                      size="sm"
                      onClick={props.onCreateUser}
                      disabled={
                        !props.newUserEmail.trim() ||
                        props.newUserPassword.length < 8 ||
                        props.createUserPending
                      }
                      className="font-bold w-full h-9"
                    >
                      Generate Account
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Member Library</label>
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
                            : "Select identity to add"
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
                  className="h-11 px-8 font-bold"
                >
                  Assign Identity
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {props.members.length === 0 ? (
                <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                  <Users className="size-8 mb-2" />
                  <p className="text-xs italic">
                    No identities have been assigned to this terminal yet.
                  </p>
                </div>
              ) : null}
              {props.members.map((member) => {
                const selected =
                  props.selectedServicesByUser[member.user.id] ?? [];
                const missingEnabledServiceKeys =
                  props.enabledProjectServiceKeys.filter(
                    (serviceKey) => !member.features.includes(serviceKey),
                  );
                const selectedMissingServices = selected.filter((serviceKey) =>
                  missingEnabledServiceKeys.includes(serviceKey),
                );
                return (
                  <Card
                    key={member.user.id}
                    className="border-border/50 bg-background/30 transition-all hover:border-primary/20"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-bold text-sm truncate pr-4">{member.user.email}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="h-4 px-1 text-[8px] font-bold uppercase">
                              {member.role}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground opacity-60">
                              Joined {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => props.onRemoveMember(member.user.id)}
                          disabled={props.removeMemberPending}
                          className="size-7 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                          Provisioned Services <ChevronLeft className="size-2 -rotate-90" />
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.features.filter((f) =>
                            (SERVICE_KEYS as readonly string[]).includes(f),
                          ).length === 0 ? (
                            <span className="text-[10px] text-muted-foreground italic">
                              No services provisioned
                            </span>
                          ) : (
                            (
                              member.features.filter((f) =>
                                (SERVICE_KEYS as readonly string[]).includes(f),
                              ) as ServiceKey[]
                            ).map((serviceKey) => (
                              <Badge
                                key={serviceKey}
                                variant="outline"
                                className="bg-primary/5 text-primary border-primary/20 text-[9px] font-mono h-5 py-0 px-1.5 flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                                onClick={() =>
                                  props.onRevokeMemberService(
                                    member.user.id,
                                    serviceKey,
                                  )
                                }
                              >
                                {serviceKey} <Trash2 className="size-2 text-current" />
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-border/20">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground">
                          Provisionable Services
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {props.enabledProjectServiceKeys.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic">
                              Enable services in the catalog first.
                            </p>
                          ) : missingEnabledServiceKeys.length === 0 ? (
                            <p className="text-[10px] text-emerald-600 font-medium">
                              All available services provisioned.
                            </p>
                          ) : (
                            missingEnabledServiceKeys.map((serviceKey) => (
                              <button
                                key={serviceKey}
                                onClick={() => props.onToggleSelectedService(member.user.id, serviceKey)}
                                className={cn(
                                  "px-2 py-0.5 rounded border text-[9px] font-mono transition-all",
                                  selected.includes(serviceKey)
                                    ? "bg-primary border-primary text-primary-foreground shadow-sm scale-105"
                                    : "bg-background/20 border-border/50 text-muted-foreground hover:border-border"
                                )}
                              >
                                {serviceKey}
                              </button>
                            ))
                          )}
                        </div>

                        {selectedMissingServices.length > 0 && (
                          <Button
                            size="sm"
                            onClick={() =>
                              props.onGrantMemberServices(
                                member.user.id,
                                selectedMissingServices,
                              )
                            }
                            disabled={props.grantMemberServicesPending}
                            className="w-full h-8 text-[10px] font-bold uppercase transition-all active:scale-95"
                          >
                            Provision Services ({selectedMissingServices.length})
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 focus-visible:outline-none">
            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-xl border border-primary/20 mb-2">
              <Info className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-foreground font-bold italic mr-1">Note: CMS Tools are default for all members.</span>
                External platform services provisioned here become available for specific member grants. Manage member-level access in the <span className="text-foreground font-bold">Members</span> tab.
              </p>
            </div>

            <div className="grid gap-3">
              {props.services.length === 0 ? (
                <div className="py-20 text-center rounded-xl border border-dashed border-border">
                  <Layers className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">Platform Service Catalog not synchronized.</p>
                </div>
              ) : null}
              {props.services.map((service) => (
                <div
                  key={service.key}
                  className={cn(
                    "flex items-center justify-between gap-4 p-4 rounded-xl border transition-all",
                    service.enabledForProject ? "bg-background/60 border-primary/30 shadow-sm" : "bg-muted/10 border-border/40 opacity-70"
                  )}
                >
                  <div className="space-y-1">
                    <p className="font-mono text-[11px] font-bold text-foreground/90">{service.key}</p>
                    {service.description ? (
                      <p className="text-[11px] text-muted-foreground max-w-lg leading-snug pr-4">
                        {service.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant={service.enabledForProject ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      props.onToggleProjectService(
                        service.key,
                        !service.enabledForProject,
                      )
                    }
                    disabled={props.toggleProjectServicePending}
                    className={cn(
                      "h-8 font-bold text-[10px] uppercase min-w-[80px]",
                      service.enabledForProject ? "shadow-sm" : "text-muted-foreground border-border/60 shadow-none"
                    )}
                  >
                    {service.enabledForProject ? "Active" : "Disabled"}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
