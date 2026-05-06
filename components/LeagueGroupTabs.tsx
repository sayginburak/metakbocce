import React from 'react';
import { LeagueGroup } from '../types';

interface LeagueGroupTabsProps {
  groups: LeagueGroup[];
  activeGroupId: string;
  onGroupChange: (id: string) => void;
}

/** Split labels like "Grup A — Subtitle" into two stacked lines on mobile */
function GroupButtonContent({ label, compact }: { label: string; compact: boolean }) {
  const parts = label.split(' — ');
  if (compact && parts.length === 2) {
    return (
      <span className="flex flex-col items-center justify-center gap-0 leading-tight">
        <span className="font-semibold">{parts[0]}</span>
        <span className="text-[10px] font-normal opacity-90">{parts[1]}</span>
      </span>
    );
  }
  return <span className="text-center leading-snug">{label}</span>;
}

/**
 * Group selector (Grup A / Grup B) — same styles as Fikstür; optimized for narrow screens.
 */
const LeagueGroupTabs: React.FC<LeagueGroupTabsProps> = ({
  groups,
  activeGroupId,
  onGroupChange,
}) => {
  if (!groups.length) return null;

  return (
    <div className="print:hidden flex flex-row gap-1.5 sm:gap-2 w-full">
      {groups.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onGroupChange(g.id)}
          className={`flex-1 min-w-0 rounded-lg font-semibold transition-all border py-2 px-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm ${
            activeGroupId === g.id
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-400/50'
          }`}
        >
          <span className="sm:hidden">
            <GroupButtonContent label={g.label} compact />
          </span>
          <span className="hidden sm:inline">{g.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LeagueGroupTabs;
