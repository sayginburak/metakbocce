import React, { useEffect, useState } from 'react';
import { LeagueData } from '../types';
import { getFinalsBracket, BracketRound } from '../utils/mockData';
import { Trophy, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

interface FinalsProps {
  data: LeagueData;
  onPlayerClick: (playerId: string) => void;
}

const ROUND_ACCENTS = [
  'from-emerald-500 to-cyan-500',
  'from-cyan-500 to-sky-500',
  'from-sky-500 to-indigo-500',
  'from-amber-500 to-yellow-500',
];

/** Pick the first round that still has an unplayed match; otherwise the last round. */
function initialRoundIndex(rounds: BracketRound[]): number {
  if (rounds.length === 0) return 0;
  const idx = rounds.findIndex(r => r.matches.some(m => !m.isCompleted));
  return idx === -1 ? rounds.length - 1 : idx;
}

const Finals: React.FC<FinalsProps> = ({ data, onPlayerClick }) => {
  const spots = data.playOffSpots ?? 8;
  const rounds = getFinalsBracket(data, spots);

  const [activeRoundIdx, setActiveRoundIdx] = useState(() => initialRoundIndex(rounds));

  // Clamp when season data swaps in.
  useEffect(() => {
    setActiveRoundIdx(prev => {
      if (rounds.length === 0) return 0;
      return Math.min(prev, rounds.length - 1);
    });
  }, [rounds.length]);

  const getPlayerName = (id: string | null, fallback: string) => {
    if (!id) return fallback;
    const p = data.players.find(pl => pl.id === id);
    return p?.name ?? fallback;
  };

  const activeRound = rounds[activeRoundIdx];
  const isFirstRound = activeRoundIdx === 0;
  const isLastRound = activeRoundIdx === rounds.length - 1;
  const activeAccent = ROUND_ACCENTS[activeRoundIdx % ROUND_ACCENTS.length];

  const handlePrint = () => {
    window.print();
  };

  const leaguePrintLabel =
    [data.leagueName, data.leagueSubtitle].filter(Boolean).join(' — ') || 'Metak Dart Ligi';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Print-only bracket (landscape) */}
      <FinalsPrintView
        rounds={rounds}
        leagueLabel={leaguePrintLabel}
        getPlayerName={getPlayerName}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-sm shrink-0">
            <Trophy className="w-5 h-5" />
          </span>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent truncate">
            Finaller
          </h2>
        </div>
        <button
          onClick={handlePrint}
          title="Fikstürü Yazdır"
          aria-label="Finalleri yazdır"
          className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Mobile: round picker + compact list */}
      <div className="md:hidden print:hidden space-y-3">
        {/* Round Navigator */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <button
            onClick={() => setActiveRoundIdx(i => Math.max(0, i - 1))}
            disabled={isFirstRound}
            aria-label="Önceki tur"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-400 dark:text-emerald-400" />
          </button>

          <div className="flex flex-col items-center gap-1 min-w-0 px-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase text-white bg-gradient-to-r ${activeAccent} shadow-sm max-w-full`}
            >
              {isLastRound && <Trophy className="w-3 h-3" />}
              <span className="truncate">{activeRound?.name ?? ''}</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {activeRoundIdx + 1} / {rounds.length} · {activeRound?.matches.length ?? 0} maç
            </span>
          </div>

          <button
            onClick={() => setActiveRoundIdx(i => Math.min(rounds.length - 1, i + 1))}
            disabled={isLastRound}
            aria-label="Sonraki tur"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-slate-400 dark:text-emerald-400" />
          </button>
        </div>

        {/* Dot position indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {rounds.map((_, i) => {
            const isActive = i === activeRoundIdx;
            const dotAccent = ROUND_ACCENTS[i % ROUND_ACCENTS.length];
            return (
              <button
                key={i}
                onClick={() => setActiveRoundIdx(i)}
                aria-label={`${i + 1}. tura git`}
                className={`h-1.5 rounded-full transition-all ${
                  isActive
                    ? `w-6 bg-gradient-to-r ${dotAccent}`
                    : 'w-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                }`}
              />
            );
          })}
        </div>

        {/* Compact match cards */}
        <div className="space-y-2">
          {activeRound?.matches.map((match) => (
            <CompactMatchCard
              key={match.id}
              match={match}
              isFinalRound={isLastRound}
              getPlayerName={getPlayerName}
              onPlayerClick={onPlayerClick}
            />
          ))}
        </div>
      </div>

      {/* Desktop/tablet: 4-column bracket */}
      <div className="hidden md:block print:hidden overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div
          className="grid gap-3 sm:gap-6 items-stretch min-w-[640px] sm:min-w-0"
          style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(180px, 1fr))` }}
        >
          {rounds.map((round, roundIdx) => (
            <BracketColumn
              key={round.id}
              round={round}
              roundIdx={roundIdx}
              totalRounds={rounds.length}
              accent={ROUND_ACCENTS[roundIdx % ROUND_ACCENTS.length]}
              getPlayerName={getPlayerName}
              onPlayerClick={onPlayerClick}
            />
          ))}
        </div>
      </div>

      {/* Legend (intentionally empty — kept as a shared slot) */}
      <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 text-center print:hidden">
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          Print-only landscape bracket                      */
/* -------------------------------------------------------------------------- */

interface FinalsPrintViewProps {
  rounds: BracketRound[];
  leagueLabel: string;
  getPlayerName: (id: string | null, fallback: string) => string;
}

const FinalsPrintView: React.FC<FinalsPrintViewProps> = ({
  rounds,
  leagueLabel,
  getPlayerName,
}) => {
  return (
    <div className="hidden print:block">
      <div className="print-finals-page">
        <div className="print-finals-header">
          <h1>Finaller</h1>
          <div className="print-finals-sub">{leagueLabel}</div>
        </div>

        <div className="print-bracket">
          {rounds.map((round, roundIdx) => (
            <div key={round.id} className="print-round">
              <div className="print-round-title">{round.name}</div>
              <div className="print-round-matches">
                {round.matches.map((match) => {
                  const p1Name = getPlayerName(match.player1Id, match.player1Label || 'TBD');
                  const p2Name = getPlayerName(match.player2Id, match.player2Label || 'TBD');
                  const p1Known = Boolean(match.player1Id);
                  const p2Known = Boolean(match.player2Id);
                  const p1Win = match.isCompleted && match.score1! > match.score2!;
                  const p2Win = match.isCompleted && match.score2! > match.score1!;

                  return (
                    <div key={match.id} className="print-bracket-match-slot">
                      <div className="print-bracket-match">
                        {roundIdx > 0 && <span className="print-bracket-arrow">▶</span>}
                        <div className="print-match-code">
                          {match.code}
                        </div>
                        <PrintParticipant
                          seed={p1Known ? match.player1Label : undefined}
                          name={p1Name}
                          score={match.score1}
                          showScore={match.isCompleted}
                          isWinner={p1Win}
                          isLoser={match.isCompleted && !p1Win}
                        />
                        <PrintParticipant
                          seed={p2Known ? match.player2Label : undefined}
                          name={p2Name}
                          score={match.score2}
                          showScore={match.isCompleted}
                          isWinner={p2Win}
                          isLoser={match.isCompleted && !p2Win}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="print-finals-footer">{leagueLabel} — Finaller</div>
      </div>
    </div>
  );
};

interface PrintParticipantProps {
  seed?: string;
  name: string;
  score: number | null;
  showScore: boolean;
  isWinner: boolean;
  isLoser: boolean;
}

const PrintParticipant: React.FC<PrintParticipantProps> = ({
  seed,
  name,
  score,
  showScore,
  isWinner,
  isLoser,
}) => {
  const classes = ['print-match-player'];
  if (isWinner) classes.push('win');
  if (isLoser) classes.push('loss');
  return (
    <div className={classes.join(' ')}>
      {seed ? <span className="print-match-seed">{seed}</span> : null}
      <span className="print-match-name">{name}</span>
      <span className="print-match-score">
        {showScore && score != null ? score : '-'}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Mobile card                                   */
/* -------------------------------------------------------------------------- */

interface CompactMatchCardProps {
  match: BracketRound['matches'][number];
  isFinalRound: boolean;
  getPlayerName: (id: string | null, fallback: string) => string;
  onPlayerClick: (playerId: string) => void;
}

const CompactMatchCard: React.FC<CompactMatchCardProps> = ({
  match,
  isFinalRound,
  getPlayerName,
  onPlayerClick,
}) => {
  const p1Name = getPlayerName(match.player1Id, match.player1Label || 'TBD');
  const p2Name = getPlayerName(match.player2Id, match.player2Label || 'TBD');
  const p1Win = match.isCompleted && match.score1! > match.score2!;
  const p2Win = match.isCompleted && match.score2! > match.score1!;

  return (
    <div
      className={`rounded-xl border bg-white dark:bg-slate-800 shadow-sm overflow-hidden ${
        isFinalRound
          ? 'border-amber-300 dark:border-amber-500/60 shadow-amber-200/40 dark:shadow-amber-900/30'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60">
        <span>{match.code}</span>
        {isFinalRound && (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Trophy className="w-3 h-3" /> Final
          </span>
        )}
      </div>

      <CompactParticipantRow
        seedLabel={match.player1Label}
        name={p1Name}
        isWinner={p1Win}
        isLoser={p2Win}
        isKnown={Boolean(match.player1Id)}
        score={match.score1}
        showScore={match.isCompleted}
        onClick={match.player1Id ? () => onPlayerClick(match.player1Id!) : undefined}
      />
      <div className="h-px bg-slate-100 dark:bg-slate-700/60" />
      <CompactParticipantRow
        seedLabel={match.player2Label}
        name={p2Name}
        isWinner={p2Win}
        isLoser={p1Win}
        isKnown={Boolean(match.player2Id)}
        score={match.score2}
        showScore={match.isCompleted}
        onClick={match.player2Id ? () => onPlayerClick(match.player2Id!) : undefined}
      />
    </div>
  );
};

interface CompactParticipantRowProps {
  seedLabel?: string;
  name: string;
  isWinner: boolean;
  isLoser: boolean;
  isKnown: boolean;
  score: number | null;
  showScore: boolean;
  onClick?: () => void;
}

const CompactParticipantRow: React.FC<CompactParticipantRowProps> = ({
  seedLabel,
  name,
  isWinner,
  isLoser,
  isKnown,
  score,
  showScore,
  onClick,
}) => {
  const textClass = !isKnown
    ? 'text-slate-400 dark:text-slate-500 italic'
    : isWinner
    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
    : isLoser
    ? 'text-slate-400 dark:text-slate-500 line-through'
    : 'text-slate-800 dark:text-slate-200 font-medium';
  const bgClass = isWinner
    ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
    : 'bg-transparent active:bg-slate-50 dark:active:bg-slate-700/30';
  const clickable = Boolean(onClick);

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2.5 text-sm transition-colors ${bgClass} ${clickable ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      title={name}
    >
      {seedLabel && isKnown ? (
        <span
          className={`shrink-0 inline-flex items-center justify-center min-w-[2.25rem] px-1.5 h-5 rounded-md text-[10px] font-bold tracking-wider border ${
            isWinner
              ? 'border-emerald-400/70 bg-emerald-100/80 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400'
          }`}
        >
          {seedLabel}
        </span>
      ) : null}
      <span className={`flex-1 truncate ${textClass}`}>{name}</span>
      <span
        className={`shrink-0 w-7 text-right font-mono text-sm ${
          isWinner
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {showScore && score != null ? score : '-'}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Desktop bracket                               */
/* -------------------------------------------------------------------------- */

interface BracketColumnProps {
  round: BracketRound;
  roundIdx: number;
  totalRounds: number;
  accent: string;
  getPlayerName: (id: string | null, fallback: string) => string;
  onPlayerClick: (playerId: string) => void;
}

const BracketColumn: React.FC<BracketColumnProps> = ({
  round,
  roundIdx,
  totalRounds,
  accent,
  getPlayerName,
  onPlayerClick,
}) => {
  // Spacing between matches grows on each later round so bracket lines align visually.
  const gapClass = ['gap-2 sm:gap-3', 'gap-8 sm:gap-10', 'gap-20 sm:gap-24', 'gap-32 sm:gap-40'][roundIdx] ?? 'gap-3';
  const isFinalRound = roundIdx === totalRounds - 1;

  return (
    <div className="flex flex-col">
      <div className={`mb-2 sm:mb-3 text-center`}>
        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white bg-gradient-to-r ${accent} shadow-sm`}>
          {round.name}
        </span>
      </div>
      <div className={`flex-1 flex flex-col justify-around ${gapClass}`}>
        {round.matches.map((match) => {
          const p1Name = getPlayerName(match.player1Id, match.player1Label || 'TBD');
          const p2Name = getPlayerName(match.player2Id, match.player2Label || 'TBD');
          const p1Win = match.isCompleted && match.score1! > match.score2!;
          const p2Win = match.isCompleted && match.score2! > match.score1!;

          const hasP1 = Boolean(match.player1Id);
          const hasP2 = Boolean(match.player2Id);

          return (
            <div
              key={match.id}
              className={`relative rounded-xl border bg-white dark:bg-slate-800 shadow-sm transition-all overflow-hidden
                ${isFinalRound
                  ? 'border-amber-300 dark:border-amber-500/60 shadow-amber-200/40 dark:shadow-amber-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400/60 dark:hover:border-emerald-500/50'}
              `}
            >
              {/* Match number strip */}
              <div className="flex items-center justify-between px-2.5 py-1 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60">
                <span>{match.code}</span>
                {isFinalRound ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Trophy className="w-3 h-3" /> Final
                  </span>
                ) : (
                  <span>{round.name}</span>
                )}
              </div>

              <ParticipantRow
                name={p1Name}
                isWinner={p1Win}
                isLoser={p2Win}
                isKnown={hasP1}
                score={match.score1}
                showScore={match.isCompleted}
                onClick={match.player1Id ? () => onPlayerClick(match.player1Id!) : undefined}
              />
              <div className="h-px bg-slate-100 dark:bg-slate-700/60" />
              <ParticipantRow
                name={p2Name}
                isWinner={p2Win}
                isLoser={p1Win}
                isKnown={hasP2}
                score={match.score2}
                showScore={match.isCompleted}
                onClick={match.player2Id ? () => onPlayerClick(match.player2Id!) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ParticipantRowProps {
  name: string;
  isWinner: boolean;
  isLoser: boolean;
  isKnown: boolean;
  score: number | null;
  showScore: boolean;
  onClick?: () => void;
}

const ParticipantRow: React.FC<ParticipantRowProps> = ({
  name,
  isWinner,
  isLoser,
  isKnown,
  score,
  showScore,
  onClick,
}) => {
  const baseClass =
    'flex items-center justify-between gap-2 px-2.5 sm:px-3 py-2 text-sm transition-colors';
  const textClass = !isKnown
    ? 'text-slate-400 dark:text-slate-500 italic'
    : isWinner
    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
    : isLoser
    ? 'text-slate-400 dark:text-slate-500 line-through'
    : 'text-slate-800 dark:text-slate-200 font-medium';
  const bgClass = isWinner
    ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
    : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30';

  const clickable = Boolean(onClick);

  return (
    <div
      className={`${baseClass} ${bgClass} ${clickable ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      title={name}
    >
      <span className={`truncate ${textClass}`}>{name}</span>
      <span
        className={`shrink-0 w-7 text-right font-mono text-sm ${
          isWinner ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {showScore && score != null ? score : '-'}
      </span>
    </div>
  );
};

export default Finals;
