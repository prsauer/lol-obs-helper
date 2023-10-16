import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { Button } from '../components/Button';
import { MatchDetails } from '../components/MatchDetails';

export function matchLoader({ params }: LoaderFunctionArgs) {
  return { matchId: params.matchId };
}

export const MatchInspectPage = () => {
  const { matchId } = useLoaderData() as ReturnType<typeof matchLoader>;
  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 flex flex-row gap-2 items-center">
        <Button linkTo="/">Back</Button>
      </div>
      {matchId !== undefined && <MatchDetails matchId={matchId} />}
    </div>
  );
};
