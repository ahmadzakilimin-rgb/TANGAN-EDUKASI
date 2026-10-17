import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import SiteLayout, { PageHeading } from "./components/SiteLayout.jsx";
import {
  AboutPage,
  CollaborationPage,
  HomePage,
  ImpactPage,
  PortfolioPage,
  ProgramsPage,
} from "./pages.jsx";
import CleanLogPage from "./CleanLogPage.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <section className="container inner-page-content not-found">
      <PageHeading
        label="404 · PAGE NOT FOUND"
        title={<>This page is<br /><span>off the map.</span></>}
        description="We couldn't find that page, but you can find your way back home."
        icon={Compass}
        note="LET'S FIND YOUR WAY"
      />
      <Link to="/" className="button button-dark">Return home</Link>
    </section>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="impact" element={<Navigate to="/programs/impact" replace />} />
          <Route path="dampakbumi" element={<Navigate to="/programs/impact" replace />} />
          <Route path="programs/impact" element={<ImpactPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="collaboration" element={<CollaborationPage />} />
          <Route path="clean-log" element={<CleanLogPage />} />
          <Route path="team" element={<Navigate to="/about" replace />} />
          <Route path="contact" element={<Navigate to="/collaboration" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
