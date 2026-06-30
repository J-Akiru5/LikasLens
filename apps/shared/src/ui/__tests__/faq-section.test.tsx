import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import enMessages from "../../i18n/messages/en.json";

// ── Mock next-intl ─────────────────────────────────────────────
// Use the real English translations so the tests verify actual rendered text.

const faqMessages = enMessages.faq as Record<string, string>;

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => faqMessages[key] ?? key,
}));

// Import AFTER mock so the module mock is active
import { FaqSection } from "../faq-section";

// ── FAQ key definitions ────────────────────────────────────────

const FAQ_KEYS = [
  "qWhatIs",
  "qIdentityProtected",
  "qHowAiTriage",
  "qAnonymousReport",
  "qAfterSubmit",
  "qMobileApp",
  "qReportVerification",
  "qWhoSeesReport",
] as const;

const ANSWER_KEYS = [
  "aWhatIs",
  "aIdentityProtected",
  "aHowAiTriage",
  "aAnonymousReport",
  "aAfterSubmit",
  "aMobileApp",
  "aReportVerification",
  "aWhoSeesReport",
] as const;

// ── Tests ──────────────────────────────────────────────────────

describe("FaqSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("section header", () => {
    it('renders the "support" label', () => {
      render(<FaqSection />);
      expect(screen.getByText(faqMessages.support)).toBeInTheDocument();
    });

    it("renders the section title", () => {
      render(<FaqSection />);
      expect(screen.getByRole("heading", { name: faqMessages.title })).toBeInTheDocument();
    });

    it("renders the section subtitle", () => {
      render(<FaqSection />);
      expect(screen.getByText(faqMessages.subtitle)).toBeInTheDocument();
    });
  });

  describe("FAQ questions and answers", () => {
    it.each(FAQ_KEYS.map((key, i) => [i, key] as const))(
      "renders question %i (%q)",
      (_idx, qKey) => {
        render(<FaqSection />);
        expect(screen.getByText(faqMessages[qKey])).toBeInTheDocument();
      },
    );

    it("does NOT render any answers by default (all collapsed)", () => {
      render(<FaqSection />);
      for (const aKey of ANSWER_KEYS) {
        expect(screen.queryByText(faqMessages[aKey])).not.toBeInTheDocument();
      }
    });

    it("renders all 8 question buttons", () => {
      render(<FaqSection />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(8);
    });
  });

  describe("accordion interaction", () => {
    it("expands the first FAQ when clicked", () => {
      render(<FaqSection />);
      const firstButton = screen.getAllByRole("button")[0];

      fireEvent.click(firstButton);

      expect(screen.getByText(faqMessages.aWhatIs)).toBeInTheDocument();
    });

    it("collapses an open FAQ when clicked again", () => {
      render(<FaqSection />);
      const firstButton = screen.getAllByRole("button")[0];

      fireEvent.click(firstButton);
      expect(screen.getByText(faqMessages.aWhatIs)).toBeInTheDocument();

      fireEvent.click(firstButton);
      expect(screen.queryByText(faqMessages.aWhatIs)).not.toBeInTheDocument();
    });

    it("opens a different FAQ and closes the previous one", () => {
      render(<FaqSection />);
      const buttons = screen.getAllByRole("button");

      // Open FAQ 1
      fireEvent.click(buttons[0]);
      expect(screen.getByText(faqMessages.aWhatIs)).toBeInTheDocument();

      // Open FAQ 3 — FAQ 1 should close
      fireEvent.click(buttons[2]);
      expect(screen.queryByText(faqMessages.aWhatIs)).not.toBeInTheDocument();
      expect(screen.getByText(faqMessages.aHowAiTriage)).toBeInTheDocument();
    });

    it.each(FAQ_KEYS.map((qKey, i) => [i, qKey, ANSWER_KEYS[i]] as const))(
      "question %i shows correct answer when expanded",
      (_idx, qKey, aKey) => {
        render(<FaqSection />);
        const button = screen.getAllByRole("button")[_idx];

        fireEvent.click(button);
        expect(screen.getByText(faqMessages[aKey])).toBeInTheDocument();

        fireEvent.click(button);
        expect(screen.queryByText(faqMessages[aKey])).not.toBeInTheDocument();
      },
    );
  });

  describe("aria attributes", () => {
    it("sets aria-expanded=false on all buttons by default", () => {
      render(<FaqSection />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("sets aria-expanded=true on the clicked button", () => {
      render(<FaqSection />);
      const buttons = screen.getAllByRole("button");

      fireEvent.click(buttons[2]);
      expect(buttons[2]).toHaveAttribute("aria-expanded", "true");
      expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
    });
  });
});
