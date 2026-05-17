import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "../types";

type MarkdownContentProps = {
  content: string;
  className?: string;
  citations?: Citation[];
  onCitationClick?: (citation: Citation) => void;
};

export function MarkdownContent({
  content,
  className = "",
  citations = [],
  onCitationClick,
}: MarkdownContentProps) {
  const components: ComponentProps<typeof ReactMarkdown>["components"] = {
    a: ({ href, children }) => {
      const citeMatch = href?.match(/^cite:(\d+)$/);
      if (citeMatch && onCitationClick) {
        const idx = Number(citeMatch[1]) - 1;
        const citation = citations[idx];
        if (citation) {
          return (
            <button
              type="button"
              onClick={() => onCitationClick(citation)}
              className="mx-0.5 inline-flex align-super text-[10px] font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
            >
              [{citeMatch[1]}]
            </button>
          );
        }
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`prose-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
