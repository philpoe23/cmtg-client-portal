import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormMessageState = { type: "error" | "success"; text: string } | null;

/**
 * Feedback shown inside the card the user is working in, rather than as a
 * toast in the corner of the screen where it's easy to miss.
 */
export function FormMessage({ message, className }: { message: FormMessageState; className?: string }) {
  if (!message) return null;
  const isError = message.type === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
        isError ? "bg-cmtg-status-critical-bg text-cmtg-status-critical-fg" : "bg-cmtg-status-resolved-bg text-cmtg-status-resolved-fg",
        className,
      )}
    >
      <Icon className="size-4 shrink-0 mt-0.5" aria-hidden />
      <span>{message.text}</span>
    </div>
  );
}
