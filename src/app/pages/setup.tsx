import { Link } from "react-router-dom";
import { useAppConfig } from "../hooks/AppConfigContext";

export const SetupPage = () => {
  const config = useAppConfig();
  return (
    <div className="m-3 text-gray-100">
      <div>Setup</div>
      <div>obs conn string: {config.appConfig.obsWSURL}</div>
      <div>obs conn pw: {config.appConfig.obsWSPassword}</div>
      <div>riot dir: {config.appConfig.riotLogsPath}</div>
      <div>vods dir: {config.appConfig.vodStoragePath}</div>
      <Link to="/">Go Back</Link>
    </div>
  );
};
