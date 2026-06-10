"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { IconButton } from "@/components/ui/IconButton";

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  return (
    <IconButton
      label={resolved === "dark" ? "Switch to light" : "Switch to dark"}
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
    >
      {resolved === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </IconButton>
  );
}
