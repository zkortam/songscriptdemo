"use client";
import { Toaster } from "sonner";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { UploadProvider } from "./UploadProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <UploadProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              classNames: {
                toast:
                  "!rounded-full !glass-chrome !text-ink !shadow-soft !border-hairline/10 !text-[13px]",
              },
            }}
          />
        </UploadProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
