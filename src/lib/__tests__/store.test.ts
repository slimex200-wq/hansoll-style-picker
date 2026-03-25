import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getUserId, getUserName, setUserName, formatTimeAgo, STATUS_CONFIG } from "../store";

describe("store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getUserId", () => {
    it("generates a UUID on first call and stores it", () => {
      const id = getUserId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");
      expect(localStorage.getItem("hansoll-user-id")).toBe(id);
    });

    it("returns the same UUID on subsequent calls", () => {
      const id1 = getUserId();
      const id2 = getUserId();
      expect(id1).toBe(id2);
    });
  });

  describe("getUserName", () => {
    it("returns null when no name is set", () => {
      expect(getUserName()).toBeNull();
    });

    it("returns the stored name", () => {
      localStorage.setItem("hansoll-user-name", "Alice");
      expect(getUserName()).toBe("Alice");
    });
  });

  describe("setUserName", () => {
    it("stores the name in localStorage", () => {
      setUserName("Bob");
      expect(localStorage.getItem("hansoll-user-name")).toBe("Bob");
    });

    it("also ensures userId is created", () => {
      setUserName("Charlie");
      expect(localStorage.getItem("hansoll-user-id")).toBeTruthy();
    });
  });

  describe("formatTimeAgo", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 'just now' for less than 1 minute", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-25T12:00:30Z"));
      expect(formatTimeAgo("2026-03-25T12:00:00Z")).toBe("just now");
    });

    it("returns minutes for less than 1 hour", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-25T12:30:00Z"));
      expect(formatTimeAgo("2026-03-25T12:00:00Z")).toBe("30m ago");
    });

    it("returns hours for less than 24 hours", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-25T15:00:00Z"));
      expect(formatTimeAgo("2026-03-25T12:00:00Z")).toBe("3h ago");
    });

    it("returns days for 24+ hours", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-27T12:00:00Z"));
      expect(formatTimeAgo("2026-03-25T12:00:00Z")).toBe("2d ago");
    });
  });

  describe("STATUS_CONFIG", () => {
    it("has all three statuses", () => {
      expect(STATUS_CONFIG).toHaveProperty("shortlist");
      expect(STATUS_CONFIG).toHaveProperty("maybe");
      expect(STATUS_CONFIG).toHaveProperty("pass");
    });

    it("each status has required fields", () => {
      for (const key of ["shortlist", "maybe", "pass"] as const) {
        const config = STATUS_CONFIG[key];
        expect(config.label).toBeTruthy();
        expect(config.bg).toBeTruthy();
        expect(config.text).toBeTruthy();
        expect(config.border).toBeTruthy();
        expect(config.activeBg).toBeTruthy();
      }
    });
  });
});
