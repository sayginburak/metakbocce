import React, { useEffect, useRef, useState } from 'react';
import { Tab, LeagueData } from './types';
import {
  loadLeagueData,
  recalculateStandings,
  storeSeasonId,
  getStoredSeasonId,
} from './utils/mockData';
import { SEASONS } from './utils/seasons';
import StandingsPanel from './components/StandingsPanel';
import Schedule from './components/Schedule';
import PlayerDetail from './components/PlayerDetail';
import Finals from './components/Finals';
import { LayoutDashboard, CalendarDays, Sun, Moon, Trophy } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.STANDINGS);
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [seasonId, setSeasonId] = useState(() => getStoredSeasonId());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });
  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const downAccumRef = useRef(0);
  const upAccumRef = useRef(0);
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      lastScrollYRef.current = currentY;

      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (!isMobile) {
        setMobileHeaderHidden(false);
        setMobileNavHidden(false);
        downAccumRef.current = 0;
        upAccumRef.current = 0;
        return;
      }

      const nearTop = currentY < 60;
      const minimalMove = Math.abs(delta) < 4;
      if (minimalMove) return;

      if (delta > 0) {
        downAccumRef.current = Math.min(downAccumRef.current + delta, 200);
        upAccumRef.current = 0;
        if (downAccumRef.current > 50 && !nearTop) {
          setMobileHeaderHidden(true);
          setMobileNavHidden(true);
        }
      } else {
        upAccumRef.current = Math.min(upAccumRef.current - delta, 200);
        downAccumRef.current = 0;
        if (upAccumRef.current > 40 || nearTop) {
          setMobileHeaderHidden(false);
          setMobileNavHidden(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const logoSrc = (() => {
    const basePath = import.meta.env.BASE_URL || '/';
    const normalized = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${normalized}metak.png`;
  })();

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load season data when season changes
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const data = await loadLeagueData(seasonId);
      if (cancelled) return;
      if (data.players.length > 0) {
        const players = recalculateStandings(data);
        setLeagueData({ ...data, players });
      } else {
        setLeagueData(data);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  // When a new season is loaded, default to the Finals tab if it's available;
  // otherwise fall back to Standings if the current tab isn't applicable.
  useEffect(() => {
    if (!leagueData) return;
    if (leagueData.showFinals) {
      setActiveTab(Tab.FINALS);
    } else if (activeTab === Tab.FINALS) {
      setActiveTab(Tab.STANDINGS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueData?.showFinals, seasonId]);

  // Browser tab title follows loaded season (JSON leagueName / leagueSubtitle).
  useEffect(() => {
    if (!leagueData) return;
    const parts = [leagueData.leagueName, leagueData.leagueSubtitle].filter(Boolean);
    document.title = parts.length ? parts.join(' — ') : 'Metak Dart Ligi';
  }, [leagueData]);

  const handleSeasonChange = (nextId: string) => {
    storeSeasonId(nextId);
    setSeasonId(nextId);
    setSelectedPlayerId(null);
  };

  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
    // Optionally scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setSelectedPlayerId(null);
  };

  // Helper to switch tabs and clear selection
  const switchTab = (tab: Tab) => {
      setActiveTab(tab);
      setSelectedPlayerId(null);
  };

  if (!leagueData) {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
    );
  }

  const selectedPlayer = selectedPlayerId ? leagueData.players.find(p => p.id === selectedPlayerId) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col print:block print:h-auto print:bg-white print:text-black print:min-h-0 transition-colors">
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 print:hidden transition-all duration-300 ${mobileHeaderHidden ? '-translate-y-full md:translate-y-0' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-start md:items-center justify-between gap-2 md:h-20 py-2.5 md:py-0">
            <div 
              className="flex items-start md:items-center gap-2 md:gap-3 cursor-pointer min-w-0 flex-1"
              onClick={() => { setSelectedPlayerId(null); setActiveTab(Tab.STANDINGS); }}
            >
              <div className="p-1 md:p-1.5 rounded-xl shrink-0">
                <img src={logoSrc} alt="Metak Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              </div>
              <div className="min-w-0 pt-0.5 md:pt-0">
                <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent leading-snug break-words">
                  {leagueData.leagueName ?? 'Metak'}
                </h1>
                {leagueData.leagueSubtitle ? (
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 md:uppercase tracking-wide md:tracking-widest font-semibold leading-snug break-words mt-0.5">
                    {leagueData.leagueSubtitle}
                  </p>
                ) : null}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 pt-0.5 md:pt-0">
              <label className="print:hidden hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="hidden lg:inline">Sezon</span>
                <select
                  value={seasonId}
                  onChange={(e) => handleSeasonChange(e.target.value)}
                  aria-label="Sezon seç"
                  className="text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-800 dark:text-slate-100 max-w-[180px]"
                >
                  {SEASONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <nav className="hidden md:flex space-x-2 items-center">
                {leagueData.showFinals && (
                  <button
                    onClick={() => switchTab(Tab.FINALS)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                      ${activeTab === Tab.FINALS && !selectedPlayerId
                          ? 'bg-amber-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-200 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                  >
                    <Trophy className="w-4 h-4" />
                    Finaller
                  </button>
                )}
                <button
                  onClick={() => switchTab(Tab.STANDINGS)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${activeTab === Tab.STANDINGS && !selectedPlayerId 
                        ? 'bg-emerald-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-slate-700' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Puan Durumu
                </button>
                <button
                  onClick={() => switchTab(Tab.SCHEDULE)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${activeTab === Tab.SCHEDULE && !selectedPlayerId 
                        ? 'bg-emerald-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-slate-700' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Fikstür & Sonuçlar
                </button>
              </nav>

              <button 
                onClick={toggleTheme}
                className="p-1.5 md:p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Temayı Değiştir"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {/* Full-width season row on small screens — avoids squashing the title */}
          <div className="md:hidden pb-2 print:hidden">
            <label className="block w-full">
              <span className="sr-only">Sezon seç</span>
              <select
                value={seasonId}
                onChange={(e) => handleSeasonChange(e.target.value)}
                aria-label="Sezon seç"
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100"
              >
                {SEASONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bottom Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 px-4 pb-safe print:hidden transition-all duration-300 ${mobileNavHidden ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="flex justify-around py-2 sm:py-3">
          {leagueData.showFinals && (
            <button onClick={() => switchTab(Tab.FINALS)} className={`flex flex-col items-center gap-1 ${activeTab === Tab.FINALS ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-500'}`}>
              <Trophy className="w-6 h-6" />
              <span className="text-[10px] font-medium">Finaller</span>
            </button>
          )}
          <button onClick={() => switchTab(Tab.STANDINGS)} className={`flex flex-col items-center gap-1 ${activeTab === Tab.STANDINGS ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Puan Durumu</span>
          </button>
          <button onClick={() => switchTab(Tab.SCHEDULE)} className={`flex flex-col items-center gap-1 ${activeTab === Tab.SCHEDULE ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
            <CalendarDays className="w-6 h-6" />
            <span className="text-[10px] font-medium">Fikstür</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 mb-20 md:mb-8 print:p-0 print:m-0 print:w-full print:max-w-none print:block">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:animate-none">
          {selectedPlayerId && selectedPlayer ? (
             <PlayerDetail 
                player={selectedPlayer} 
                data={leagueData} 
                onBack={handleBackFromDetail} 
                onPlayerClick={handlePlayerClick}
             />
          ) : (
             <>
               {activeTab === Tab.STANDINGS && (
                 <StandingsPanel
                   key={seasonId}
                   data={leagueData}
                   onPlayerClick={handlePlayerClick}
                 />
               )}
               {activeTab === Tab.SCHEDULE && (
                 <Schedule key={seasonId} data={leagueData} onPlayerClick={handlePlayerClick} />
               )}
               {activeTab === Tab.FINALS && leagueData.showFinals && (
                 <Finals key={seasonId} data={leagueData} onPlayerClick={handlePlayerClick} />
               )}
             </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;