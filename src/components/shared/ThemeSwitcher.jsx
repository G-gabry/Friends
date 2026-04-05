import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    name: "Default",
    key: "default",
    color: "oklch(0.21 0.006 285.885)",
    light: null,
    dark: null,
  },
  {
    name: "Teal",
    key: "teal",
    color: "oklch(0.511 0.096 186.391)",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--primary": "oklch(0.511 0.096 186.391)",
      "--primary-foreground": "oklch(0.984 0.014 180.72)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
      "--ring": "oklch(0.705 0.015 286.067)",
      "--chart-1": "oklch(0.855 0.138 181.071)",
      "--chart-2": "oklch(0.704 0.14 182.503)",
      "--chart-3": "oklch(0.6 0.118 184.704)",
      "--chart-4": "oklch(0.511 0.096 186.391)",
      "--chart-5": "oklch(0.437 0.078 188.216)",
      "--radius": "0.625rem",
      "--sidebar": "oklch(0.985 0 0)",
      "--sidebar-foreground": "oklch(0.141 0.005 285.823)",
      "--sidebar-primary": "oklch(0.6 0.118 184.704)",
      "--sidebar-primary-foreground": "oklch(0.984 0.014 180.72)",
      "--sidebar-accent": "oklch(0.967 0.001 286.375)",
      "--sidebar-accent-foreground": "oklch(0.21 0.006 285.885)",
      "--sidebar-border": "oklch(0.92 0.004 286.32)",
      "--sidebar-ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {
      "--background": "oklch(0.141 0.005 285.823)",
      "--foreground": "oklch(0.985 0 0)",
      "--card": "oklch(0.21 0.006 285.885)",
      "--card-foreground": "oklch(0.985 0 0)",
      "--popover": "oklch(0.21 0.006 285.885)",
      "--popover-foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.437 0.078 188.216)",
      "--primary-foreground": "oklch(0.984 0.014 180.72)",
      "--secondary": "oklch(0.274 0.006 286.033)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.274 0.006 286.033)",
      "--muted-foreground": "oklch(0.705 0.015 286.067)",
      "--accent": "oklch(0.274 0.006 286.033)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.552 0.016 285.938)",
      "--chart-1": "oklch(0.855 0.138 181.071)",
      "--chart-2": "oklch(0.704 0.14 182.503)",
      "--chart-3": "oklch(0.6 0.118 184.704)",
      "--chart-4": "oklch(0.511 0.096 186.391)",
      "--chart-5": "oklch(0.437 0.078 188.216)",
      "--sidebar": "oklch(0.21 0.006 285.885)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.704 0.14 182.503)",
      "--sidebar-primary-foreground": "oklch(0.277 0.046 192.524)",
      "--sidebar-accent": "oklch(0.274 0.006 286.033)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.552 0.016 285.938)",
    },
  },
  {
    name: "Sky",
    key: "sky",
    color: "oklch(0.52 0.105 223.128)",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--primary": "oklch(0.52 0.105 223.128)",
      "--primary-foreground": "oklch(0.984 0.019 200.873)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
      "--ring": "oklch(0.705 0.015 286.067)",
      "--chart-1": "oklch(0.865 0.127 207.078)",
      "--chart-2": "oklch(0.715 0.143 215.221)",
      "--chart-3": "oklch(0.609 0.126 221.723)",
      "--chart-4": "oklch(0.52 0.105 223.128)",
      "--chart-5": "oklch(0.45 0.085 224.283)",
      "--radius": "0.625rem",
      "--sidebar": "oklch(0.985 0 0)",
      "--sidebar-foreground": "oklch(0.141 0.005 285.823)",
      "--sidebar-primary": "oklch(0.609 0.126 221.723)",
      "--sidebar-primary-foreground": "oklch(0.984 0.019 200.873)",
      "--sidebar-accent": "oklch(0.967 0.001 286.375)",
      "--sidebar-accent-foreground": "oklch(0.21 0.006 285.885)",
      "--sidebar-border": "oklch(0.92 0.004 286.32)",
      "--sidebar-ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {
      "--background": "oklch(0.141 0.005 285.823)",
      "--foreground": "oklch(0.985 0 0)",
      "--card": "oklch(0.21 0.006 285.885)",
      "--card-foreground": "oklch(0.985 0 0)",
      "--popover": "oklch(0.21 0.006 285.885)",
      "--popover-foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.45 0.085 224.283)",
      "--primary-foreground": "oklch(0.984 0.019 200.873)",
      "--secondary": "oklch(0.274 0.006 286.033)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.274 0.006 286.033)",
      "--muted-foreground": "oklch(0.705 0.015 286.067)",
      "--accent": "oklch(0.274 0.006 286.033)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.552 0.016 285.938)",
      "--chart-1": "oklch(0.865 0.127 207.078)",
      "--chart-2": "oklch(0.715 0.143 215.221)",
      "--chart-3": "oklch(0.609 0.126 221.723)",
      "--chart-4": "oklch(0.52 0.105 223.128)",
      "--chart-5": "oklch(0.45 0.085 224.283)",
      "--sidebar": "oklch(0.21 0.006 285.885)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.715 0.143 215.221)",
      "--sidebar-primary-foreground": "oklch(0.302 0.056 229.695)",
      "--sidebar-accent": "oklch(0.274 0.006 286.033)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.552 0.016 285.938)",
    },
  },
  {
    name: "Emerald",
    key: "emerald",
    color: "oklch(0.508 0.118 165.612)",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--primary": "oklch(0.508 0.118 165.612)",
      "--primary-foreground": "oklch(0.979 0.021 166.113)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
      "--ring": "oklch(0.705 0.015 286.067)",
      "--chart-1": "oklch(0.845 0.143 164.978)",
      "--chart-2": "oklch(0.696 0.17 162.48)",
      "--chart-3": "oklch(0.596 0.145 163.225)",
      "--chart-4": "oklch(0.508 0.118 165.612)",
      "--chart-5": "oklch(0.432 0.095 166.913)",
      "--radius": "0.625rem",
      "--sidebar": "oklch(0.985 0 0)",
      "--sidebar-foreground": "oklch(0.141 0.005 285.823)",
      "--sidebar-primary": "oklch(0.596 0.145 163.225)",
      "--sidebar-primary-foreground": "oklch(0.979 0.021 166.113)",
      "--sidebar-accent": "oklch(0.967 0.001 286.375)",
      "--sidebar-accent-foreground": "oklch(0.21 0.006 285.885)",
      "--sidebar-border": "oklch(0.92 0.004 286.32)",
      "--sidebar-ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {
      "--background": "oklch(0.141 0.005 285.823)",
      "--foreground": "oklch(0.985 0 0)",
      "--card": "oklch(0.21 0.006 285.885)",
      "--card-foreground": "oklch(0.985 0 0)",
      "--popover": "oklch(0.21 0.006 285.885)",
      "--popover-foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.432 0.095 166.913)",
      "--primary-foreground": "oklch(0.979 0.021 166.113)",
      "--secondary": "oklch(0.274 0.006 286.033)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.274 0.006 286.033)",
      "--muted-foreground": "oklch(0.705 0.015 286.067)",
      "--accent": "oklch(0.274 0.006 286.033)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.552 0.016 285.938)",
      "--chart-1": "oklch(0.845 0.143 164.978)",
      "--chart-2": "oklch(0.696 0.17 162.48)",
      "--chart-3": "oklch(0.596 0.145 163.225)",
      "--chart-4": "oklch(0.508 0.118 165.612)",
      "--chart-5": "oklch(0.432 0.095 166.913)",
      "--sidebar": "oklch(0.21 0.006 285.885)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.696 0.17 162.48)",
      "--sidebar-primary-foreground": "oklch(0.262 0.051 172.552)",
      "--sidebar-accent": "oklch(0.274 0.006 286.033)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.552 0.016 285.938)",
    },
  },
  {
    name: "Orange",
    key: "orange",
    color: "oklch(0.553 0.195 38.402)",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--primary": "oklch(0.553 0.195 38.402)",
      "--primary-foreground": "oklch(0.98 0.016 73.684)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
      "--ring": "oklch(0.705 0.015 286.067)",
      "--chart-1": "oklch(0.837 0.128 66.29)",
      "--chart-2": "oklch(0.705 0.213 47.604)",
      "--chart-3": "oklch(0.646 0.222 41.116)",
      "--chart-4": "oklch(0.553 0.195 38.402)",
      "--chart-5": "oklch(0.47 0.157 37.304)",
      "--radius": "0.625rem",
      "--sidebar": "oklch(0.985 0 0)",
      "--sidebar-foreground": "oklch(0.141 0.005 285.823)",
      "--sidebar-primary": "oklch(0.646 0.222 41.116)",
      "--sidebar-primary-foreground": "oklch(0.98 0.016 73.684)",
      "--sidebar-accent": "oklch(0.967 0.001 286.375)",
      "--sidebar-accent-foreground": "oklch(0.21 0.006 285.885)",
      "--sidebar-border": "oklch(0.92 0.004 286.32)",
      "--sidebar-ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {
      "--background": "oklch(0.141 0.005 285.823)",
      "--foreground": "oklch(0.985 0 0)",
      "--card": "oklch(0.21 0.006 285.885)",
      "--card-foreground": "oklch(0.985 0 0)",
      "--popover": "oklch(0.21 0.006 285.885)",
      "--popover-foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.47 0.157 37.304)",
      "--primary-foreground": "oklch(0.98 0.016 73.684)",
      "--secondary": "oklch(0.274 0.006 286.033)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.274 0.006 286.033)",
      "--muted-foreground": "oklch(0.705 0.015 286.067)",
      "--accent": "oklch(0.274 0.006 286.033)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.552 0.016 285.938)",
      "--chart-1": "oklch(0.837 0.128 66.29)",
      "--chart-2": "oklch(0.705 0.213 47.604)",
      "--chart-3": "oklch(0.646 0.222 41.116)",
      "--chart-4": "oklch(0.553 0.195 38.402)",
      "--chart-5": "oklch(0.47 0.157 37.304)",
      "--sidebar": "oklch(0.21 0.006 285.885)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.705 0.213 47.604)",
      "--sidebar-primary-foreground": "oklch(0.98 0.016 73.684)",
      "--sidebar-accent": "oklch(0.274 0.006 286.033)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.552 0.016 285.938)",
    },
  },
  {
    name: "Purple",
    key: "purple",
    color: "oklch(0.491 0.27 292.581)",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--primary": "oklch(0.491 0.27 292.581)",
      "--primary-foreground": "oklch(0.969 0.016 293.756)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
      "--ring": "oklch(0.705 0.015 286.067)",
      "--chart-1": "oklch(0.811 0.111 293.571)",
      "--chart-2": "oklch(0.606 0.25 292.717)",
      "--chart-3": "oklch(0.541 0.281 293.009)",
      "--chart-4": "oklch(0.491 0.27 292.581)",
      "--chart-5": "oklch(0.432 0.232 292.759)",
      "--radius": "0.625rem",
      "--sidebar": "oklch(0.985 0 0)",
      "--sidebar-foreground": "oklch(0.141 0.005 285.823)",
      "--sidebar-primary": "oklch(0.541 0.281 293.009)",
      "--sidebar-primary-foreground": "oklch(0.969 0.016 293.756)",
      "--sidebar-accent": "oklch(0.967 0.001 286.375)",
      "--sidebar-accent-foreground": "oklch(0.21 0.006 285.885)",
      "--sidebar-border": "oklch(0.92 0.004 286.32)",
      "--sidebar-ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {
      "--background": "oklch(0.141 0.005 285.823)",
      "--foreground": "oklch(0.985 0 0)",
      "--card": "oklch(0.21 0.006 285.885)",
      "--card-foreground": "oklch(0.985 0 0)",
      "--popover": "oklch(0.21 0.006 285.885)",
      "--popover-foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.432 0.232 292.759)",
      "--primary-foreground": "oklch(0.969 0.016 293.756)",
      "--secondary": "oklch(0.274 0.006 286.033)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.274 0.006 286.033)",
      "--muted-foreground": "oklch(0.705 0.015 286.067)",
      "--accent": "oklch(0.274 0.006 286.033)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.552 0.016 285.938)",
      "--chart-1": "oklch(0.811 0.111 293.571)",
      "--chart-2": "oklch(0.606 0.25 292.717)",
      "--chart-3": "oklch(0.541 0.281 293.009)",
      "--chart-4": "oklch(0.491 0.27 292.581)",
      "--chart-5": "oklch(0.432 0.232 292.759)",
      "--sidebar": "oklch(0.21 0.006 285.885)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.606 0.25 292.717)",
      "--sidebar-primary-foreground": "oklch(0.969 0.016 293.756)",
      "--sidebar-accent": "oklch(0.274 0.006 286.033)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.552 0.016 285.938)",
    },
  },
  {
    name: "Rose",
    key: "rose",
    color: "oklch(0.514 0.222 16.935)",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--primary": "oklch(0.514 0.222 16.935)",
      "--primary-foreground": "oklch(0.969 0.015 12.422)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
      "--ring": "oklch(0.705 0.015 286.067)",
      "--chart-1": "oklch(0.81 0.117 11.638)",
      "--chart-2": "oklch(0.645 0.246 16.439)",
      "--chart-3": "oklch(0.586 0.253 17.585)",
      "--chart-4": "oklch(0.514 0.222 16.935)",
      "--chart-5": "oklch(0.455 0.188 13.697)",
      "--radius": "0.625rem",
      "--sidebar": "oklch(0.985 0 0)",
      "--sidebar-foreground": "oklch(0.141 0.005 285.823)",
      "--sidebar-primary": "oklch(0.586 0.253 17.585)",
      "--sidebar-primary-foreground": "oklch(0.969 0.015 12.422)",
      "--sidebar-accent": "oklch(0.967 0.001 286.375)",
      "--sidebar-accent-foreground": "oklch(0.21 0.006 285.885)",
      "--sidebar-border": "oklch(0.92 0.004 286.32)",
      "--sidebar-ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {
      "--background": "oklch(0.141 0.005 285.823)",
      "--foreground": "oklch(0.985 0 0)",
      "--card": "oklch(0.21 0.006 285.885)",
      "--card-foreground": "oklch(0.985 0 0)",
      "--popover": "oklch(0.21 0.006 285.885)",
      "--popover-foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.455 0.188 13.697)",
      "--primary-foreground": "oklch(0.969 0.015 12.422)",
      "--secondary": "oklch(0.274 0.006 286.033)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.274 0.006 286.033)",
      "--muted-foreground": "oklch(0.705 0.015 286.067)",
      "--accent": "oklch(0.274 0.006 286.033)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.552 0.016 285.938)",
      "--chart-1": "oklch(0.81 0.117 11.638)",
      "--chart-2": "oklch(0.645 0.246 16.439)",
      "--chart-3": "oklch(0.586 0.253 17.585)",
      "--chart-4": "oklch(0.514 0.222 16.935)",
      "--chart-5": "oklch(0.455 0.188 13.697)",
      "--sidebar": "oklch(0.21 0.006 285.885)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.645 0.246 16.439)",
      "--sidebar-primary-foreground": "oklch(0.969 0.015 12.422)",
      "--sidebar-accent": "oklch(0.274 0.006 286.033)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.552 0.016 285.938)",
    },
  },
];

const STORAGE_KEY = "dashboard-color-theme";
const STYLE_ID = "dynamic-color-theme";

function injectThemeStyle(theme) {
  if (!theme.light) {
    document.getElementById(STYLE_ID)?.remove();
    return;
  }
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  const lightVars = Object.entries(theme.light)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const darkVars = Object.entries(theme.dark)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  el.textContent = `:root {\n${lightVars}\n}\n.dark {\n${darkVars}\n}`;
}

export default function ThemeSwitcher() {
  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "default";
    } catch {
      return "default";
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const theme = THEMES.find((t) => t.key === active);
    if (!theme) return;
    injectThemeStyle(theme);
    try {
      localStorage.setItem(STORAGE_KEY, active);
    } catch {
      console.log("error");
    }
  }, [active]);

  const activeTheme = THEMES.find((t) => t.key === active);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-5 items-center justify-center rounded-l-md border border-r-0 
                    border-border bg-background shadow-md text-muted-foreground
                    hover:text-foreground hover:bg-accent transition-colors
                    fixed right-0 top-1/2 -translate-y-43 z-51 "

        aria-label="Toggle theme panel"
      >
        {open ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <div
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="w-56 rounded-l-xl border border-r-0 border-border bg-background shadow-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Color Theme
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => {
                const isActive = theme.key === active;
                return (
                  <button
                    key={theme.key}
                    onClick={() => setActive(theme.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-2 text-xs transition-all hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "border-ring bg-accent text-accent-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 shadow-sm"
                      style={{
                        backgroundColor: theme.color ?? "var(--primary)",
                      }}
                    />
                    <span className="truncate font-medium">{theme.name}</span>
                    {isActive && (
                      <Check className="ml-auto h-3 w-3 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Active:{" "}
              <span className="font-semibold text-foreground">
                {activeTheme?.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
