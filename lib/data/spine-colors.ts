type SpineColor = { value: string; color: string | null; label: string };

export const SPINE_COLORS: SpineColor[] = [
  { value: "auto",       color: null,          label: "AUTO" },
  { value: "var(--blue)",  color: "var(--blue)",  label: "Blue" },
  { value: "#1a2847",      color: "#1a2847",      label: "Navy" },
  { value: "#9a8cc4",      color: "#9a8cc4",      label: "Lilac" },
  { value: "var(--cyan)",  color: "var(--cyan)",  label: "Cyan" },
  { value: "var(--green)", color: "var(--green)", label: "Green" },
  { value: "#3a5a3a",      color: "#3a5a3a",      label: "Forest" },
  { value: "var(--yellow)",color: "var(--yellow)",label: "Yellow" },
  { value: "#c89a2e",      color: "#c89a2e",      label: "Mustard" },
  { value: "var(--orange)",color: "var(--orange)",label: "Orange" },
  { value: "#b35c3e",      color: "#b35c3e",      label: "Terracotta" },
  { value: "var(--red)",   color: "var(--red)",   label: "Red" },
  { value: "#7a1f1f",      color: "#7a1f1f",      label: "Burgundy" },
  { value: "#e8a08e",      color: "#e8a08e",      label: "Salmon" },
  { value: "var(--ink)",   color: "var(--ink)",   label: "Ink" },
];
