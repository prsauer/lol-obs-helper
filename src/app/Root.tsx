import { RouterProvider, createHashRouter } from 'react-router-dom';
import { ReviewPage, reviewLoader, activityReviewLoader } from './pages/ReviewPage';
import { SetupPage } from './pages/SetupPage';
import { MatchInspectPage, matchLoader } from './pages/MatchInspectPage';
import { SourceConfig } from './pages/SourceConfig';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { Layout } from './components/Layout';

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ActivitiesPage />,
      },
      {
        path: 'vod/:id/:summonerName',
        element: <ReviewPage />,
        loader: reviewLoader,
      },
      {
        path: 'activities/league/:activityId',
        element: <ReviewPage />,
        loader: activityReviewLoader,
      },
      {
        path: 'setup',
        element: <SetupPage />,
      },
      {
        path: 'inspect/:matchId',
        element: <MatchInspectPage />,
        loader: matchLoader,
      },
      {
        path: 'source-config',
        element: <SourceConfig />,
      },
    ],
  },
]);

export const Root = () => {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 p-3 text-gray-100 overflow-hidden flex flex-col">
      <div className="h-full min-h-0">
        <RouterProvider router={router} />
      </div>
    </div>
  );
};
