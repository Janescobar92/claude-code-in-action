"use client";

import { ToolInvocation } from "ai";
import { Loader2, FilePlus, FilePen, FileSearch, Undo, ArrowRightLeft, Trash2, Wrench } from "lucide-react";

function extractFilename(path: string): string {
  return path.split("/").pop() || path;
}

export function getToolInfo(
  toolName: string,
  command?: string,
  path?: string,
  newPath?: string
): { label: string; Icon: React.ComponentType<{ className?: string }> } {
  const filename = typeof path === "string" ? extractFilename(path) : "…";

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return { label: `Creating \`${filename}\``, Icon: FilePlus };
      case "str_replace":
        return { label: `Editing \`${filename}\``, Icon: FilePen };
      case "insert":
        return { label: `Editing \`${filename}\``, Icon: FilePen };
      case "view":
        return { label: `Reading \`${filename}\``, Icon: FileSearch };
      case "undo_edit":
        return { label: `Reverting \`${filename}\``, Icon: Undo };
      default:
        return { label: toolName, Icon: Wrench };
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename": {
        const oldName = typeof path === "string" ? extractFilename(path) : "…";
        const newName = typeof newPath === "string" ? extractFilename(newPath) : "…";
        return { label: `Renaming \`${oldName}\` → \`${newName}\``, Icon: ArrowRightLeft };
      }
      case "delete":
        return { label: `Deleting \`${filename}\``, Icon: Trash2 };
      default:
        return { label: toolName, Icon: Wrench };
    }
  }

  return { label: toolName, Icon: Wrench };
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, args, state } = toolInvocation;

  const command = typeof args?.command === "string" ? args.command : undefined;
  const path = typeof args?.path === "string" ? args.path : undefined;
  const newPath = typeof args?.new_path === "string" ? args.new_path : undefined;

  const { label, Icon } = getToolInfo(toolName, command, path, newPath);

  const isDone = state === "result" && (toolInvocation as { result?: unknown }).result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <Icon className="w-3 h-3 text-neutral-500" />
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
