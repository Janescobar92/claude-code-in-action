import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockProject = {
  id: "proj-1",
  name: "My Project",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNewProject = {
  id: "new-proj",
  name: "New Design #12345",
  userId: "user-1",
  messages: "[]",
  data: "{}",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  // Default: no anon work
  vi.mocked(getAnonWorkData).mockReturnValue(null);
});

afterEach(() => {
  cleanup();
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    test("calls signInAction with email and password", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
    });

    test("returns the result from signInAction on failure", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrongpass");
      });

      expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockPush).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
    });

    test("returns the result from signInAction on success and redirects", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "password123");
      });

      expect(returnValue).toEqual({ success: true });
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    test("isLoading is false before and after a completed call", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("isLoading becomes true during the async call", async () => {
      let resolveSignIn!: (value: any) => void;
      vi.mocked(signInAction).mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      const { result } = renderHook(() => useAuth());

      // Start the call without awaiting it inside act
      let pending: Promise<any>;
      act(() => {
        pending = result.current.signIn("user@example.com", "password123");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveSignIn({ success: false });
        await pending;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false even when an error is thrown", async () => {
      vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.signIn("user@example.com", "password123")
        ).rejects.toThrow("Network error");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("calls signUpAction with email and password", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "Email already registered" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
    });

    test("returns failure result and does not redirect", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "Email already registered" });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("existing@example.com", "password123");
      });

      expect(returnValue).toEqual({ success: false, error: "Email already registered" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("returns success result and redirects after creating new project", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("new@example.com", "password123");
      });

      expect(returnValue).toEqual({ success: true });
      expect(mockPush).toHaveBeenCalledWith("/new-proj");
    });

    test("isLoading becomes true during the async call", async () => {
      let resolveSignUp!: (value: any) => void;
      vi.mocked(signUpAction).mockReturnValue(
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
      );

      const { result } = renderHook(() => useAuth());

      let pending: Promise<any>;
      act(() => {
        pending = result.current.signUp("user@example.com", "password123");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveSignUp({ success: false });
        await pending;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false even when an error is thrown", async () => {
      vi.mocked(signUpAction).mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.signUp("user@example.com", "password123")
        ).rejects.toThrow("Server error");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn with anonymous work", () => {
    test("creates project from anon work, clears it, and redirects", async () => {
      const anonMessages = [{ id: "1", role: "user", content: "Make a button" }];
      const anonFileSystemData = { "/App.jsx": { type: "file", content: "..." } };

      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({
        messages: anonMessages,
        fileSystemData: anonFileSystemData,
      });
      vi.mocked(createProject).mockResolvedValue({
        ...mockNewProject,
        id: "anon-proj",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonMessages,
          data: anonFileSystemData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj");
    });

    test("skips anon work flow when anonWork has empty messages array", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({ messages: [], fileSystemData: {} });
      vi.mocked(getProjects).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(clearAnonWork).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    test("skips anon work flow when getAnonWorkData returns null", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });
  });

  describe("handlePostSignIn project routing", () => {
    test("redirects to the first (most recent) project when projects exist", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-recent", name: "Recent", createdAt: new Date(), updatedAt: new Date() },
        { id: "proj-old", name: "Old", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-recent");
      expect(mockPush).not.toHaveBeenCalledWith("/proj-old");
      expect(createProject).not.toHaveBeenCalled();
    });

    test("creates a new project and redirects when no projects exist", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ ...mockNewProject, id: "brand-new" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: [], data: {} })
      );
      expect(mockPush).toHaveBeenCalledWith("/brand-new");
    });

    test("new project name matches 'New Design #<number>' format", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      const callArg = vi.mocked(createProject).mock.calls[0][0];
      expect(callArg.name).toMatch(/^New Design #\d+$/);
    });

    test("anon work project name includes a time string", async () => {
      const anonMessages = [{ id: "1", role: "user", content: "hello" }];
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({
        messages: anonMessages,
        fileSystemData: {},
      });
      vi.mocked(createProject).mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      const callArg = vi.mocked(createProject).mock.calls[0][0];
      expect(callArg.name).toMatch(/^Design from .+/);
    });
  });
});
