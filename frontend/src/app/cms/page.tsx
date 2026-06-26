"use client";

import Link from "next/link";
import { 
  Settings, Users, LayoutDashboard, Layout, ToggleLeft, 
  Workflow, Database, Bell, Shield, Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cmsModules = [
  {
    title: "Role & Permissions",
    description: "Manage roles, CRUD permissions, and feature access.",
    icon: Shield,
    href: "/cms/roles",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Dashboard Builder",
    description: "Configure role-based dashboards and widgets.",
    icon: LayoutDashboard,
    href: "/cms/dashboard",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  },
  {
    title: "Sidebar Builder",
    description: "Dynamic sidebar menus and nested links.",
    icon: Layout,
    href: "/cms/sidebar",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    title: "Feature Management",
    description: "Enable/disable features and SaaS modules.",
    icon: ToggleLeft,
    href: "/cms/features",
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Workflows",
    description: "Configure stages and approval processes.",
    icon: Workflow,
    href: "/cms/workflows",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    title: "Application Settings",
    description: "Manage themes, logos, and global settings.",
    icon: Settings,
    href: "/cms/settings",
    color: "text-zinc-500",
    bg: "bg-zinc-500/10"
  },
  {
    title: "Notifications",
    description: "Email and in-app alert templates.",
    icon: Bell,
    href: "/cms/notifications",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10"
  },
  {
    title: "Audit Logs",
    description: "Track all CMS modifications.",
    icon: Activity,
    href: "/cms/logs",
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  }
];

export default function CMSDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centralized CMS</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Control center for configuring the entire SaaS application. Only Super Admins have access.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {cmsModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.title} href={module.href}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full border-muted/60 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                  <div className={`p-3 rounded-xl ${module.bg}`}>
                    <Icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mt-2">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
