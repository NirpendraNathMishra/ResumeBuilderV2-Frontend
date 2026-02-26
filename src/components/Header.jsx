import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, FileText, Sparkles, ChevronRight } from "lucide-react";
import "./Header.css";

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isSignedIn } = useUser();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => setMobileOpen(false), [location]);

    const isHome = location.pathname === "/";

    return (
        <header className={`header ${scrolled ? "header--scrolled" : ""}`}>
            <div className="header__inner">
                {/* Logo */}
                <Link to="/" className="header__logo">
                    <img src="/logo.svg" alt="NoMoreATS" style={{ width: 30, height: 30, borderRadius: 6 }} />
                    <span className="header__logo-text">
                        NoMore<span className="header__logo-v2">ATS</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="header__nav">
                    {isHome && (
                        <>
                            <a href="#features" className="header__link">Features</a>
                            <a href="#fields" className="header__link">Fields</a>
                            <a href="#pricing" className="header__link">Pricing</a>
                            <a href="#faq" className="header__link">FAQ</a>
                        </>
                    )}
                    <SignedIn>
                        <Link to="/select-field" className="header__link">
                            <Sparkles size={14} /> New Resume
                        </Link>
                        <Link to="/my-resumes" className="header__link">My Resumes</Link>
                    </SignedIn>
                </nav>

                {/* Right section */}
                <div className="header__right">
                    <SignedOut>
                        <Link to="/sign-in" className="btn btn-ghost btn-sm">Sign In</Link>
                        <Link to="/sign-up" className="btn btn-primary btn-sm">
                            Get Started <ChevronRight size={14} />
                        </Link>
                    </SignedOut>
                    <SignedIn>
                        <Link to="/select-field" className="btn btn-primary btn-sm header__cta-btn">
                            <Sparkles size={14} /> Build Resume
                        </Link>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: { width: 34, height: 34 },
                                },
                            }}
                        />
                    </SignedIn>

                    {/* Mobile toggle */}
                    <button
                        className="header__mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="header__mobile-menu glass"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        {isHome && (
                            <>
                                <a href="#features" className="header__mobile-link">Features</a>
                                <a href="#fields" className="header__mobile-link">Fields</a>
                                <a href="#pricing" className="header__mobile-link">Pricing</a>
                                <a href="#faq" className="header__mobile-link">FAQ</a>
                            </>
                        )}
                        <SignedIn>
                            <Link to="/select-field" className="header__mobile-link">✨ New Resume</Link>
                            <Link to="/my-resumes" className="header__mobile-link">My Resumes</Link>
                        </SignedIn>
                        <SignedOut>
                            <Link to="/sign-in" className="header__mobile-link">Sign In</Link>
                            <Link to="/sign-up" className="header__mobile-link">Get Started</Link>
                        </SignedOut>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
