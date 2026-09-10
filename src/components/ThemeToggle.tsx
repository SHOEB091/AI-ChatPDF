"use client";

import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "compact" | "icon";
  className?: string;
}

export function ThemeToggle({ variant = "default", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light mode";
      case "dark":
        return "Dark mode";
      case "system":
        return "System theme";
      default:
        return "Toggle theme";
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        className={cn("h-9 w-9", className)}
        title={getLabel()}
      >
        {getIcon()}
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={cycleTheme}
        className={cn("gap-2", className)}
        title={getLabel()}
      >
        {getIcon()}
        <span className="capitalize">{theme}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={cycleTheme}
      className={cn("gap-2", className)}
      title={getLabel()}
    >
      {getIcon()}
      <span className="capitalize">{theme} mode</span>
    </Button>
  );
}

// Dropdown version for more control
export function ThemeDropdown({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("relative inline-block", className)}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
        className="appearance-none bg-background border border-input rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
