
import React, { useState, useMemo, useEffect } from 'react';
import { LeagueData } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import LeagueGroupTabs from './LeagueGroupTabs';

interface ScheduleProps {
  data: LeagueData;
  onPlayerClick: (playerId: string) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ data, onPlayerClick }) => {
  // Initialize to the current week defined in data, clamped to valid range.
  // If currentWeek is 2, it means week 1 and 2 are done, so we show index 2 (Week 3).
  const [currentWeekIndex, setCurrentWeekIndex] = useState(() => {
      if (data.schedule.length === 0) return 0;
      return Math.min(data.currentWeek, data.schedule.length - 1);
  });

  const [activeGroupId, setActiveGroupId] = useState(() => data.groups?.[0]?.id ?? 'all');

  // Keep index valid when season data swaps in (async load) or schedule length changes.
  useEffect(() => {
    setCurrentWeekIndex((prev) => {
      if (data.schedule.length === 0) return 0;
      return Math.min(prev, data.schedule.length - 1);
    });
  }, [data.schedule.length]);

  const currentWeek = data.schedule[currentWeekIndex];

  const leaguePrintLabel = [data.leagueName, data.leagueSubtitle].filter(Boolean).join(' — ') || 'Metak Dart Ligi';

  const activeGroup = data.groups?.find((g) => g.id === activeGroupId);

  // Must run unconditionally — never place hooks after an early return.
  const weekMatches = useMemo(() => {
    const cw = data.schedule[currentWeekIndex];
    if (!cw) return [];
    const g = data.groups?.find(x => x.id === activeGroupId);
    if (!g) return cw.matches;
    return cw.matches.filter(
      m => g.playerIds.includes(m.player1Id) && g.playerIds.includes(m.player2Id)
    );
  }, [data.schedule, currentWeekIndex, data.groups, activeGroupId]);

  if (!currentWeek) {
      return <div className="text-center p-8 text-slate-500">Fikstür verisi bulunamadı.</div>;
  }

  const getPlayerName = (id: string) => data.players.find(p => p.id === id)?.name || "Bilinmiyor";

  // Split matches into 3 rounds (assuming 3 matches per player per week)
  const totalMatches = weekMatches.length;
  const matchesPerRound = Math.ceil(totalMatches / 3) || 1;
  
  const rounds = [];
  if (totalMatches > 0) {
      for (let i = 0; i < totalMatches; i += matchesPerRound) {
        rounds.push(weekMatches.slice(i, i + matchesPerRound));
      }
  } else {
      rounds.push([]); // Handle empty weeks gracefully
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Print Only View */}
      <div className="hidden print:block w-full bg-white">
        {rounds.map((roundMatches, roundIndex) => (
            <div 
                key={roundIndex} 
                className={`print-week-page ${roundIndex === rounds.length - 1 ? 'print-week-page-last' : ''}`}
            >
                <div className="print-week-page-content">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-black mb-1">{currentWeek.name} Maç Programı</h1>
                        <p className="text-lg text-gray-600">{currentWeek.date}</p>
                        {activeGroup ? (
                          <p className="text-base font-bold text-black mt-2 tracking-wide">
                            {activeGroup.label}
                          </p>
                        ) : null}
                    </div>
                    
                    <div className="border-b-2 border-black pb-2">
                        <h2 className="text-xl font-bold text-black uppercase tracking-widest">
                            {roundIndex + 1}. Maçlar
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 content-start">
                        {roundMatches.map((match) => (
                            <div key={match.id} className="flex items-center justify-between border-b border-gray-200 pb-2 pt-1 last:border-0">
                                <div className="flex-1 text-right text-base font-semibold text-black truncate pr-2">
                                    {getPlayerName(match.player1Id)}
                                </div>
                                <div className="mx-2 w-24 text-center">
                                    <div className="font-mono text-lg font-bold border border-gray-800 px-2.5 py-1 bg-gray-50 rounded">
                                        {match.isCompleted ? `${match.score1} - ${match.score2}` : "   -   "}
                                    </div>
                                </div>
                                <div className="flex-1 text-left text-base font-semibold text-black truncate pl-2">
                                    {getPlayerName(match.player2Id)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer forced to bottom of page */}
                <div className="text-center text-gray-500 text-xs border-t border-gray-300 pt-2">
                    {leaguePrintLabel}
                    {activeGroup ? ` — ${activeGroup.label}` : ''} — {currentWeek.name} — Sayfa {roundIndex + 1}/{rounds.length}
                </div>
            </div>
        ))}
      </div>

      {/* Group tabs (two-group seasons) */}
      {data.groups && data.groups.length > 0 && (
        <LeagueGroupTabs
          groups={data.groups}
          activeGroupId={activeGroupId}
          onGroupChange={setActiveGroupId}
        />
      )}

      {/* Week Navigator */}
      <div className="print:hidden flex items-center justify-between bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm dark:shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
        <button 
          onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
          disabled={currentWeekIndex === 0}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-400 dark:text-emerald-400" />
        </button>
        
        <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {currentWeek.name}
            </h2>
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                {currentWeek.date}
            </span>
        </div>

        <div className="flex items-center gap-2">
            <button
                onClick={handlePrint}
                className="hidden sm:block p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
                title="Fikstürü Yazdır"
            >
                <Printer className="w-6 h-6" />
            </button>

            <button 
              onClick={() => setCurrentWeekIndex(prev => Math.min(data.schedule.length - 1, prev + 1))}
              disabled={currentWeekIndex === data.schedule.length - 1}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-slate-400 dark:text-emerald-400" />
            </button>
        </div>
      </div>

      {/* Matches Rounds */}
      <div className="space-y-8 print:hidden">
        {rounds.map((roundMatches, roundIndex) => (
            <div key={roundIndex} className="animate-in slide-in-from-bottom-2 duration-500" style={{animationDelay: `${roundIndex * 100}ms`}}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {roundIndex + 1}. Maçlar
                    </span>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                    {roundMatches.map((match) => {
                        const isFinished = match.isCompleted;
                        // Determine winner style
                        const p1Win = isFinished && match.score1! > match.score2!;
                        const p2Win = isFinished && match.score2! > match.score1!;

                        return (
                            <div key={match.id} className={`
                                flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-200
                                ${isFinished 
                                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30'}
                            `}>
                                {/* Player 1 */}
                                <div 
                                    className={`flex-1 text-right text-sm font-medium truncate cursor-pointer transition-colors ${p1Win ? 'text-green-600 dark:text-green-400' : p2Win ? 'text-red-500/70 dark:text-red-400/70' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                                    onClick={() => onPlayerClick(match.player1Id)}
                                    title={getPlayerName(match.player1Id)}
                                >
                                    {getPlayerName(match.player1Id)}
                                </div>

                                {/* Score Box */}
                                <div className="mx-3 min-w-[50px] flex justify-center">
                                    {isFinished ? (
                                        <div className="flex items-center gap-1 font-mono font-bold text-sm bg-slate-100 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                            <span className={p1Win ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}>{match.score1}</span>
                                            <span className="text-slate-400 dark:text-slate-600">:</span>
                                            <span className={p2Win ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}>{match.score2}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400 dark:text-slate-600">vs</span>
                                    )}
                                </div>

                                {/* Player 2 */}
                                <div 
                                    className={`flex-1 text-left text-sm font-medium truncate cursor-pointer transition-colors ${p2Win ? 'text-green-600 dark:text-green-400' : p1Win ? 'text-red-500/70 dark:text-red-400/70' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                                    onClick={() => onPlayerClick(match.player2Id)}
                                    title={getPlayerName(match.player2Id)}
                                >
                                    {getPlayerName(match.player2Id)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Schedule;
