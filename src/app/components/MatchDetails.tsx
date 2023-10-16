import React, { useState } from 'react';
import { useGameQuery, useGameTimelineQuery } from '../hooks/games';
import { ChampIcon } from './ChampIcon';
import {
  CartesianGrid,
  ComposedChart,
  Label,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Event } from '../proxy/types';

const calcParticipationType = (partIndex: number, evt: Event) => {
  if (evt.victimId === partIndex) return 'DEATH';
  if (evt.killerId === partIndex) return 'KILL';
  if (evt.assistingParticipantIds?.includes(partIndex)) return 'ASSIST';
};

const KDACircle = (props: { cx?: number; cy?: number; type?: string }) => {
  let color = props.type === 'KILL' ? '#00dd00' : '#FF0000';
  if (props.type === 'ASSIST') {
    color = '#FFaa00';
  }
  return <circle cy={props.cy} cx={props.cx} r={5} fill={color} />;
};

export const MatchDetails = ({ matchId }: { matchId: string }) => {
  const gameTimelineQuery = useGameTimelineQuery(matchId);
  const gameInfoQuery = useGameQuery(matchId);
  const [selectedChamp, setSelectedChamp] = useState(
    'JgZkBcOvHZE4wJlSHgx-vfPPvtPAGnkyf9zqV96plrqRSArudY2Wep2h5X9pTVRk75QCyYTk9N75jw',
  );

  const gameTimeline = gameTimelineQuery.data?.data;

  if (!gameTimeline) {
    return <div>loading</div>;
  }

  const partIndex = gameTimeline.info.participants.findIndex((p) => p.puuid === selectedChamp) + 1;

  const earlyGameFrames = gameTimeline.info.frames.slice(0, 25);

  const min10Frame = earlyGameFrames[10].participantFrames[partIndex];
  const min15Frame = earlyGameFrames[15].participantFrames[partIndex];

  const csAt10 = min10Frame.minionsKilled + min10Frame.jungleMinionsKilled;
  const csAt15 = min15Frame.minionsKilled + min15Frame.jungleMinionsKilled;

  const delta8Series = earlyGameFrames.map((f) => ({
    timestamp: Math.round(f.timestamp / 60000),
    minionsKilled: Math.round(
      f.participantFrames[partIndex as unknown as '4'].minionsKilled +
        f.participantFrames[partIndex as unknown as '4'].jungleMinionsKilled -
        8 * (f.timestamp / 60000),
    ),
  }));

  const champKills = earlyGameFrames
    .map((e) =>
      e.events.filter(
        (evt) =>
          evt.type === 'CHAMPION_KILL' &&
          (evt.victimId === partIndex ||
            evt.killerId === partIndex ||
            evt.assistingParticipantIds?.includes(partIndex)),
      ),
    )
    .flat()
    .map((evt) => ({
      type: calcParticipationType(partIndex, evt),
      value: 0,
      timestamp: evt.timestamp / 60000,
    }));

  const selectedInfo = gameInfoQuery.data?.data?.info.participants.find((p) => p.puuid === selectedChamp);

  const minsOfGame = (gameInfoQuery.data?.data?.info.gameDuration || 1) / 60;
  const selectedTotalCS = (selectedInfo?.neutralMinionsKilled || 0) + (selectedInfo?.totalMinionsKilled || 0);

  const selectedAvgCSm = selectedTotalCS / minsOfGame;

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-row gap-2 ">
        {gameInfoQuery.data?.data?.info.participants.map((p) => (
          <div
            key={p.puuid}
            className={'flex flex-col items-center ' + (selectedChamp === p.puuid ? 'border-green-100 border-2' : '')}
            onClick={() => {
              setSelectedChamp(p.puuid);
            }}
          >
            <ChampIcon size={32} championId={p.championId} />
            <div className={'text-sm ' + (p.teamId === 100 ? 'text-green-400' : 'text-red-400')}>{p.summonerName}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-2xl">{selectedInfo?.championName}</div>
        <div>
          {selectedInfo?.kills} / {selectedInfo?.deaths} / {selectedInfo?.assists}
        </div>
        <div>
          {selectedAvgCSm.toFixed(1)}cs/m {selectedTotalCS}cs {csAt10}cs@10 {csAt15}cs@15
        </div>
      </div>
      <div className="flex-1 max-h-[300px] pt-2 pb-8 bg-zinc-900">
        <div className="w-full text-center">Difference in cs from 8cs/min</div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
            <XAxis dataKey="timestamp" type="number" tickCount={15} height={30} domain={[0, 'dataMax + 1']}>
              <Label value="Game Time" offset={0} position="bottom" />
            </XAxis>
            <ZAxis dataKey={'type'} />
            <YAxis width={70}>
              <Label value="cs - 8cs/min" angle={-90} position="center" dx={-10} />
            </YAxis>
            <Tooltip
              labelFormatter={(s) => `Minute ${s}`}
              formatter={(data, label, datum) => {
                if (label === 'type') {
                  return datum.payload.type;
                }
                return `${data}`;
              }}
              contentStyle={{
                backgroundColor: '#121212',
                color: 'white',
              }}
            />
            <CartesianGrid stroke="#f5f5f5" />
            <Line name="CS - 8cs/min" data={delta8Series} type="monotone" dataKey="minionsKilled" stroke="#ffff00" />
            <Scatter
              name="type"
              data={champKills}
              type="monotone"
              dataKey="value"
              shape={<KDACircle />}
              fill="#8884d8"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
