import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { FileText, Sparkles, Plus, Briefcase, Eye, Edit3, X, Loader2, Download } from "lucide-react";
import LivePreview from "../components/LivePreview";
import "./MyResumes.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

const FIELD_LABELS = {
    tech: "Technology", sales: "Sales", marketing: "Marketing", finance: "Finance",
    healthcare: "Healthcare", education: "Education", design: "Design", legal: "Legal",
    hr: "Human Resources", general: "General",
};

const FIELD_COLORS = {
    tech: "#3b82f6", sales: "#10b981", marketing: "#f59e0b", finance: "#06b6d4",
    healthcare: "#f43f5e", education: "#8b5cf6", design: "#ec4899", legal: "#64748b",
    hr: "#a855f7", general: "#60a5fa",
};

const FIELD_SECTIONS_MAP = {
    tech: ["summary", "education", "experience", "projects", "skills", "certifications", "coursework"],
    sales: ["summary", "experience", "skills", "education", "awards", "certifications"],
    marketing: ["summary", "experience", "skills", "projects", "education", "certifications"],
    finance: ["summary", "education", "experience", "skills", "certifications", "awards"],
    healthcare: ["summary", "education", "experience", "publications", "skills", "certifications"],
    education: ["summary", "education", "experience", "publications", "skills", "coursework", "awards"],
    design: ["summary", "experience", "projects", "skills", "education", "awards"],
    legal: ["summary", "education", "experience", "skills", "publications", "awards", "certifications"],
    hr: ["summary", "experience", "skills", "education", "certifications", "awards"],
    general: ["summary", "education", "experience", "skills", "projects", "certifications", "volunteer", "languages", "awards"],
};

const MyResumes = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null); // full-screen preview
    const [downloading, setDownloading] = useState(null); // profile _id being downloaded

    const handleDownloadPDF = async (profile) => {
        setDownloading(profile._id);
        try {
            const res = await axios.post(`${API}/generate_resume`, {
                user_profile: profile
            });
            const pdfUrl = res.data.pdf_url;
            // Trigger browser download
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `${profile.name || 'resume'}_${profile.professional_field || 'general'}.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('PDF downloaded successfully! 🎉');
        } catch (e) {
            toast.error(e.response?.data?.detail || 'Failed to generate PDF');
        } finally {
            setDownloading(null);
        }
    };

    useEffect(() => {
        if (!user?.id) return;
        const fetchProfiles = async () => {
            try {
                const [profilesRes, limitsRes] = await Promise.all([
                    axios.get(`${API}/user_profiles/${user.id}`),
                    axios.get(`${API}/user_limits/${user.id}`),
                ]);
                setProfiles(profilesRes.data.profiles || []);
                setCredits(limitsRes.data.tailor_credits);
            } catch (e) {
                // No profiles yet
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, [user]);

    return (
        <div className="my-resumes">
            <div className="my-resumes__glow" />
            <div className="container">
                <motion.div
                    className="my-resumes__header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className="section-heading" style={{ marginBottom: 4 }}>My Resumes</h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
                            Your saved resume profiles — click to preview live.
                            {credits !== null && (
                                <span className="my-resumes__credits">
                                    <Sparkles size={12} /> {credits} AI credits left
                                </span>
                            )}
                        </p>
                    </div>
                    <Link to="/select-field" className="btn btn-primary">
                        <Plus size={16} /> New Resume
                    </Link>
                </motion.div>

                {loading ? (
                    <div className="my-resumes__loading">
                        <Loader2 size={24} className="spin" />
                        <span>Loading resumes...</span>
                    </div>
                ) : profiles.length === 0 ? (
                    <motion.div
                        className="my-resumes__empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <FileText size={56} />
                        <h3>No resumes yet</h3>
                        <p>Create your first professional resume in minutes.</p>
                        <Link to="/select-field" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>
                            <Sparkles size={16} /> Build Your Resume
                        </Link>
                    </motion.div>
                ) : (
                    <div className="my-resumes__grid">
                        {profiles.map((profile, i) => {
                            const field = profile.professional_field || "general";
                            const fieldColor = FIELD_COLORS[field] || "#60a5fa";
                            const sections = FIELD_SECTIONS_MAP[field] || FIELD_SECTIONS_MAP.general;
                            return (
                                <motion.div
                                    key={profile._id || i}
                                    className="card my-resumes__card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    {/* Field Badge + Name */}
                                    <div className="my-resumes__card-top">
                                        <div className="my-resumes__field-badge" style={{ color: fieldColor, background: `${fieldColor}15`, border: `1px solid ${fieldColor}30` }}>
                                            <Briefcase size={10} /> {FIELD_LABELS[field] || field}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                                        {profile.name || "Untitled Resume"}
                                    </h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                                        {profile.contact?.email || ""}
                                    </p>

                                    {/* Mini LivePreview thumbnail */}
                                    <div
                                        className="my-resumes__card-preview"
                                        onClick={() => setViewingProfile(profile)}
                                        style={{ cursor: "pointer", position: "relative", overflow: "hidden", height: 200, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}
                                    >
                                        <div style={{
                                            transform: "scale(0.28)",
                                            transformOrigin: "top left",
                                            width: "210mm",
                                            height: "297mm",
                                            pointerEvents: "none",
                                        }}>
                                            <LivePreview data={profile} activeSections={sections} />
                                        </div>
                                        <div style={{
                                            position: "absolute", inset: 0,
                                            background: "linear-gradient(transparent 60%, var(--bg-card) 100%)",
                                            display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 12,
                                        }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Eye size={12} /> Click to preview
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="my-resumes__card-actions" style={{ marginTop: 12 }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ flex: 1 }}
                                            onClick={() => setViewingProfile(profile)}
                                        >
                                            <Eye size={14} /> View CV
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => navigate(`/builder/${field}`)}
                                        >
                                            <Edit3 size={14} /> Edit
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Full-screen LivePreview Modal */}
            <AnimatePresence>
                {viewingProfile && (
                    <motion.div
                        className="my-resumes__modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewingProfile(null)}
                        style={{
                            position: "fixed", inset: 0, zIndex: 200,
                            background: "rgba(0,0,0,0.85)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: 24,
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: "#fff",
                                borderRadius: 12,
                                width: "100%",
                                maxWidth: 800,
                                maxHeight: "90vh",
                                overflow: "auto",
                                position: "relative",
                            }}
                        >
                            {/* Close + Edit buttons */}
                            <div style={{
                                position: "sticky", top: 0, zIndex: 10,
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "12px 16px",
                                background: "rgba(255,255,255,0.95)",
                                backdropFilter: "blur(10px)",
                                borderBottom: "1px solid #e2e8f0",
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                                        {viewingProfile.name || "Resume"} — {FIELD_LABELS[viewingProfile.professional_field] || "General"}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDownloadPDF(viewingProfile)}
                                        disabled={downloading === viewingProfile._id}
                                    >
                                        {downloading === viewingProfile._id ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
                                        {downloading === viewingProfile._id ? 'Generating...' : 'Download PDF'}
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => navigate(`/builder/${viewingProfile.professional_field || "general"}`)}
                                    >
                                        <Edit3 size={14} /> Edit Resume
                                    </button>
                                    <button
                                        onClick={() => setViewingProfile(null)}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "#64748b", display: "flex", padding: 6,
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Full LivePreview */}
                            <div style={{ padding: 24 }}>
                                <LivePreview
                                    data={viewingProfile}
                                    activeSections={FIELD_SECTIONS_MAP[viewingProfile.professional_field] || FIELD_SECTIONS_MAP.general}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyResumes;
