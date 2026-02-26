import { motion, useScroll, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Sparkles, ArrowRight, FileText, Zap, Shield, Globe2,
    CheckCircle2, Star, ChevronDown, ChevronRight,
    Briefcase, Code, TrendingUp, Megaphone, DollarSign,
    Heart, GraduationCap, Palette, Scale, Users
} from "lucide-react";
import { useState } from "react";
import resumeImg from "../assets/Resume.png";
import "./Home.css";

const FIELDS = [
    { key: "tech", icon: <Code />, label: "Technology", color: "#3b82f6" },
    { key: "sales", icon: <TrendingUp />, label: "Sales", color: "#10b981" },
    { key: "marketing", icon: <Megaphone />, label: "Marketing", color: "#f59e0b" },
    { key: "finance", icon: <DollarSign />, label: "Finance", color: "#06b6d4" },
    { key: "healthcare", icon: <Heart />, label: "Healthcare", color: "#f43f5e" },
    { key: "education", icon: <GraduationCap />, label: "Education", color: "#8b5cf6" },
    { key: "design", icon: <Palette />, label: "Design", color: "#ec4899" },
    { key: "legal", icon: <Scale />, label: "Legal", color: "#64748b" },
    { key: "hr", icon: <Users />, label: "Human Resources", color: "#a855f7" },
    { key: "general", icon: <Briefcase />, label: "General", color: "#60a5fa" },
];

const FEATURES = [
    { icon: <FileText />, title: "LaTeX-Powered CVs", desc: "Professional, ATS-friendly resumes generated with LaTeX — the gold standard in document typesetting." },
    { icon: <Zap />, title: "AI Tailoring", desc: "Paste a job description and let AI optimize your resume to match the role perfectly." },
    { icon: <Globe2 />, title: "10 Professional Fields", desc: "From Tech to Healthcare, Sales to Legal — field-specific sections that matter to recruiters." },
    { icon: <Shield />, title: "ATS Optimized", desc: "Every resume passes automated screening systems with clean formatting and proper structure." },
];

const PRICING = [
    { tier: "Free", price: "₹0", credits: "4 Tailored CVs", features: ["Unlimited original CVs", "All 10 fields", "LaTeX output", "PDF download"], highlight: false },
    { tier: "Starter", price: "₹100", credits: "100 Tailored CVs", features: ["Everything in Free", "AI-powered tailoring", "Job description matching", "Priority generation"], highlight: true },
    { tier: "Pro", price: "₹250", credits: "500 Tailored CVs", features: ["Everything in Starter", "Bulk generation", "Advanced AI optimization", "Email support"], highlight: false },
];

const FAQS = [
    { q: "What format are the resumes generated in?", a: "All resumes are generated using LaTeX, compiled to PDF. LaTeX produces the highest quality, ATS-friendly documents used worldwide." },
    { q: "Which professional fields are supported?", a: "We support 10 fields: Technology, Sales, Marketing, Finance, Healthcare, Education, Design, Legal, HR, and General. Each field has customized sections relevant to that industry." },
    { q: "What is a 'Tailored CV'?", a: "A Tailored CV uses AI to optimize your resume for a specific job description. It reorders, rephrases, and highlights the most relevant experience and skills." },
    { q: "Can I use this for free?", a: "Yes! You get unlimited original CV generations and 4 free tailored CVs. No credit card required." },
    { q: "Is my data secure?", a: "Absolutely. We use Clerk for authentication and your data is stored securely in MongoDB. We never share your information." },
];

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 },
};

const Home = () => {
    const { scrollYProgress } = useScroll();
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="home">
            {/* Scroll Progress */}
            <motion.div
                className="home__progress"
                style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
            />

            {/* ========== HERO ========== */}
            <section className="hero">
                <div className="hero__glow" />
                <div className="hero__glow hero__glow--2" />
                <div className="container hero__content">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="hero__text"
                    >
                        <div className="badge" style={{ marginBottom: 16 }}>
                            <Sparkles size={12} /> Version 2.0 — Now Multi-Field
                        </div>
                        <h1 className="hero__title">
                            One Resume Builder.
                            <br />
                            <span className="text-gradient">Every Career.</span>
                        </h1>
                        <p className="hero__subtitle">
                            Build stunning, ATS-optimized LaTeX resumes for any professional field.
                            Tech, Sales, Marketing, Healthcare — we've got you covered.
                        </p>
                        <div className="hero__actions">
                            <Link to="/select-field" className="btn btn-primary btn-lg">
                                Build Your Resume <ArrowRight size={18} />
                            </Link>
                            <a href="#features" className="btn btn-ghost btn-lg">
                                Learn More <ChevronDown size={18} />
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        className="hero__visual"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <motion.img
                            src={resumeImg}
                            alt="Resume Preview"
                            className="hero__resume-img"
                            style={{ width: "100%", maxWidth: "400px", borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)", cursor: "grab" }}
                            drag
                            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ cursor: "grabbing", scale: 0.98 }}
                        />
                    </motion.div>
                </div>
            </section>

            {/* ========== FEATURES ========== */}
            <section id="features" className="section">
                <div className="container">
                    <motion.div className="section__header" {...fadeUp}>
                        <p className="section-title">Why NoMoreATS</p>
                        <h2 className="section-heading">Built for professionals who care about quality</h2>
                    </motion.div>
                    <div className="features__grid">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                className="card features__card"
                                {...fadeUp}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <div className="features__icon">{f.icon}</div>
                                <h3 className="features__title">{f.title}</h3>
                                <p className="features__desc">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FIELDS ========== */}
            <section id="fields" className="section">
                <div className="container">
                    <motion.div className="section__header" {...fadeUp}>
                        <p className="section-title">Professional Fields</p>
                        <h2 className="section-heading">Tailored for your industry</h2>
                        <p style={{ color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto" }}>
                            Each field gets customized resume sections that matter most to recruiters in that industry.
                        </p>
                    </motion.div>
                    <div className="fields__grid">
                        {FIELDS.map((f, i) => (
                            <motion.div
                                key={f.key}
                                className="card fields__card"
                                {...fadeUp}
                                transition={{ duration: 0.4, delay: i * 0.06 }}
                                whileHover={{ scale: 1.04 }}
                            >
                                <div className="fields__icon" style={{ color: f.color, background: `${f.color}15` }}>
                                    {f.icon}
                                </div>
                                <span className="fields__label">{f.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== PRICING ========== */}
            <section id="pricing" className="section">
                <div className="container">
                    <motion.div className="section__header" {...fadeUp}>
                        <p className="section-title">Simple Pricing</p>
                        <h2 className="section-heading">Start free, scale as you grow</h2>
                    </motion.div>
                    <div className="pricing__grid">
                        {PRICING.map((p, i) => (
                            <motion.div
                                key={i}
                                className={`card pricing__card ${p.highlight ? "pricing__card--featured" : ""}`}
                                {...fadeUp}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                {p.highlight && <div className="pricing__badge">Most Popular</div>}
                                <h3 className="pricing__tier">{p.tier}</h3>
                                <div className="pricing__price">{p.price}</div>
                                <p className="pricing__credits">{p.credits}</p>
                                <ul className="pricing__features">
                                    {p.features.map((feat, j) => (
                                        <li key={j}><CheckCircle2 size={14} /> {feat}</li>
                                    ))}
                                </ul>
                                <Link to="/sign-up" className={`btn ${p.highlight ? "btn-primary" : "btn-secondary"}`} style={{ width: "100%" }}>
                                    Get Started <ChevronRight size={14} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FAQ ========== */}
            <section id="faq" className="section">
                <div className="container" style={{ maxWidth: 700 }}>
                    <motion.div className="section__header" {...fadeUp}>
                        <p className="section-title">FAQ</p>
                        <h2 className="section-heading">Common questions</h2>
                    </motion.div>
                    <div className="faq__list">
                        {FAQS.map((faq, i) => (
                            <motion.div
                                key={i}
                                className={`faq__item ${openFaq === i ? "faq__item--open" : ""}`}
                                {...fadeUp}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                            >
                                <button className="faq__question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                    <span>{faq.q}</span>
                                    <ChevronDown size={18} className={`faq__chevron ${openFaq === i ? "faq__chevron--open" : ""}`} />
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            className="faq__answer"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <p>{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== CTA ========== */}
            <section className="cta">
                <div className="container">
                    <motion.div className="cta__content" {...fadeUp}>
                        <h2 className="section-heading" style={{ marginBottom: 12 }}>
                            Ready to build your resume?
                        </h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 16 }}>
                            Join thousands of professionals using LaTeX-powered resumes.
                        </p>
                        <Link to="/select-field" className="btn btn-primary btn-lg">
                            Get Started Free <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <footer className="footer">
                <p>Made with <span style={{ color: "#f43f5e" }}>♥</span> by NoMoreATS Team</p>
            </footer>
        </div>
    );
};

const AnimatePresence2 = ({ children }) => children;

export default Home;
