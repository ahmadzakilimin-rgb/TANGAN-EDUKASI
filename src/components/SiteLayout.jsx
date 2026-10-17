import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { contactWhatsapp, getNextPage, navigation, images } from "../data.js";

const MotionLink = motion(Link);

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem("tangan-edukasi-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch (error) {
    console.error("Preferensi tema gagal dibaca:", error);
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);
  const location = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem("tangan-edukasi-theme", theme);
    } catch (error) {
      console.error("Preferensi tema gagal disimpan:", error);
    }
  }, [theme]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function closeMenuOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeMenuOnEscape);
    return () => window.removeEventListener("keydown", closeMenuOnEscape);
  }, [menuOpen]);

  return (
    <div className={`site-shell ${location.pathname === "/" ? "home-page" : "inner-page"}`}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-screen"
            role="status"
            aria-label="Memuat Tangan Edukasi Indonesia"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img src={images.smallLogo} alt="" />
            <span className="loading-indicator" aria-hidden="true" />
            <p>MENYIAPKAN RUANG UNTUK BERGERAK</p>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Tangan Edukasi Indonesia, beranda">
            <span className="brand-symbol">
              <img src={images.smallLogo} alt="Logo Tangan Edukasi Indonesia" />
            </span>
          </Link>

          <nav id="main-navigation" className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navigasi utama">
            {navigation.map(({ label, to }) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={() => setMenuOpen(false)}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <a className="header-cta" href={contactWhatsapp} target="_blank" rel="noopener noreferrer">
              Let&apos;s Collaborate <ArrowUpRight size={14} strokeWidth={1.7} aria-hidden="true" />
            </a>
          </div>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <div className="theme-control">
        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          aria-pressed={theme === "dark"}
          onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </button>
        <span className="theme-label" aria-hidden="true">{theme === "dark" ? "Terang" : "Gelap"}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="page-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <footer className="site-footer">
        <div className="footer-inner">
          <Link className="footer-wordmark" to="/">
            TANGAN EDUKASI INDONESIA
            <span>Multi-Sector Collaborative Platform for Public Impact.</span>
          </Link>
          <nav className="footer-links" aria-label="Navigasi footer">
            {navigation.slice(1).map(({ label, to }) => <Link key={to} to={to}>{label}</Link>)}
          </nav>
          <span className="footer-copyright">© 2026 TANGAN EDUKASI INDONESIA</span>
        </div>
      </footer>
    </div>
  );
}

export function Eyebrow({ children, number }) {
  return (
    <div className="section-eyebrow">
      {number && <span className="eyebrow-number">{number}</span>}
      <span className="eyebrow-rule" />
      <span>{children}</span>
    </div>
  );
}

export function PageHeading({ label, title, description, number, icon: Icon, note }) {
  const { pathname } = useLocation();
  const nextPage = getNextPage(pathname);

  return (
    <header className="page-heading">
      <div className="page-heading-copy">
        <Eyebrow number={number}>{label}</Eyebrow>
        <h1>{title}</h1>
        {note && (
          <span className="page-heading-note">
            <span className="page-heading-note-dot" aria-hidden="true" />
            {note}
          </span>
        )}
        {description && <p>{description}</p>}
      </div>
      {Icon && (
        <span className="page-heading-art-space">
          <MotionLink
            className="page-heading-art"
            to={nextPage.to}
            aria-label={`Lanjut ke halaman ${nextPage.label}`}
            title={`Lanjut ke ${nextPage.label}`}
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.96, rotate: 360 }}
          >
            <Icon size={27} strokeWidth={1.5} aria-hidden="true" />
          </MotionLink>
        </span>
      )}
    </header>
  );
}

export function TextLink({ to, children }) {
  return <Link className="text-link" to={to}>{children}<ArrowRight size={15} aria-hidden="true" /></Link>;
}

export function Reveal({ children, className = "", ...props }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
