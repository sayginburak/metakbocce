
import React from 'react';
import { Player } from '../types';

interface StandingsProps {
  players: Player[];
  onPlayerClick: (playerId: string) => void;
  /** Highlight ranks 1..N (e.g. play-off zone) */
  playOffSpots?: number;
}

const Standings: React.FC<StandingsProps> = ({ players, onPlayerClick, playOffSpots }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
      
      <div className="overflow-x-auto -mx-0.5 sm:mx-0">
        <table className="w-full text-left whitespace-nowrap text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[9px] sm:text-[10px] tracking-wider leading-none">
              <th className="px-1 sm:px-2 py-1.5 sm:py-2 font-medium text-center w-7 sm:w-8">#</th>
              <th className="px-1 sm:px-2 py-1.5 sm:py-2 font-medium max-w-[min(42vw,11rem)] sm:max-w-none">Takım</th>
              <th className="px-0.5 sm:px-1 py-1.5 sm:py-2 font-medium text-center w-7 sm:w-8">O</th>
              <th className="px-0.5 sm:px-1 py-1.5 sm:py-2 font-medium text-center text-green-600 dark:text-green-400 w-7 sm:w-8">G</th>
              <th className="px-0.5 sm:px-1 py-1.5 sm:py-2 font-medium text-center text-red-500 dark:text-red-400 w-7 sm:w-8">M</th>
              <th className="px-0.5 sm:px-1 py-1.5 sm:py-2 font-medium text-center w-9 sm:w-10">Av</th>
              <th className="px-1 sm:px-2 py-1.5 sm:py-2 font-medium text-right text-slate-900 dark:text-white w-9 sm:w-10">P</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {players.map((player, index) => {
                const av = player.stats.pointsFor - player.stats.pointsAgainst;
                const inPlayOffZone = playOffSpots != null && playOffSpots > 0 && index < playOffSpots;
                return (
                  <tr
                    key={player.id}
                    className={`transition-colors text-xs sm:text-sm ${
                      inPlayOffZone
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/25 hover:bg-emerald-50 dark:hover:bg-emerald-950/35'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <td className="px-1 sm:px-2 py-1 sm:py-1.5 text-center">
                      <div className={`
                        flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full font-bold text-[10px] sm:text-xs mx-auto
                        ${index === 0 ? 'bg-yellow-500 text-yellow-950' : 
                          index === 1 ? 'bg-slate-300 text-slate-900' : 
                          index === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'}
                      `}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-1 sm:px-2 py-1 sm:py-1.5 font-medium text-slate-900 dark:text-slate-200">
                      <div 
                        className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate sm:max-w-none"
                        onClick={() => onPlayerClick(player.id)}
                        title={player.name}
                      >
                        {player.name}
                      </div>
                    </td>
                    <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 text-center text-slate-500 dark:text-slate-500">{player.stats.played}</td>
                    <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 text-center text-green-600 dark:text-green-400 font-medium">{player.stats.won}</td>
                    <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 text-center text-red-500 dark:text-red-400 font-medium">{player.stats.lost}</td>
                    <td className="px-0.5 sm:px-1 py-1 sm:py-1.5 text-center text-slate-500 dark:text-slate-400 font-mono text-[10px] sm:text-xs">
                      {av > 0 ? `+${av}` : av}
                    </td>
                    <td className="px-1 sm:px-2 py-1 sm:py-1.5 text-right font-bold text-slate-900 dark:text-slate-100">{player.stats.points}</td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;
