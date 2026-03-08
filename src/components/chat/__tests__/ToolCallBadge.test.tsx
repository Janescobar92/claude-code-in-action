import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolInfo } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- Pure getToolInfo unit tests ---

test("getToolInfo: str_replace_editor create", () => {
  const { label } = getToolInfo("str_replace_editor", "create", "/src/Counter.jsx");
  expect(label).toBe("Creating `Counter.jsx`");
});

test("getToolInfo: str_replace_editor str_replace", () => {
  const { label } = getToolInfo("str_replace_editor", "str_replace", "/src/Button.tsx");
  expect(label).toBe("Editing `Button.tsx`");
});

test("getToolInfo: str_replace_editor insert", () => {
  const { label } = getToolInfo("str_replace_editor", "insert", "/App.jsx");
  expect(label).toBe("Editing `App.jsx`");
});

test("getToolInfo: str_replace_editor view", () => {
  const { label } = getToolInfo("str_replace_editor", "view", "/src/utils.ts");
  expect(label).toBe("Reading `utils.ts`");
});

test("getToolInfo: str_replace_editor undo_edit", () => {
  const { label } = getToolInfo("str_replace_editor", "undo_edit", "/src/Form.tsx");
  expect(label).toBe("Reverting `Form.tsx`");
});

test("getToolInfo: file_manager rename", () => {
  const { label } = getToolInfo("file_manager", "rename", "/src/Old.jsx", "/src/New.jsx");
  expect(label).toBe("Renaming `Old.jsx` → `New.jsx`");
});

test("getToolInfo: file_manager delete", () => {
  const { label } = getToolInfo("file_manager", "delete", "/src/Unused.tsx");
  expect(label).toBe("Deleting `Unused.tsx`");
});

test("getToolInfo: unknown tool", () => {
  const { label } = getToolInfo("some_other_tool");
  expect(label).toBe("some_other_tool");
});

test("getToolInfo: unknown command falls back to toolName", () => {
  const { label } = getToolInfo("str_replace_editor", "unknown_cmd", "/file.jsx");
  expect(label).toBe("str_replace_editor");
});

test("getToolInfo: extracts filename from deep path", () => {
  const { label } = getToolInfo("str_replace_editor", "create", "/a/b/c/deep/Component.tsx");
  expect(label).toBe("Creating `Component.tsx`");
});

// --- Component render tests ---

test("ToolCallBadge: state 'call' shows spinner, no green dot", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/Counter.jsx" },
    state: "call",
  };
  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge: state 'partial-call' shows spinner", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: {},
    state: "partial-call",
  };
  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("ToolCallBadge: state 'result' with truthy result shows green dot, no spinner", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/Counter.jsx" },
    state: "result",
    result: "Success",
  };
  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge: state 'result' with null result shows no green dot", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/Counter.jsx" },
    state: "result",
    result: null,
  };
  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge: missing path renders without crash and shows placeholder", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create" },
    state: "partial-call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText(/…/)).toBeDefined();
});

test("ToolCallBadge: badge wrapper does not have font-mono class", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/Counter.jsx" },
    state: "call",
  };
  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);
  const badge = container.firstElementChild;
  expect(badge?.className).not.toContain("font-mono");
});
