import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900",
        "placeholder:text-gray-400",
        "outline-none transition-all duration-200",
        "focus:border-[#23C4C1] focus:ring-2 focus:ring-[#23C4C1]/20",
        "hover:border-gray-400",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
