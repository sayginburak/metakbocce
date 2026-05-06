
import React, { useState } from 'react';
import { LeagueData, Match, Player } from '../types';
import { ArrowLeft, Trophy, Calendar, Target, Shield, XCircle, CheckCircle, MinusCircle } from 'lucide-react';

interface PlayerDetailProps {
  player: Player;
  data: LeagueData;
  onBack: () => void;
  onPlayerClick: (playerId: string) => void;
}

type FilterType = 'ALL' | 'PAST' | 'FUTURE';

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, data, onBack, onPlayerClick }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Helper to get opponent name
  const getOpponent = (match: Match) => {
    const opponentId = match.player1Id === player.id ? match.player2Id : match.player1Id;
    return data.players.find(p => p.id === opponentId);
  };

  const getOpponentScore = (match: Match) => {
     if (match.player1Id === player.id) return { my: match.score1, opp: match.score2 };
     return { my: match.score2, opp: match.score1 };
  };

  // Collect all matches involving this player
  const playerMatches = data.schedule.flatMap(week => 
    week.matches
      .filter(m => m.player1Id === player.id || m.player2Id === player.id)
      .map(m => ({ ...m, weekName: week.name, weekId: week.id, date: week.date }))
  );

  // Apply Filter based on currentWeek
  const filteredMatches = playerMatches.filter(match => {
      if (filter === 'ALL') return true;
      if (filter === 'PAST') return match.weekId <= data.currentWeek;
      if (filter === 'FUTURE') return match.weekId > data.currentWeek;
      return true;
  });

  return (
    <div className="space-y-6">
      {/* Header / Stats Card - Compact Version */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between gap-4 mb-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group text-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Geri
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{player.name}</h2>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-50 dark:bg-slate-900/50 py-2 px-1 rounded border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Puan</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-none">{player.stats.points}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 py-2 px-1 rounded border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Galibiyet</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400 leading-none">{player.stats.won}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 py-2 px-1 rounded border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center">
             <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Mağlubiyet</div>
            <div className="text-lg font-bold text-red-500 dark:text-red-400 leading-none">{player.stats.lost}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 py-2 px-1 rounded border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center">
             <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Skor Farkı</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-300 leading-none">
                {player.stats.pointsFor - player.stats.pointsAgainst > 0 ? '+' : ''}
                {player.stats.pointsFor - player.stats.pointsAgainst}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-1 bg-white dark:bg-slate-800 p-1 rounded-lg w-fit border border-slate-200 dark:border-slate-700 transition-colors">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
            filter === 'ALL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          TÜMÜ
        </button>
        <button
          onClick={() => setFilter('PAST')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
            filter === 'PAST' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          GEÇMİŞ
        </button>
        <button
          onClick={() => setFilter('FUTURE')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
            filter === 'FUTURE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          GELECEK
        </button>
      </div>

      {/* Match History List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 px-1">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Maçlar
        </h3>
        
        {filteredMatches.length === 0 ? (
           <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500">
              Bu filtreye uygun maç bulunamadı.
           </div>
        ) : (
        <div className="grid gap-2">
            {filteredMatches.map((match) => {
                const opponent = getOpponent(match);
                const scores = getOpponentScore(match);
                const isPlayed = match.score1 !== null && match.score2 !== null;
                const isDraw = isPlayed && scores.my === scores.opp;
                const iWon = isPlayed && !isDraw && scores.my! > scores.opp!;
                
                return (
                    <div key={match.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        {/* Week Info & Date */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest min-w-[60px]">
                                {match.weekName}
                            </span>
                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                {match.date}
                            </div>
                        </div>

                        {/* Matchup */}
                        <div className="flex items-center justify-center gap-4 flex-1 w-full sm:w-auto">
                             <div className="flex items-center justify-end flex-1">
                                <span className={`font-bold text-right text-sm truncate transition-colors ${isPlayed ? (isDraw ? 'text-slate-600 dark:text-slate-300' : iWon ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400') : 'text-slate-900 dark:text-white'}`}>
                                    {player.name}
                                </span>
                             </div>

                             <div className={`px-2 py-0.5 rounded text-base font-mono font-bold border whitespace-nowrap min-w-[50px] text-center
                                ${isPlayed ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs py-1.5'}`}>
                                {isPlayed ? `${scores.my} : ${scores.opp}` : 'v'}
                             </div>

                             <div 
                                className="flex items-center justify-start flex-1 cursor-pointer group"
                                onClick={() => opponent && onPlayerClick(opponent.id)}
                             >
                                <span className={`font-bold text-left text-sm truncate transition-colors ${isPlayed ? (isDraw ? 'text-slate-600 dark:text-slate-300' : iWon ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400') : 'text-slate-600 dark:text-slate-300'} group-hover:text-emerald-600 dark:group-hover:text-emerald-400`}>
                                    {opponent?.name || 'Unknown'}
                                </span>
                             </div>
                        </div>
                    </div>
                );
            })}
        </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetail;
