import React from "react";

interface FormattedChatMessageProps {
  text: string;
  className?: string;
  fontStyle?: "sans" | "serif" | "mono" | "cursive";
}

/**
 * Parses and renders markdown-like typography formatting safely:
 * - **negrita** -> <strong>
 * - *cursiva* or _cursiva_ -> <em>
 * - __subrayado__ -> <u>
 * - ~~tachado~~ -> <del>
 * - `código` -> <code>
 * - Font families: sans, serif, mono, cursive
 * - Preserves line breaks and emojis
 */
export const FormattedChatMessage: React.FC<FormattedChatMessageProps> = ({
  text,
  className = "",
  fontStyle = "sans",
}) => {
  if (!text) return null;

  const fontClass =
    fontStyle === "serif"
      ? "font-serif tracking-normal"
      : fontStyle === "mono"
        ? "font-mono text-[12px] tracking-tight"
        : fontStyle === "cursive"
          ? "font-serif italic tracking-wide"
          : "font-sans";

  // Split into lines
  const lines = text.split("\n");

  return (
    <div className={`space-y-1 ${fontClass} ${className}`}>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-2" />;
        }

        return (
          <p key={lineIdx} className="leading-relaxed">
            {renderFormattedLine(line)}
          </p>
        );
      })}
    </div>
  );
};

function renderFormattedLine(line: string): React.ReactNode {
  // Regex to match markdown and typography tokens:
  // 1: **bold**
  // 2: __underline__
  // 3: ~~strikethrough~~
  // 4: *italic*
  // 5: _italic_
  // 6: `code`
  // 7: [serif]...[/serif]
  // 8: [mono]...[/mono]
  // 9: [cursive]...[/cursive]
  const tokenRegex =
    /(\*\*[^*]+?\*\*|__[^_]+?__|~~[^~]+?~~|\*[^*\n]+?\*|_[^_\n]+?_|`[^`]+?`|\[serif\][\s\S]*?\[\/serif\]|\[mono\][\s\S]*?\[\/mono\]|\[cursive\][\s\S]*?\[\/cursive\])/g;

  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={idx} className="font-extrabold text-inherit drop-shadow-xs">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("__") && part.endsWith("__") && part.length >= 4) {
      return (
        <u key={idx} className="underline decoration-current underline-offset-2">
          {part.slice(2, -2)}
        </u>
      );
    }

    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return (
        <del key={idx} className="line-through opacity-80">
          {part.slice(2, -2)}
        </del>
      );
    }

    if (part.startsWith("[serif]") && part.endsWith("[/serif]")) {
      return (
        <span key={idx} className="font-serif tracking-normal font-semibold">
          {part.slice(7, -8)}
        </span>
      );
    }

    if (part.startsWith("[mono]") && part.endsWith("[/mono]")) {
      return (
        <span key={idx} className="font-mono text-[11px] bg-black/10 px-1 py-0.5 rounded">
          {part.slice(6, -7)}
        </span>
      );
    }

    if (part.startsWith("[cursive]") && part.endsWith("[/cursive]")) {
      return (
        <span key={idx} className="font-serif italic tracking-wide">
          {part.slice(9, -10)}
        </span>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={idx} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
      return (
        <em key={idx} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-[11px] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}
