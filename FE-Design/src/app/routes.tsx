import { createBrowserRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { ClubView } from "./components/ClubView";
import { AdminPanel } from "./components/AdminPanel";
import { MovieSelection } from "./components/MovieSelection";
import { UserProfile } from "./components/UserProfile";
import { Settings } from "./components/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/club/:clubId",
    Component: ClubView,
  },
  {
    path: "/club/:clubId/admin",
    Component: AdminPanel,
  },
  {
    path: "/club/:clubId/select-movie",
    Component: MovieSelection,
  },
  {
    path: "/user/:userId",
    Component: UserProfile,
  },
  {
    path: "/settings",
    Component: Settings,
  },
]);
