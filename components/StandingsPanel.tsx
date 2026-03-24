import React, { useState, useEffect } from 'react';
import { LeagueData } from '../types';
import { getStandingsByGroup } from '../utils/mockData';
import Standings from './Standings';
import LeagueGroupTabs from './LeagueGroupTabs';

interface StandingsPanelProps {
  data: LeagueData;
  onPlayerClick: (playerId: string) => void;
}

const StandingsPanel: React.FC<StandingsPanelProps> = ({ data, onPlayerClick }) => {
  const [activeGroupId, setActiveGroupId] = useState(
    () => data.groups?.[0]?.id ?? 'all'
  );

  const groupStandings = getStandingsByGroup(data);
  const hasGroups = Boolean(data.groups?.length);

  useEffect(() => {
    if (!data.groups?.length) return;
    setActiveGroupId((prev) =>
      data.groups!.some((g) => g.id === prev) ? prev : data.groups![0].id
    );
  }, [data.groups]);

  if (!hasGroups) {
    const players = groupStandings[0]?.players ?? [];
    return (
      <Standings players={players} onPlayerClick={onPlayerClick} />
    );
  }

  const active =
    groupStandings.find((g) => g.groupId === activeGroupId) ?? groupStandings[0];

  return (
    <div className="space-y-3 sm:space-y-6">
      <LeagueGroupTabs
        groups={data.groups!}
        activeGroupId={activeGroupId}
        onGroupChange={setActiveGroupId}
      />
      <Standings
        players={active.players}
        onPlayerClick={onPlayerClick}
        playOffSpots={data.playOffSpots}
      />
    </div>
  );
};

export default StandingsPanel;
