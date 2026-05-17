import type { BriefRevision } from "../types";

type BriefRevisionPanelProps = {
  revision: BriefRevision;
};

export function BriefRevisionPanel({ revision }: BriefRevisionPanelProps) {
  return (
    <div className="border-b border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">本次修订</p>
      <p className="mt-1 text-xs leading-relaxed opacity-90">{revision.summary}</p>
      {revision.changedSections.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {revision.changedSections.map((s) => (
            <li
              key={s}
              className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium"
            >
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
