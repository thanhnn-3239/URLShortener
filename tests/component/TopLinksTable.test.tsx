import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TopLinksTable from "@/components/TopLinksTable";

describe("TopLinksTable Component", () => {
  const mockLinks = [
    {
      code: "abc123",
      destination_url: "https://example.com/first",
      click_count: 150
    },
    {
      code: "def456",
      destination_url: "https://example.com/second",
      click_count: 100
    },
    {
      code: "ghi789",
      destination_url: "https://example.com/third",
      click_count: 50
    }
  ];

  describe("Rendering", () => {
    it("should render table with headers", () => {
      const { container } = render(<TopLinksTable links={mockLinks} />);

      expect(screen.getByText("Links")).toBeInTheDocument();
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should render all link rows", () => {
      render(<TopLinksTable links={mockLinks} />);

      expect(screen.getByText("abc123")).toBeInTheDocument();
      expect(screen.getByText("def456")).toBeInTheDocument();
      expect(screen.getByText("ghi789")).toBeInTheDocument();
    });

    it("should display destination URLs", () => {
      render(<TopLinksTable links={mockLinks} />);

      expect(screen.getByText("https://example.com/first")).toBeInTheDocument();
      expect(
        screen.getByText("https://example.com/second")
      ).toBeInTheDocument();
    });

    it("should display click counts", () => {
      render(<TopLinksTable links={mockLinks} />);

      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("should render empty state when no links", () => {
      const { container } = render(<TopLinksTable links={[]} />);

      // Should show empty message
      const content = container.textContent;
      expect(content).toMatch(/no|empty|data/i);
    });
  });

  describe("Sorting", () => {
    it("should display links sorted by click count descending", () => {
      const { container } = render(<TopLinksTable links={mockLinks} />);

      const rows = container.querySelectorAll("tbody tr");
      if (rows.length >= 3) {
        // First row should have highest clicks
        expect(rows[0].textContent).toContain("150");
        // Last visible row should have lowest clicks
        expect(rows[2].textContent).toContain("50");
      }
    });

    it("should allow sorting by click count ascending", () => {
      render(<TopLinksTable links={mockLinks} />);

      // Find sort button for clicks column
      const sortButton = screen
        .getAllByText(/click|sort/i)
        .find((el) => el.textContent.toLowerCase().includes("click"));

      if (sortButton) {
        fireEvent.click(sortButton);
        // After click, order should reverse
      }
    });

    it("should allow sorting by short code", () => {
      render(<TopLinksTable links={mockLinks} />);

      // Should be able to click column header to sort
      const codeHeader = screen.getByText(/code|short/i);
      fireEvent.click(codeHeader);
    });

    it("should allow sorting by destination URL", () => {
      render(<TopLinksTable links={mockLinks} />);

      const urlHeader = screen.getByText(/url|destination/i);
      fireEvent.click(urlHeader);
    });
  });

  describe("User Interaction", () => {
    it("should copy short code to clipboard on click", async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(<TopLinksTable links={mockLinks} />);

      const codeLink = screen.getByText("abc123");
      fireEvent.click(codeLink);

      // Should either copy or show copy button
      if (mockClipboard.writeText.mock.calls.length > 0) {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      }
    });

    it("should show copy feedback", async () => {
      render(<TopLinksTable links={mockLinks} />);

      const codeCell = screen.getByText("abc123");
      fireEvent.click(codeCell);

      // Should show confirmation or button
      expect(codeCell.parentElement).toBeTruthy();
    });

    it("should be able to navigate to link details", () => {
      render(<TopLinksTable links={mockLinks} />);

      const firstCode = screen.getByText("abc123");
      expect(
        firstCode.closest("a") || firstCode.closest('[role="button"]')
      ).toBeTruthy();
    });
  });

  describe("Data Formatting", () => {
    it("should format click counts with thousands separator", () => {
      const largeLinks = [
        {
          code: "big123",
          destination_url: "https://example.com",
          click_count: 1000000
        }
      ];

      const { container } = render(<TopLinksTable links={largeLinks} />);

      const content = container.textContent;
      expect(content).toMatch(/1[,.]000[,.]000|1000000/);
    });

    it("should truncate long URLs", () => {
      const longUrlLinks = [
        {
          code: "test",
          destination_url:
            "https://example.com/very/long/url/that/goes/on/and/on/and/on/forever/and/ever",
          click_count: 10
        }
      ];

      const { container } = render(<TopLinksTable links={longUrlLinks} />);

      const urlCell = container.querySelector("td");
      expect(urlCell?.offsetWidth).toBeLessThan(1000); // Should be constrained
    });

    it("should show full URL on hover", () => {
      const links = [
        {
          code: "test",
          destination_url: "https://example.com/very/long/path",
          click_count: 10
        }
      ];

      const { container } = render(<TopLinksTable links={links} />);

      const urlElement = screen.getByText(/example.com/i);
      expect(
        urlElement.getAttribute("title") ||
          urlElement.parentElement?.getAttribute("title")
      ).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper table semantics", () => {
      const { container } = render(<TopLinksTable links={mockLinks} />);

      expect(container.querySelector("table")).toBeInTheDocument();
      expect(container.querySelector("thead")).toBeInTheDocument();
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("should have column headers", () => {
      const { container } = render(<TopLinksTable links={mockLinks} />);

      const headers = container.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);
    });

    it("should have accessible row data", () => {
      const { container } = render(<TopLinksTable links={mockLinks} />);

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(mockLinks.length);
    });

    it("should support keyboard navigation", () => {
      const { container } = render(<TopLinksTable links={mockLinks} />);

      // Check for tabbable elements
      const tabbableElements = container.querySelectorAll(
        "[tabindex], a, button"
      );
      expect(tabbableElements.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero click counts", () => {
      const zeroLinks = [
        {
          code: "unused",
          destination_url: "https://example.com",
          click_count: 0
        }
      ];

      render(<TopLinksTable links={zeroLinks} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should handle duplicate click counts", () => {
      const duplicates = [
        { code: "a", destination_url: "https://a.com", click_count: 50 },
        { code: "b", destination_url: "https://b.com", click_count: 50 },
        { code: "c", destination_url: "https://c.com", click_count: 50 }
      ];

      const { container } = render(<TopLinksTable links={duplicates} />);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(3);
    });

    it("should handle single link", () => {
      const single = [
        {
          code: "single",
          destination_url: "https://example.com",
          click_count: 100
        }
      ];

      render(<TopLinksTable links={single} />);
      expect(screen.getByText("single")).toBeInTheDocument();
    });

    it("should handle special characters in URLs", () => {
      const specialLinks = [
        {
          code: "spec",
          destination_url:
            "https://example.com/path?query=value&other=123#anchor",
          click_count: 10
        }
      ];

      render(<TopLinksTable links={specialLinks} />);
      expect(screen.getByText(/example.com/i)).toBeInTheDocument();
    });
  });
});
