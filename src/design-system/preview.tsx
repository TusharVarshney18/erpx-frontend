"use client";

import { ThemeProvider, useTheme } from "../providers/theme-provider";
import { ToastProvider } from "./components/ui/toast";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { SearchInput } from "./components/ui/search-input";
import { MetricCard } from "./components/ui/metric-card";
import { StatCard } from "./components/ui/stat-card";
import { AICard } from "./components/ui/ai-card";
import { EmptyState } from "./components/ui/empty-state";
import { ErrorState } from "./components/ui/error-state";
import { LoadingState } from "./components/ui/loading-state";
import { SectionHeader } from "./components/ui/section-header";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Sidebar } from "./components/layout/sidebar";
import { TopNav } from "./components/layout/top-nav";
import { MainLayout } from "./components/layout/main-layout";
import { ProfileMenu } from "./components/layout/profile-menu";
import { OrgSwitcher } from "./components/layout/org-switcher";
import { PageTransition } from "./animations/page-transition";
import { StaggerContainer, StaggerItem } from "./animations/stagger";
import {
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  Activity,
} from "lucide-react";

const sidebarSections = [
  {
    id: "main",
    label: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        active: true,
        onClick: () => {},
      },
      { id: "analytics", label: "Analytics", icon: Activity, onClick: () => {} },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "team", label: "Team", icon: Users, badge: "3", onClick: () => {} },
      { id: "orders", label: "Orders", icon: ShoppingCart, badge: "12", onClick: () => {} },
      { id: "invoices", label: "Invoices", icon: FileText, onClick: () => {} },
      {
        id: "settings-group",
        label: "Settings",
        icon: Settings,
        onClick: () => {},
        children: [
          { id: "general", label: "General", onClick: () => {} },
          { id: "billing", label: "Billing", onClick: () => {} },
          { id: "security", label: "Security", onClick: () => {} },
        ],
      },
    ],
  },
];

const demoUser = {
  name: "Tushar Varshney",
  email: "tushar@erpx.ai",
  initials: "TV",
};

const orgs = [
  { id: "1", name: "ERPX Inc.", slug: "erpx", plan: "Enterprise", current: true },
  { id: "2", name: "Acme Corp", slug: "acme", plan: "Pro" },
];

function DesignSystemPreview() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <MainLayout
      sidebar={
        <Sidebar
          sections={sidebarSections}
          header={<OrgSwitcher organizations={orgs} currentOrgId="1" onSwitch={() => {}} />}
          footer={<ProfileMenu user={demoUser} onNavigate={() => {}} onLogout={() => {}} />}
        />
      }
      topNav={
        <TopNav
          leftContent={<SearchInput />}
          rightContent={
            <>
              <button
                onClick={toggleTheme}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </>
          }
        />
      }
    >
      <PageTransition>
        <SectionHeader
          title="Design System"
          description="ERPX Premium Design System — Built by Tushar Varshney"
          variant="page"
        />

        <StaggerContainer className="space-y-12">
          <StaggerItem>
            <SectionHeader title="Typography" variant="section" />
            <div className="space-y-2 p-4 rounded-xl border border-border bg-card">
              <p className="text-display">Display</p>
              <p className="text-h1">Heading 1</p>
              <p className="text-h2">Heading 2</p>
              <p className="text-h3">Heading 3</p>
              <p className="text-h4">Heading 4</p>
              <p className="text-body">
                The quick brown fox jumps over the lazy dog. Body text at 15px.
              </p>
              <p className="text-body-sm">
                The quick brown fox jumps over the lazy dog. Small body at 14px.
              </p>
              <p className="text-caption">
                The quick brown fox jumps over the lazy dog. Caption text.
              </p>
              <p className="text-small">The quick brown fox jumps over the lazy dog. Small text.</p>
              <p className="text-mono">console.log("Hello, ERPX!") — Mono text.</p>
              <p className="text-label">Section Label — Uppercase</p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionHeader title="Buttons" variant="section" />
            <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-card">
              <Button variant="default">Default</Button>
              <Button variant="premium">Premium</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button variant="glass">Glass</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">X-Large</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionHeader title="Badges" variant="section" />
            <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-border bg-card">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="premium">Premium</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="dot" dot="success">
                Active
              </Badge>
              <Badge variant="dot" dot="warning">
                Pending
              </Badge>
              <Badge variant="dot" dot="error">
                Offline
              </Badge>
              <Badge size="sm">Small</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionHeader title="Cards" variant="section" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Total Revenue"
                value="$48,250"
                change={12.5}
                trend="up"
                description="vs last month"
              />
              <MetricCard
                title="Active Users"
                value="1,842"
                change={-3.2}
                trend="down"
                description="vs last week"
              />
              <MetricCard
                title="Response Time"
                value="245ms"
                change={0}
                trend="neutral"
                description="Average latency"
              />
              <StatCard label="New Leads" value="128" />
              <StatCard label="Conversion Rate" value="24.8%" />
              <StatCard label="Churn Rate" value="2.1%" />
              <AICard
                title="AI Assistant"
                description="Ask anything about your data"
                variant="premium"
              >
                <p>Leverage AI to analyze trends, generate reports, and automate workflows.</p>
              </AICard>
              <AICard title="Smart Recommendations" variant="default">
                <p>Get personalized insights based on your usage patterns.</p>
              </AICard>
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionHeader title="Inputs" variant="section" />
            <div className="space-y-3 p-4 rounded-xl border border-border bg-card max-w-sm">
              <Input placeholder="Default input" />
              <Input
                placeholder="With left icon"
                leftIcon={<LayoutDashboard className="h-4 w-4" />}
              />
              <Input placeholder="With right icon" rightIcon={<Activity className="h-4 w-4" />} />
              <Input placeholder="With error" error="This field is required" />
              <Input placeholder="Disabled" disabled />
              <SearchInput />
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionHeader title="States" variant="section" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card">
                <LoadingState variant="spinner" text="Loading..." />
              </div>
              <div className="rounded-xl border border-border bg-card">
                <LoadingState variant="skeleton" />
              </div>
              <div className="rounded-xl border border-border bg-card">
                <LoadingState variant="pulse" />
              </div>
              <div className="rounded-xl border border-border bg-card">
                <EmptyState
                  title="No items found"
                  description="Get started by creating your first item."
                  action={{ label: "Create Item", onClick: () => {} }}
                />
              </div>
              <div className="rounded-xl border border-border bg-card">
                <ErrorState onRetry={() => {}} />
              </div>
              <div className="rounded-xl border border-border bg-card">
                <ErrorState
                  title="Connection lost"
                  message="Please check your internet connection and try again."
                  onRetry={() => {}}
                />
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionHeader title="Avatars" variant="section" />
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-success/10 text-success">TV</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-warning/10 text-warning">AK</AvatarFallback>
              </Avatar>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    </MainLayout>
  );
}

export default function DesignSystemPage() {
  return (
    <ThemeProvider>
      <ToastProvider />
      <DesignSystemPreview />
    </ThemeProvider>
  );
}
