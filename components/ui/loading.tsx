import * as React from "react";
import { cn } from "@/lib/utils";

// Định nghĩa các kiểu loader
export type LoadingVariant = "spinner" | "dots" | "bars" | "infinity";

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: LoadingVariant;
  text?: string;
}

// Map kích thước cho container
const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

// Map kích thước cho các phần tử con (dots/bars)
const childSizeClasses = {
  sm: "w-1 h-1",
  md: "w-2 h-2",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

export function Loading({
  size = "md",
  variant = "spinner",
  text,
  className,
  ...props
}: LoadingProps) {
  // Render nội dung dựa trên variant
  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return (
          <div
            className={cn(
              "flex space-x-1",
              sizeClasses[size],
              "items-center justify-center",
            )}
          >
            <div
              className={cn(
                "bg-current rounded-full animate-bounce [animation-delay:-0.3s]",
                childSizeClasses[size],
              )}
            />
            <div
              className={cn(
                "bg-current rounded-full animate-bounce [animation-delay:-0.15s]",
                childSizeClasses[size],
              )}
            />
            <div
              className={cn(
                "bg-current rounded-full animate-bounce",
                childSizeClasses[size],
              )}
            />
          </div>
        );

      case "bars":
        return (
          <div
            className={cn(
              "flex items-end justify-center gap-1",
              sizeClasses[size],
            )}
          >
            <div className="w-1.5 h-full bg-current animate-[pulse_1s_ease-in-out_infinite]" />
            <div className="w-1.5 h-[80%] bg-current animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
            <div className="w-1.5 h-full bg-current animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
          </div>
        );

      case "infinity": // Một kiểu loading dạng vòng xoay kép
        return (
          <div
            className={cn(
              "relative flex items-center justify-center",
              sizeClasses[size],
            )}
          >
            <div className="absolute inset-0 border-4 border-current/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-current border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        );

      case "spinner":
      default:
        return (
          <div className={cn("relative", sizeClasses[size])}>
            {/* Track (Vòng mờ phía sau) */}
            <div className="absolute inset-0 rounded-full border-[3px] border-current opacity-20" />
            {/* Indicator (Vòng xoay chính) */}
            <div className="absolute inset-0 rounded-full border-[3px] border-t-current border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-primary", // Mặc định dùng màu primary
        className,
      )}
      {...props}
    >
      {renderLoader()}
      {text && (
        <p
          className={cn(
            "font-medium text-muted-foreground animate-pulse",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}

// --- Các Helper Components ---

export function LoadingPage({
  text = "Đang tải...",
  variant = "spinner",
}: {
  text?: string;
  variant?: LoadingVariant;
}) {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Loading
        size="lg"
        variant={variant}
        text={text}
        className="text-blue-600"
      />
    </div>
  );
}

export function LoadingOverlay({
  text,
  variant = "spinner",
}: {
  text?: string;
  variant?: LoadingVariant;
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
      <Loading size="lg" variant={variant} text={text} />
    </div>
  );
}

export default Loading;
