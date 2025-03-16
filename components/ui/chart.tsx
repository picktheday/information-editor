"use client"

import * as React from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"

const chartColors = {
  blue: "hsl(var(--chart-1))",
  green: "hsl(var(--chart-2))",
  teal: "hsl(var(--chart-3))",
  yellow: "hsl(var(--chart-4))",
  orange: "hsl(var(--chart-5))",
}

type ChartColor = keyof typeof chartColors

type ChartConfig = {
  [key: string]: {
    theme?: ChartColor
    color?: string
  }
}

const Chart = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
Chart.displayName = "Chart"

const ChartPie = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: ChartConfig
  }
>(({ className, children, config = {}, ...props }, ref) => {
  const id = React.useId()
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {children}
          <ChartStyle id={id} config={config} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})
ChartPie.displayName = "ChartPie"

const ChartComposed = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: ChartConfig
  }
>(({ className, children, config = {}, ...props }, ref) => {
  const id = React.useId()
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart>
          {children}
          <ChartStyle id={id} config={config} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
})
ChartComposed.displayName = "ChartComposed"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([_, value]) => value.theme || value.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: colorConfig
          .map(([key, value]) => {
            const color = value.theme ? chartColors[value.theme] : value.color
            return `#${id} .recharts-layer.${key} { fill: ${color}; stroke: ${color}; }`
          })
          .join("\n"),
      }}
    />
  )
}

// Define a custom interface that extends Tooltip props and adds className
interface ChartTooltipProps extends Omit<React.ComponentPropsWithoutRef<typeof Tooltip>, "className"> {
  className?: string
}

const ChartTooltip = React.forwardRef<React.ElementRef<typeof Tooltip>, ChartTooltipProps>(
  ({ className, ...props }, ref) => (
    <Tooltip
      ref={ref}
      content={({ payload, label }) => {
        if (!payload?.length) {
          return null
        }

        return (
          <div className={cn("rounded-lg border bg-background p-2 shadow-sm", className)}>
            <div className="grid grid-flow-col gap-2">
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
            <div className="mt-1 grid gap-2">
              {payload.map((data: any, i) => (
                <div key={i} className="flex items-center justify-between gap-2 border-t pt-1">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ background: data.color }} />
                    <span className="text-xs font-medium">{data.name}</span>
                  </div>
                  <span className="text-xs font-medium">{data.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }}
      {...props}
    />
  ),
)
ChartTooltip.displayName = "ChartTooltip"

export {
  Chart,
  ChartPie,
  ChartComposed,
  Area,
  Bar,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  Pie,
  Tooltip,
  ChartTooltip,
  XAxis,
  YAxis,
}

