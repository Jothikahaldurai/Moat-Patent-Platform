"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardConfig } from "@/lib/enterpriseDashboardData";
import { getRoleWorkspace, type EnterpriseRole } from "@/lib/roleIntelligence";
import { RoleNavBar } from "./RoleNavBar";
import { WidgetEngine } from "./WidgetEngine";
import { AIInsightPanel } from "./AIInsightPanel";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  role: EnterpriseRole;
}

export function DashboardShell({ role }: DashboardShellProps) {
  const config = useMemo(() => getDashboardConfig(role), [role]);
  const workspace = useMemo(() => getRoleWorkspace(role), [role]);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground text-sm">
        Dashboard configuration for role "{role}" not found.
      </div>
    );
  }

  const { title, subtitle, badge, kpis, trends, charts, gauges, tables, insights, quickActions } = config;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-14 px-4 sm:px-6 lg:px-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pt-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#c9a84c] font-semibold">
              {badge}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground font-medium">
              Enterprise Dashboard
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground/80 max-w-3xl">{subtitle}</p>
        </div>

        {/* Quick Actions (Dynamic Navigation Engine) */}
        {quickActions && quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                asChild
                variant={idx === 0 ? "default" : "outline"}
                className={cn(
                  "gap-2 text-xs font-semibold",
                  idx === 0
                    ? "bg-[#c9a84c] hover:bg-[#b8943d] text-black"
                    : "border-border hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/40 hover:text-[#c9a84c]"
                )}
              >
                <Link href={action.href}>
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* ── Sub-Navigation ──────────────────────────────────────── */}
      <RoleNavBar role={role} />

      {/* ── KPI Widgets Grid (Row 1) ──────────────────────────────── */}
      {kpis && kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <WidgetEngine key={kpi.id} widget={kpi} />
          ))}
        </div>
      )}

      {/* ── Main Dashboard Layout Grid (Row 2) ────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Charts and Tables (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dynamic Charts Grid */}
          {charts && charts.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {charts.map((chart) => {
                const isFullWidth = chart.colSpan === 2;
                return (
                  <div key={chart.id} className={isFullWidth ? "md:col-span-2" : ""}>
                    <WidgetEngine widget={chart} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Tables Section */}
          {tables && tables.length > 0 && (
            <div className="space-y-4">
              {tables.map((table) => (
                <div key={table.id}>
                  <WidgetEngine widget={table} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: AI Insights Panel & Secondary Metrics (Gauges/Trends) */}
        <div className="space-y-6">
          {/* AI Insight Panel System */}
          <AIInsightPanel insights={insights} />

          {/* Gauges Grid */}
          {gauges && gauges.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {gauges.map((gauge) => (
                <WidgetEngine key={gauge.id} widget={gauge} />
              ))}
            </div>
          )}

          {/* Trends Grid */}
          {trends && trends.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {trends.map((trend) => (
                <WidgetEngine key={trend.id} widget={trend} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
