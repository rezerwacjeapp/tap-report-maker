import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-between gap-1 px-2 py-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                done && "bg-step-complete text-accent-foreground",
                active && "bg-step-current text-primary-foreground",
                !done && !active && "bg-step-pending text-muted-foreground"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-[10px] font-medium text-center leading-tight", active ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
