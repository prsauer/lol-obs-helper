import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { MatchDetails } from '../league/MatchDetails';

export function matchLoader({ params }: LoaderFunctionArgs) {
  return { matchId: params.matchId };
}

export const MatchInspectPage = () => {
  const { matchId } = useLoaderData() as ReturnType<typeof matchLoader>;
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 flex flex-row gap-2 items-center">
        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>
      {matchId !== undefined && <MatchDetails matchId={matchId} />}
    </div>
  );
};
