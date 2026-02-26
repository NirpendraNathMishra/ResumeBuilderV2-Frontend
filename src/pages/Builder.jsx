import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Save, Download, Wand2, Loader2, Plus, Trash2, ChevronDown, ChevronUp,
    User, Phone, Mail, Linkedin, Github, Globe, MapPin, Twitter,
    GraduationCap, Briefcase, FolderKanban, Award, BookOpen, Languages, Heart, FileText, Eye
} from "lucide-react";
import "./Builder.css";
import LivePreview from "../components/LivePreview";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

// Field metadata (mirrors backend)
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

const SKILL_SUGGESTIONS = {
    tech: ["Programming Languages", "Frameworks & Libraries", "Databases", "Cloud & DevOps", "Tools"],
    sales: ["CRM Tools", "Sales Methodologies", "Negotiation", "Lead Generation", "Industry Knowledge"],
    marketing: ["Digital Marketing", "Analytics Tools", "Content Strategy", "Social Media", "SEO/SEM"],
    finance: ["Financial Analysis", "Accounting Software", "Risk Management", "Compliance", "Excel & Modeling"],
    healthcare: ["Clinical Skills", "Patient Care", "Medical Software", "Research Methods", "Compliance"],
    education: ["Teaching Methods", "Curriculum Design", "Ed-Tech Tools", "Assessment", "Research"],
    design: ["Design Tools", "UI/UX", "Typography", "Branding", "Motion Graphics"],
    legal: ["Practice Areas", "Legal Research", "Case Management", "Compliance", "Bar Admissions"],
    hr: ["HRIS Systems", "Recruitment", "Employee Relations", "Compensation & Benefits", "Training"],
    general: ["Technical Skills", "Soft Skills", "Tools & Software", "Languages"],
};

const FIELD_LABELS = {
    tech: "Technology", sales: "Sales", marketing: "Marketing", finance: "Finance",
    healthcare: "Healthcare", education: "Education", design: "Design", legal: "Legal",
    hr: "Human Resources", general: "General",
};

const emptyExperience = () => ({ company: "", role: "", start_date: "", end_date: "", location: "", description: [""] });
const emptyEducation = () => ({ institution: "", location: "", degree: "", gpa: "", graduation_date: "" });
const emptyProject = () => ({ name: "", demo_link: "", technologies: "", description: [""] });
const emptyPublication = () => ({ title: "", publisher: "", date: "", summary: "" });
const emptyAward = () => ({ title: "", awarder: "", date: "", summary: "" });
const emptyVolunteer = () => ({ organization: "", role: "", start_date: "", end_date: "", description: [""] });

// Reusable Input Component -> moved outside to prevent focus loss (React unmount issue)
const Input = ({ label, value, onChange, placeholder, type = "text", icon }) => (
    <div className="input-group">
        <label>{icon && <span style={{ marginRight: 4 }}>{icon}</span>}{label}</label>
        <input className="input-field" type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
);

// Collapsible Section Header -> moved outside to prevent unnecessary remounts
const SectionHeader = ({ id, icon, title, count, collapsed, toggleCollapse, setSections }) => (
    <div className="builder__section-header" style={{ padding: "8px 16px" }}>
        <button onClick={() => toggleCollapse(id)} style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
            <div className="builder__section-header-left" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {icon}
                <span>{title}</span>
                {count > 0 && <span className="badge">{count}</span>}
            </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {id !== 'personal' && (
                <button onClick={(e) => { e.stopPropagation(); setSections(s => s.filter(sec => sec !== id)); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }} title="Remove Section">
                    <Trash2 size={14} />
                </button>
            )}
            <button onClick={() => toggleCollapse(id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                {collapsed[id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
        </div>
    </div>
);

const Builder = () => {
    const { fieldName = "general" } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();
    const field = FIELD_SECTIONS_MAP[fieldName] ? fieldName : "general";
    const [sections, setSections] = useState(FIELD_SECTIONS_MAP[field]);
    const suggestions = SKILL_SUGGESTIONS[field];

    const [formData, setFormData] = useState({
        clerk_user_id: "",
        name: "",
        professional_field: field,
        professional_summary: "",
        contact: { phone: "", location: "", email: "", linkedin: "", github: "", portfolio: "", website: "", twitter: "" },
        education: [emptyEducation()],
        experience: [emptyExperience()],
        projects: [emptyProject()],
        skills: suggestions.map(s => ({ category_name: s, skills: [""] })),
        certifications: [""],
        publications: [emptyPublication()],
        awards: [emptyAward()],
        volunteer: [emptyVolunteer()],
        languages: [""],
        coursework: { major_coursework: [""], minor_coursework: [""] },
    });
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [tailorMode, setTailorMode] = useState(false);
    const [jobDesc, setJobDesc] = useState("");
    const [collapsed, setCollapsed] = useState({});
    const [tailorCredits, setTailorCredits] = useState(null); // null = loading

    // Load saved data — per field
    useEffect(() => {
        if (!user?.id) return;
        setFormData(d => ({ ...d, clerk_user_id: user.id, contact: { ...d.contact, email: user.primaryEmailAddress?.emailAddress || "" } }));

        const loadProfile = async () => {
            try {
                // Fetch field-specific profile (tech, sales, etc.)
                const res = await axios.get(`${API}/get_user_profile/${user.id}/${field}`);
                if (res.data && res.data.name) {
                    setFormData(prev => ({ ...prev, ...res.data, professional_field: field }));
                }
            } catch (e) {
                // New user or no profile for this field yet — show blank form
            }
        };

        const loadCredits = async () => {
            try {
                const res = await axios.get(`${API}/user_limits/${user.id}`);
                setTailorCredits(res.data.tailor_credits);
            } catch (e) {
                setTailorCredits(0);
            }
        };

        loadProfile();
        loadCredits();
    }, [user, field]);

    const toggleCollapse = (section) => setCollapsed(c => ({ ...c, [section]: !c[section] }));

    // Generic updaters
    const updateField = (key, value) => setFormData(d => ({ ...d, [key]: value }));
    const updateContact = (key, value) => setFormData(d => ({ ...d, contact: { ...d.contact, [key]: value } }));

    const updateArrayItem = (arrKey, index, field, value) => {
        setFormData(d => {
            const arr = [...(d[arrKey] || [])];
            arr[index] = { ...arr[index], [field]: value };
            return { ...d, [arrKey]: arr };
        });
    };

    const addArrayItem = (arrKey, factory) => {
        setFormData(d => ({ ...d, [arrKey]: [...(d[arrKey] || []), factory()] }));
    };

    const removeArrayItem = (arrKey, index) => {
        setFormData(d => ({
            ...d,
            [arrKey]: (d[arrKey] || []).filter((_, i) => i !== index),
        }));
    };

    const updateDescriptionItem = (arrKey, arrIndex, descIndex, value) => {
        setFormData(d => {
            const arr = [...(d[arrKey] || [])];
            const desc = [...(arr[arrIndex].description || [])];
            desc[descIndex] = value;
            arr[arrIndex] = { ...arr[arrIndex], description: desc };
            return { ...d, [arrKey]: arr };
        });
    };

    const addDescriptionItem = (arrKey, arrIndex) => {
        setFormData(d => {
            const arr = [...(d[arrKey] || [])];
            arr[arrIndex] = { ...arr[arrIndex], description: [...(arr[arrIndex].description || []), ""] };
            return { ...d, [arrKey]: arr };
        });
    };

    const removeDescriptionItem = (arrKey, arrIndex, descIndex) => {
        setFormData(d => {
            const arr = [...(d[arrKey] || [])];
            arr[arrIndex] = { ...arr[arrIndex], description: arr[arrIndex].description.filter((_, i) => i !== descIndex) };
            return { ...d, [arrKey]: arr };
        });
    };

    // Skills handlers
    const updateSkillCategory = (catIndex, skillIndex, value) => {
        setFormData(d => {
            const skills = [...d.skills];
            const cat = { ...skills[catIndex], skills: [...skills[catIndex].skills] };
            cat.skills[skillIndex] = value;
            skills[catIndex] = cat;
            return { ...d, skills };
        });
    };

    const addSkill = (catIndex) => {
        setFormData(d => {
            const skills = [...d.skills];
            skills[catIndex] = { ...skills[catIndex], skills: [...skills[catIndex].skills, ""] };
            return { ...d, skills };
        });
    };

    const removeSkill = (catIndex, skillIndex) => {
        setFormData(d => {
            const skills = [...d.skills];
            skills[catIndex] = { ...skills[catIndex], skills: skills[catIndex].skills.filter((_, i) => i !== skillIndex) };
            return { ...d, skills };
        });
    };

    const addSkillCategory = () => {
        setFormData(d => ({
            ...d,
            skills: [...d.skills, { category_name: "", skills: [""] }],
        }));
    };

    // Simple list handlers (certifications, languages)
    const updateListItem = (key, index, value) => {
        setFormData(d => {
            const arr = [...(d[key] || [])];
            arr[index] = value;
            return { ...d, [key]: arr };
        });
    };
    const addListItem = (key) => setFormData(d => ({ ...d, [key]: [...(d[key] || []), ""] }));
    const removeListItem = (key, index) => setFormData(d => ({ ...d, [key]: (d[key] || []).filter((_, i) => i !== index) }));

    // Coursework handlers
    const updateCoursework = (type, index, value) => {
        setFormData(d => {
            const cw = { ...d.coursework };
            const arr = [...(cw[type] || [])];
            arr[index] = value;
            cw[type] = arr;
            return { ...d, coursework: cw };
        });
    };
    const addCoursework = (type) => setFormData(d => ({ ...d, coursework: { ...d.coursework, [type]: [...(d.coursework[type] || []), ""] } }));
    const removeCoursework = (type, index) => setFormData(d => ({ ...d, coursework: { ...d.coursework, [type]: d.coursework[type].filter((_, i) => i !== index) } }));

    // Generate resume
    const handleGenerate = async () => {
        if (!formData.name.trim()) return toast.error("Please enter your name");
        setGenerating(true);
        try {
            const res = await axios.post(`${API}/generate_resume`, { user_profile: formData });
            setPdfUrl(res.data.pdf_url);
            toast.success("Resume generated successfully! 🎉");
        } catch (e) {
            toast.error(e.response?.data?.detail || "Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    // Tailor resume
    const handleTailor = async () => {
        if (!jobDesc.trim()) return toast.error("Please paste a job description");
        setGenerating(true);
        try {
            const res = await axios.post(`${API}/generate_tailored_cv`, { clerk_user_id: formData.clerk_user_id, job_description: jobDesc });
            setPdfUrl(res.data.pdf_url);
            setTailorCredits(res.data.remaining_credits);
            toast.success(`Tailored CV ready! Credits left: ${res.data.remaining_credits}`);
            setTailorMode(false);
        } catch (e) {
            toast.error(e.response?.data?.detail || "Tailoring failed");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="builder">
            {/* Top Bar */}
            <div className="builder__topbar glass" style={{ top: 0, borderTop: 'none' }}>
                <div className="builder__topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
                        <img src="/logo.svg" alt="NoMoreATS" style={{ width: 30, height: 30, borderRadius: 6 }} />
                        <span style={{ letterSpacing: '-0.02em' }}>
                            NoMore<span style={{ color: 'var(--accent-blue)', fontSize: 11, fontWeight: 800, marginLeft: 2, verticalAlign: 'super' }}>ATS</span>
                        </span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-primary)', paddingLeft: '24px' }}>
                        <span className="badge" style={{ fontSize: 12 }}>{FIELD_LABELS[field]}</span>
                        <span className="builder__topbar-name">{formData.name || "Untitled Resume"}</span>
                    </div>
                </div>
                <div className="builder__topbar-actions">
                    {!tailorMode ? (
                        <>
                            <button className="btn btn-ghost btn-sm" onClick={() => setTailorMode(true)} disabled={tailorCredits !== null && tailorCredits <= 0}>
                                <Wand2 size={14} /> Tailor with AI
                                {tailorCredits !== null && (
                                    <span className="badge" style={{ marginLeft: 4, fontSize: 10, padding: '2px 6px' }}>
                                        {tailorCredits} credits
                                    </span>
                                )}
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
                                {generating ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                                Generate CV
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-ghost btn-sm" onClick={() => setTailorMode(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleTailor} disabled={generating}>
                                {generating ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                                Generate Tailored CV
                            </button>
                        </>
                    )}
                    <div style={{ width: 1, height: 24, background: 'var(--border-primary)', margin: '0 8px' }} />
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button className={`btn btn-sm ${!pdfUrl ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPdfUrl(null)}>
                            <Eye size={14} /> Live Preview
                        </button>
                        {pdfUrl && (
                            <button className="btn btn-sm btn-primary">
                                <FileText size={14} /> PDF Output
                            </button>
                        )}
                    </div>
                    {pdfUrl && (
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-icon" style={{ padding: "6px", marginRight: "8px" }} title="Download PDF">
                            <Download size={14} />
                        </a>
                    )}
                    <div style={{ width: 1, height: 24, background: 'var(--border-primary)', margin: '0 8px 0 0' }} />
                    <Link to="/my-resumes" className="btn btn-ghost btn-sm" style={{ marginRight: 8 }}>My Resumes</Link>
                    <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
                </div>
            </div>

            <div className="builder__layout">
                {/* ====== LEFT: FORM ====== */}
                <div className="builder__form">
                    {tailorMode && (
                        <motion.div className="builder__tailor-box" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <h3><Wand2 size={16} /> AI Resume Tailoring</h3>
                            <p>Paste the job description below. AI will optimize your resume to match.</p>
                            <textarea
                                className="input-field"
                                value={jobDesc}
                                onChange={e => setJobDesc(e.target.value)}
                                placeholder="Paste job description here..."
                                rows={6}
                            />
                        </motion.div>
                    )}

                    {/* Personal Info — always visible */}
                    <div className="builder__section">
                        <SectionHeader id="personal" icon={<User size={16} />} title="Personal Information" collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                        {!collapsed.personal && (
                            <motion.div className="builder__section-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="builder__grid-2">
                                    <Input label="Full Name" value={formData.name} onChange={v => updateField("name", v)} placeholder="John Doe" />
                                    <Input label="Email" value={formData.contact.email} onChange={v => updateContact("email", v)} placeholder="john@example.com" type="email" />
                                    <Input label="Phone" value={formData.contact.phone} onChange={v => updateContact("phone", v)} placeholder="+91 9876543210" />
                                    <Input label="Location" value={formData.contact.location} onChange={v => updateContact("location", v)} placeholder="Mumbai, India" />
                                    <Input label="LinkedIn" value={formData.contact.linkedin} onChange={v => updateContact("linkedin", v)} placeholder="https://linkedin.com/in/..." />
                                    {(field === "tech" || field === "general") && (
                                        <Input label="GitHub" value={formData.contact.github} onChange={v => updateContact("github", v)} placeholder="https://github.com/..." />
                                    )}
                                    {(field === "tech" || field === "design" || field === "general") && (
                                        <Input label="Portfolio" value={formData.contact.portfolio} onChange={v => updateContact("portfolio", v)} placeholder="https://portfolio.com" />
                                    )}
                                    {(field === "marketing") && (
                                        <Input label="Twitter / X" value={formData.contact.twitter} onChange={v => updateContact("twitter", v)} placeholder="https://x.com/..." />
                                    )}
                                    {(!["tech", "design", "marketing"].includes(field)) && (
                                        <Input label="Website" value={formData.contact.website} onChange={v => updateContact("website", v)} placeholder="https://..." />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Professional Summary */}
                    {sections.includes("summary") && (
                        <div className="builder__section">
                            <SectionHeader id="summary" icon={<FileText size={16} />} title="Professional Summary" collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.summary && (
                                <div className="builder__section-body">
                                    <textarea
                                        className="input-field"
                                        value={formData.professional_summary || ""}
                                        onChange={e => updateField("professional_summary", e.target.value)}
                                        placeholder="A brief 2-3 line summary of your professional background and goals..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Education */}
                    {sections.includes("education") && (
                        <div className="builder__section">
                            <SectionHeader id="education" icon={<GraduationCap size={16} />} title="Education" count={formData.education.length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.education && (
                                <div className="builder__section-body">
                                    {formData.education.map((edu, i) => (
                                        <div key={i} className="builder__entry">
                                            <div className="builder__entry-header">
                                                <span className="builder__entry-num">#{i + 1}</span>
                                                {formData.education.length > 1 && (
                                                    <button className="builder__remove-btn" onClick={() => removeArrayItem("education", i)}><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                            <div className="builder__grid-2">
                                                <Input label="Institution" value={edu.institution} onChange={v => updateArrayItem("education", i, "institution", v)} placeholder="MIT" />
                                                <Input label="Location" value={edu.location} onChange={v => updateArrayItem("education", i, "location", v)} placeholder="Cambridge, MA" />
                                                <Input label="Degree" value={edu.degree} onChange={v => updateArrayItem("education", i, "degree", v)} placeholder="B.Tech in Computer Science" />
                                                <Input label="Graduation Date" value={edu.graduation_date} onChange={v => updateArrayItem("education", i, "graduation_date", v)} placeholder="May 2024" />
                                                <Input label="GPA (optional)" value={edu.gpa} onChange={v => updateArrayItem("education", i, "gpa", v)} placeholder="3.8/4.0" />
                                            </div>
                                        </div>
                                    ))}
                                    <button className="builder__add-btn" onClick={() => addArrayItem("education", emptyEducation)}>
                                        <Plus size={14} /> Add Education
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Experience */}
                    {sections.includes("experience") && (
                        <div className="builder__section">
                            <SectionHeader id="experience" icon={<Briefcase size={16} />} title="Work Experience" count={formData.experience.length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.experience && (
                                <div className="builder__section-body">
                                    {formData.experience.map((exp, i) => (
                                        <div key={i} className="builder__entry">
                                            <div className="builder__entry-header">
                                                <span className="builder__entry-num">#{i + 1}</span>
                                                {formData.experience.length > 1 && (
                                                    <button className="builder__remove-btn" onClick={() => removeArrayItem("experience", i)}><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                            <div className="builder__grid-2">
                                                <Input label="Company" value={exp.company} onChange={v => updateArrayItem("experience", i, "company", v)} placeholder="Google" />
                                                <Input label="Role" value={exp.role} onChange={v => updateArrayItem("experience", i, "role", v)} placeholder="Software Engineer" />
                                                <Input label="Start Date" value={exp.start_date} onChange={v => updateArrayItem("experience", i, "start_date", v)} placeholder="Jun 2022" />
                                                <Input label="End Date" value={exp.end_date} onChange={v => updateArrayItem("experience", i, "end_date", v)} placeholder="Present" />
                                                <Input label="Location" value={exp.location} onChange={v => updateArrayItem("experience", i, "location", v)} placeholder="Bangalore, India" />
                                            </div>
                                            <div style={{ marginTop: 10 }}>
                                                <label className="input-group" style={{ marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Description / Bullet Points</span></label>
                                                {(exp.description || [""]).map((desc, j) => (
                                                    <div key={j} className="builder__bullet-row">
                                                        <input className="input-field" value={desc} onChange={e => updateDescriptionItem("experience", i, j, e.target.value)} placeholder="Led a team of 5 engineers to..." />
                                                        {exp.description.length > 1 && (
                                                            <button className="builder__remove-btn" onClick={() => removeDescriptionItem("experience", i, j)}><Trash2 size={12} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button className="builder__add-btn builder__add-btn--small" onClick={() => addDescriptionItem("experience", i)}>
                                                    <Plus size={12} /> Add Bullet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="builder__add-btn" onClick={() => addArrayItem("experience", emptyExperience)}>
                                        <Plus size={14} /> Add Experience
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Projects */}
                    {sections.includes("projects") && (
                        <div className="builder__section">
                            <SectionHeader id="projects" icon={<FolderKanban size={16} />} title="Projects" count={(formData.projects || []).length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.projects && (
                                <div className="builder__section-body">
                                    {(formData.projects || []).map((proj, i) => (
                                        <div key={i} className="builder__entry">
                                            <div className="builder__entry-header">
                                                <span className="builder__entry-num">#{i + 1}</span>
                                                <button className="builder__remove-btn" onClick={() => removeArrayItem("projects", i)}><Trash2 size={14} /></button>
                                            </div>
                                            <div className="builder__grid-2">
                                                <Input label="Project Name" value={proj.name} onChange={v => updateArrayItem("projects", i, "name", v)} placeholder="E-commerce Platform" />
                                                <Input label="Demo Link" value={proj.demo_link} onChange={v => updateArrayItem("projects", i, "demo_link", v)} placeholder="https://demo.com" />
                                                <Input label="Technologies" value={proj.technologies} onChange={v => updateArrayItem("projects", i, "technologies", v)} placeholder="React, Node.js, PostgreSQL" />
                                            </div>
                                            <div style={{ marginTop: 10 }}>
                                                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Description</label>
                                                {(proj.description || [""]).map((desc, j) => (
                                                    <div key={j} className="builder__bullet-row">
                                                        <input className="input-field" value={desc} onChange={e => updateDescriptionItem("projects", i, j, e.target.value)} placeholder="Built a real-time..." />
                                                        {proj.description.length > 1 && (
                                                            <button className="builder__remove-btn" onClick={() => removeDescriptionItem("projects", i, j)}><Trash2 size={12} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button className="builder__add-btn builder__add-btn--small" onClick={() => addDescriptionItem("projects", i)}>
                                                    <Plus size={12} /> Add Bullet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="builder__add-btn" onClick={() => addArrayItem("projects", emptyProject)}>
                                        <Plus size={14} /> Add Project
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skills */}
                    {sections.includes("skills") && (
                        <div className="builder__section">
                            <SectionHeader id="skills" icon={<Award size={16} />} title="Skills" count={formData.skills.length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.skills && (
                                <div className="builder__section-body">
                                    {formData.skills.map((cat, ci) => (
                                        <div key={ci} className="builder__entry">
                                            <Input
                                                label="Category"
                                                value={cat.category_name}
                                                onChange={v => {
                                                    const skills = [...formData.skills];
                                                    skills[ci] = { ...skills[ci], category_name: v };
                                                    updateField("skills", skills);
                                                }}
                                                placeholder="e.g. Programming Languages"
                                            />
                                            <div className="builder__skills-tags">
                                                {cat.skills.map((skill, si) => (
                                                    <div key={si} className="builder__skill-tag">
                                                        <input
                                                            className="input-field"
                                                            value={skill}
                                                            onChange={e => updateSkillCategory(ci, si, e.target.value)}
                                                            placeholder="Skill..."
                                                            style={{ padding: "6px 10px", fontSize: 12 }}
                                                        />
                                                        {cat.skills.length > 1 && (
                                                            <button className="builder__remove-btn" onClick={() => removeSkill(ci, si)} style={{ padding: 2 }}><Trash2 size={10} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button className="builder__add-btn builder__add-btn--small" onClick={() => addSkill(ci)}>
                                                    <Plus size={12} /> Add
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="builder__add-btn" onClick={addSkillCategory}>
                                        <Plus size={14} /> Add Category
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Certifications */}
                    {sections.includes("certifications") && (
                        <div className="builder__section">
                            <SectionHeader id="certifications" icon={<Award size={16} />} title="Certifications" count={(formData.certifications || []).filter(c => c.trim()).length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.certifications && (
                                <div className="builder__section-body">
                                    {(formData.certifications || []).map((cert, i) => (
                                        <div key={i} className="builder__bullet-row">
                                            <input className="input-field" value={cert} onChange={e => updateListItem("certifications", i, e.target.value)} placeholder="AWS Certified Solutions Architect" />
                                            {formData.certifications.length > 1 && (
                                                <button className="builder__remove-btn" onClick={() => removeListItem("certifications", i)}><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button className="builder__add-btn builder__add-btn--small" onClick={() => addListItem("certifications")}>
                                        <Plus size={12} /> Add Certification
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Publications */}
                    {sections.includes("publications") && (
                        <div className="builder__section">
                            <SectionHeader id="publications" icon={<BookOpen size={16} />} title="Publications" count={(formData.publications || []).length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.publications && (
                                <div className="builder__section-body">
                                    {(formData.publications || []).map((pub, i) => (
                                        <div key={i} className="builder__entry">
                                            <div className="builder__entry-header">
                                                <span className="builder__entry-num">#{i + 1}</span>
                                                <button className="builder__remove-btn" onClick={() => removeArrayItem("publications", i)}><Trash2 size={14} /></button>
                                            </div>
                                            <div className="builder__grid-2">
                                                <Input label="Title" value={pub.title} onChange={v => updateArrayItem("publications", i, "title", v)} placeholder="Machine Learning in Healthcare" />
                                                <Input label="Publisher" value={pub.publisher} onChange={v => updateArrayItem("publications", i, "publisher", v)} placeholder="IEEE" />
                                                <Input label="Date" value={pub.date} onChange={v => updateArrayItem("publications", i, "date", v)} placeholder="Jan 2024" />
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                <Input label="Summary" value={pub.summary} onChange={v => updateArrayItem("publications", i, "summary", v)} placeholder="Brief summary..." />
                                            </div>
                                        </div>
                                    ))}
                                    <button className="builder__add-btn" onClick={() => addArrayItem("publications", emptyPublication)}>
                                        <Plus size={14} /> Add Publication
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Awards */}
                    {sections.includes("awards") && (
                        <div className="builder__section">
                            <SectionHeader id="awards" icon={<Award size={16} />} title="Awards & Honors" count={(formData.awards || []).length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.awards && (
                                <div className="builder__section-body">
                                    {(formData.awards || []).map((award, i) => (
                                        <div key={i} className="builder__entry">
                                            <div className="builder__entry-header">
                                                <span className="builder__entry-num">#{i + 1}</span>
                                                <button className="builder__remove-btn" onClick={() => removeArrayItem("awards", i)}><Trash2 size={14} /></button>
                                            </div>
                                            <div className="builder__grid-2">
                                                <Input label="Title" value={award.title} onChange={v => updateArrayItem("awards", i, "title", v)} placeholder="Best Paper Award" />
                                                <Input label="Awarder" value={award.awarder} onChange={v => updateArrayItem("awards", i, "awarder", v)} placeholder="ACM" />
                                                <Input label="Date" value={award.date} onChange={v => updateArrayItem("awards", i, "date", v)} placeholder="2023" />
                                            </div>
                                        </div>
                                    ))}
                                    <button className="builder__add-btn" onClick={() => addArrayItem("awards", emptyAward)}>
                                        <Plus size={14} /> Add Award
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Volunteer */}
                    {sections.includes("volunteer") && (
                        <div className="builder__section">
                            <SectionHeader id="volunteer" icon={<Heart size={16} />} title="Volunteer Experience" count={(formData.volunteer || []).length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.volunteer && (
                                <div className="builder__section-body">
                                    {(formData.volunteer || []).map((vol, i) => (
                                        <div key={i} className="builder__entry">
                                            <div className="builder__entry-header">
                                                <span className="builder__entry-num">#{i + 1}</span>
                                                <button className="builder__remove-btn" onClick={() => removeArrayItem("volunteer", i)}><Trash2 size={14} /></button>
                                            </div>
                                            <div className="builder__grid-2">
                                                <Input label="Organization" value={vol.organization} onChange={v => updateArrayItem("volunteer", i, "organization", v)} placeholder="Red Cross" />
                                                <Input label="Role" value={vol.role} onChange={v => updateArrayItem("volunteer", i, "role", v)} placeholder="Event Coordinator" />
                                                <Input label="Start Date" value={vol.start_date} onChange={v => updateArrayItem("volunteer", i, "start_date", v)} placeholder="Jan 2023" />
                                                <Input label="End Date" value={vol.end_date} onChange={v => updateArrayItem("volunteer", i, "end_date", v)} placeholder="Dec 2023" />
                                            </div>
                                            <div style={{ marginTop: 10 }}>
                                                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Description</label>
                                                {(vol.description || [""]).map((desc, j) => (
                                                    <div key={j} className="builder__bullet-row">
                                                        <input className="input-field" value={desc} onChange={e => updateDescriptionItem("volunteer", i, j, e.target.value)} placeholder="Organized fundraising events..." />
                                                        {vol.description.length > 1 && (
                                                            <button className="builder__remove-btn" onClick={() => removeDescriptionItem("volunteer", i, j)}><Trash2 size={12} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button className="builder__add-btn builder__add-btn--small" onClick={() => addDescriptionItem("volunteer", i)}>
                                                    <Plus size={12} /> Add Bullet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="builder__add-btn" onClick={() => addArrayItem("volunteer", emptyVolunteer)}>
                                        <Plus size={14} /> Add Volunteer
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Languages */}
                    {sections.includes("languages") && (
                        <div className="builder__section">
                            <SectionHeader id="languages" icon={<Languages size={16} />} title="Languages" count={(formData.languages || []).filter(l => l.trim()).length} collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.languages && (
                                <div className="builder__section-body">
                                    {(formData.languages || []).map((lang, i) => (
                                        <div key={i} className="builder__bullet-row">
                                            <input className="input-field" value={lang} onChange={e => updateListItem("languages", i, e.target.value)} placeholder="English (Native)" />
                                            {formData.languages.length > 1 && (
                                                <button className="builder__remove-btn" onClick={() => removeListItem("languages", i)}><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button className="builder__add-btn builder__add-btn--small" onClick={() => addListItem("languages")}>
                                        <Plus size={12} /> Add Language
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Coursework */}
                    {sections.includes("coursework") && (
                        <div className="builder__section">
                            <SectionHeader id="coursework" icon={<BookOpen size={16} />} title="Relevant Coursework" collapsed={collapsed} toggleCollapse={toggleCollapse} setSections={setSections} />
                            {!collapsed.coursework && (
                                <div className="builder__section-body">
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Major Coursework</label>
                                    {(formData.coursework?.major_coursework || []).map((c, i) => (
                                        <div key={i} className="builder__bullet-row">
                                            <input className="input-field" value={c} onChange={e => updateCoursework("major_coursework", i, e.target.value)} placeholder="Data Structures" />
                                            {formData.coursework.major_coursework.length > 1 && (
                                                <button className="builder__remove-btn" onClick={() => removeCoursework("major_coursework", i)}><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button className="builder__add-btn builder__add-btn--small" onClick={() => addCoursework("major_coursework")}><Plus size={12} /> Add</button>

                                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginTop: 16, marginBottom: 4, display: "block" }}>Minor Coursework</label>
                                    {(formData.coursework?.minor_coursework || []).map((c, i) => (
                                        <div key={i} className="builder__bullet-row">
                                            <input className="input-field" value={c} onChange={e => updateCoursework("minor_coursework", i, e.target.value)} placeholder="Psychology" />
                                            {formData.coursework.minor_coursework.length > 1 && (
                                                <button className="builder__remove-btn" onClick={() => removeCoursework("minor_coursework", i)}><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button className="builder__add-btn builder__add-btn--small" onClick={() => addCoursework("minor_coursework")}><Plus size={12} /> Add</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Missing Sections Menu */}
                    <div className="builder__add-section-menu" style={{ padding: '24px 0', borderTop: '1px solid var(--border-primary)', marginTop: '32px' }}>
                        <h4 style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>Add More Sections</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {FIELD_SECTIONS_MAP.general.map(sec => {
                                if (!sections.includes(sec) && sec !== 'summary') {
                                    return (
                                        <button key={sec} className="badge" style={{ cursor: 'pointer', background: 'var(--bg-secondary)', padding: '6px 12px' }} onClick={() => setSections([...sections, sec])}>
                                            <Plus size={12} /> Add {sec.charAt(0).toUpperCase() + sec.slice(1)}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </div>

                {/* ====== RIGHT: PREVIEW ====== */}
                <div className="builder__preview">
                    <div className="builder__preview-body" style={{ padding: 0 }}>
                        {pdfUrl ? (
                            <iframe src={pdfUrl} className="builder__preview-iframe" title="Resume Preview" />
                        ) : (
                            <LivePreview data={formData} activeSections={sections} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Builder;
