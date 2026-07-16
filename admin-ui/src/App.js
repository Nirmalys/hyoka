import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/ui/Navbar";
import TopBar from "./components/ui/TopBar";
import { EditorProvider, useEditor } from "./components/ui/pages/editor/EditorContext";
import { OnboardingProvider } from "./components/ui/onboarding/OnboardingContext";
import Home from "./components/ui/pages/Overview/components/Home";
import { ShimmerPageSkeleton } from "./components/ui/Shimmer";

const Review = lazy(() =>
  import(/* webpackChunkName: "review" */ "./components/ui/pages/Reviews/components/Review")
);
const Widgets = lazy(() =>
  import(/* webpackChunkName: "widgets" */ "./components/ui/pages/Widgets/components/Widgets")
);
const Replies = lazy(() =>
  import(/* webpackChunkName: "replies" */ "./components/ui/pages/Replies/components/Replies")
);
const Settings = lazy(() =>
  import(/* webpackChunkName: "settings" */ "./components/ui/pages/Settings/components/Settings")
);

const PageLoader = () => <ShimmerPageSkeleton />;

const RouteLayout = () => (
  <div className="flex flex-1 flex-col min-h-0 h-full overflow-hidden">
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </div>
);

const AppContent = () => {
  const { isEditorActive } = useEditor();

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[#F5F5F5]">
      {!isEditorActive && <TopBar />}
      <div className="flex flex-1 overflow-hidden">
        {!isEditorActive && <Navbar />}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-[#F5F5F5]">
          <Routes>
            <Route element={<RouteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/review" element={<Review />} />
              <Route path="/widgets" element={<Widgets />} />
              <Route path="/request" element={<Replies />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const theme = localStorage.getItem("HYOKA-theme") || "light";
    const root = document.querySelector(".HYOKA-root");
    if (theme === "dark") {
      root?.classList.add("dark");
    }
  }, []);

  return (
    <div className="app-container HYOKA-root">
      <HashRouter>
        <EditorProvider>
          <OnboardingProvider>
            <AppContent />
          </OnboardingProvider>
        </EditorProvider>
      </HashRouter>
    </div>
  );
};

export default App;
