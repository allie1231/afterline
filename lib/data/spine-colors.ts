// Shared spine color palette — used by the New Line form AND the
// per-source color picker on the source detail page.

export const SPINE_COLORS = [
  { value: "auto", color: null, label: "AUTO" },
  { value: "var(--blue)", color: "var(--blue)" },
  { value: "#1a2847", color: "#1a2847" }, // navy
  { value: "#9a8cc4", color: "#9a8cc4" }, // lilac
  { value: "var(--cyan)", color: "var(--cyan)" },
  { value: "var(--green)", color: "var(--green)" },
  { value: "#3a5a3a", color: "#3a5a3a" }, // forest
  { value: "var(--yellow)", color: "var(--yellow)" },
  { value: "#c89a2e", color: "#c89a2e" }, // mustard
  { value: "var(--orange)", color: "var(--orange)" },
  { value: "#b35c3e", color: "#b35c3e" }, // terracotta
  { value: "var(--red)", color: "var(--red)" },
  { value: "#7a1f1f", color: "#7a1f1f" }, // burgundy
  { value: "#e8a08e", color: "#e8a08e" }, // salmon
  { value: "var(--ink)", color: "var(--ink)" },
] as const;
