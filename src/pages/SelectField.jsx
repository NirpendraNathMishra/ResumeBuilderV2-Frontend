import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Code, TrendingUp, Megaphone, DollarSign, Heart,
    GraduationCap, Palette, Scale, Users, Briefcase, ArrowRight, Lock
} from "lucide-react";
import "./SelectField.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

const FIELDS = [
    { key: "tech", icon: <Code size={28} />, label: "Technology", desc: "Software, DevOps, Data Science, AI/ML", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f620, #1d4ed820)" },
    { key: "sales", icon: <TrendingUp size={28} />, label: "Sales", desc: "B2B, B2C, Account Management, BDR", color: "#10b981", gradient: "linear-gradient(135deg, #10b98120, #05966920)" },
    { key: "marketing", icon: <Megaphone size={28} />, label: "Marketing", desc: "Digital, Content, SEO, Brand Strategy", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b20, #d9770620)" },
    { key: "finance", icon: <DollarSign size={28} />, label: "Finance", desc: "Banking, Accounting, Investment, Audit", color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d420, #08818920)" },
    { key: "healthcare", icon: <Heart size={28} />, label: "Healthcare", desc: "Doctor, Nurse, Pharma, Research", color: "#f43f5e", gradient: "linear-gradient(135deg, #f43f5e20, #be123c20)" },
    { key: "education", icon: <GraduationCap size={28} />, label: "Education", desc: "Teacher, Professor, Researcher", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf620, #6d28d920)" },
    { key: "design", icon: <Palette size={28} />, label: "Design", desc: "UI/UX, Graphic, Product, Motion", color: "#ec4899", gradient: "linear-gradient(135deg, #ec489920, #be185d20)" },
    { key: "legal", icon: <Scale size={28} />, label: "Legal", desc: "Lawyer, Paralegal, Compliance", color: "#64748b", gradient: "linear-gradient(135deg, #64748b20, #47556920)" },
    { key: "hr", icon: <Users size={28} />, label: "Human Resources", desc: "Recruitment, L&D, People Ops", color: "#a855f7", gradient: "linear-gradient(135deg, #a855f720, #7c3aed20)" },
    { key: "general", icon: <Briefcase size={28} />, label: "General", desc: "Any profession, all-purpose resume", color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa20, #3b82f620)" },
];

const SelectField = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [usedFields, setUsedFields] = useState([]);
    const [fieldLimit, setFieldLimit] = useState(2);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLimits = async () => {
            if (!user) return;
            try {
                const res = await axios.get(`${API}/user_limits/${user.id}`);
                setUsedFields(res.data.used_fields || []);
                setFieldLimit(res.data.field_limit || 2);
            } catch (e) {
                console.error("Failed to fetch user limits:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLimits();
    }, [user]);

    const isFieldLocked = (fieldKey) => {
        if (usedFields.includes(fieldKey)) return false; // Already using this field
        if (usedFields.length < fieldLimit) return false; // Under limit
        return true; // Field is locked
    };

    const handleFieldClick = (fieldKey) => {
        if (isFieldLocked(fieldKey)) {
            toast.error(`Free plan allows only ${fieldLimit} field types. Upgrade to Pro for unlimited fields!`);
            return;
        }
        navigate(`/builder/${fieldKey}`);
    };

    return (
        <div className="select-field">
            <div className="select-field__glow" />
            <div className="container">
                <motion.div
                    className="select-field__header"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="section-title">Step 1 of 2</p>
                    <h1 className="section-heading">Choose your professional field</h1>
                    <p className="select-field__subtitle">
                        This determines which resume sections and skill categories appear in your builder.
                    </p>
                    {!loading && usedFields.length > 0 && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                            Free plan: <strong style={{ color: 'var(--accent-blue-light)' }}>{usedFields.length}/{fieldLimit}</strong> field types used
                            {usedFields.length > 0 && (
                                <span> — {usedFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(", ")}</span>
                            )}
                        </p>
                    )}
                </motion.div>

                <div className="select-field__grid">
                    {FIELDS.map((field, i) => {
                        const locked = isFieldLocked(field.key);
                        const active = usedFields.includes(field.key);
                        return (
                            <motion.button
                                key={field.key}
                                className={`select-field__card ${locked ? 'select-field__card--locked' : ''} ${active ? 'select-field__card--active' : ''}`}
                                onClick={() => handleFieldClick(field.key)}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                whileHover={!locked ? { scale: 1.03, y: -4 } : {}}
                                whileTap={!locked ? { scale: 0.98 } : {}}
                                style={{
                                    "--field-color": locked ? "#475569" : field.color,
                                    "--field-bg": locked ? "linear-gradient(135deg, #47556910, #1e293b10)" : field.gradient,
                                    opacity: locked ? 0.5 : 1,
                                    cursor: locked ? "not-allowed" : "pointer",
                                }}
                            >
                                <div className="select-field__card-icon" style={{ color: locked ? "#475569" : field.color, background: `${locked ? "#475569" : field.color}15` }}>
                                    {locked ? <Lock size={28} /> : field.icon}
                                </div>
                                <div className="select-field__card-info">
                                    <h3>{field.label}</h3>
                                    <p>{locked ? "Upgrade to Pro to unlock" : field.desc}</p>
                                </div>
                                {active && <span className="badge" style={{ background: `${field.color}20`, color: field.color, border: `1px solid ${field.color}30` }}>Active</span>}
                                {!locked && !active && <ArrowRight size={18} className="select-field__card-arrow" />}
                                {locked && <Lock size={16} style={{ color: '#475569', marginLeft: 'auto' }} />}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SelectField;
