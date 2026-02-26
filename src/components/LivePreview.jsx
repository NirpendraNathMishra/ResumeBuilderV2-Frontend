import { FileText, Mail, Phone, MapPin, Linkedin, Github, Globe, Plus, Minus, Maximize } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./LivePreview.css";

const LivePreview = ({ data, activeSections }) => {
    const containerRef = useRef(null);
    const [manualZoom, setManualZoom] = useState(null);

    useEffect(() => {
        const updateWidthVar = () => {
            if (containerRef.current) {
                containerRef.current.style.setProperty('--container-width', `${containerRef.current.clientWidth}px`);
            }
        };

        const resizeObserver = new ResizeObserver(updateWidthVar);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
            updateWidthVar();
        }

        return () => resizeObserver.disconnect();
    }, []);

    if (!data.name && !data.contact?.email) {
        return (
            <div className="live-preview-empty">
                <FileText size={48} />
                <h3>Your resume will appear here</h3>
                <p>Start typing your details to see the real-time preview.</p>
            </div>
        );
    }

    return (
        <div className={`live-preview-container ${manualZoom !== null ? 'is-zoomed' : ''}`} ref={containerRef}>

            {/* Zoom Controls Overlay */}
            <div className="live-preview-controls">
                <button title="Zoom Out" onClick={() => setManualZoom(z => Math.max(0.4, (z || 0.9) - 0.1))}><Minus size={16} /></button>
                <span className="live-preview-zoom-level">{manualZoom ? Math.round(manualZoom * 100) + '%' : 'Fit'}</span>
                <button title="Zoom In" onClick={() => setManualZoom(z => Math.min(2.0, (z || 1.1) + 0.1))}><Plus size={16} /></button>
                {manualZoom !== null && (
                    <button title="Fit to Screen" onClick={() => setManualZoom(null)} style={{ borderLeft: '1px solid var(--border-primary)', paddingLeft: '8px', marginLeft: '4px' }}>
                        <Maximize size={16} />
                    </button>
                )}
            </div>

            <div
                className="live-preview-page-wrapper"
                style={manualZoom ? {
                    transform: `scale(${manualZoom})`,
                    height: `${1122 * manualZoom}px`,
                    marginBottom: '0'
                } : {}}
            >
                <div className="live-preview-page">
                    {/* Header */}
                    <div className="lp-header">
                        <h1 className="lp-name">{data.name}</h1>
                        <div className="lp-contact">
                            {data.contact?.email && <span className="lp-contact-item"><Mail size={11} /> {data.contact.email}</span>}
                            {data.contact?.phone && <span className="lp-contact-item"><Phone size={11} /> {data.contact.phone}</span>}
                            {data.contact?.location && <span className="lp-contact-item"><MapPin size={11} /> {data.contact.location}</span>}
                            {data.contact?.linkedin && <span className="lp-contact-item"><Linkedin size={11} /> {data.contact.linkedin.replace("https://", "").replace("www.", "")}</span>}
                            {data.contact?.github && <span className="lp-contact-item"><Github size={11} /> {data.contact.github.replace("https://", "").replace("www.", "")}</span>}
                            {data.contact?.portfolio && <span className="lp-contact-item"><Globe size={11} /> {data.contact.portfolio.replace("https://", "").replace("www.", "")}</span>}
                        </div>
                    </div>

                    {/* Summary */}
                    {activeSections.includes("summary") && data.professional_summary && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Summary</h2>
                            <div className="lp-summary-text">{data.professional_summary}</div>
                        </div>
                    )}

                    {/* Experience */}
                    {activeSections.includes("experience") && data.experience?.length > 0 && data.experience[0].company && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Experience</h2>
                            {data.experience.map((exp, i) => (
                                <div key={i} className="lp-item">
                                    <div className="lp-item-header">
                                        <strong>{exp.role || "Role"}</strong>
                                        <span>{exp.start_date} {exp.end_date ? `- ${exp.end_date}` : ""}</span>
                                    </div>
                                    <div className="lp-item-sub">
                                        <i>{exp.company}</i>{exp.location ? `, ${exp.location}` : ""}
                                    </div>
                                    <ul className="lp-bullets">
                                        {(exp.description || []).filter(d => d.trim()).map((desc, j) => (
                                            <li key={j}>{desc}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Education */}
                    {activeSections.includes("education") && data.education?.length > 0 && data.education[0].institution && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Education</h2>
                            {data.education.map((edu, i) => (
                                <div key={i} className="lp-item">
                                    <div className="lp-item-header">
                                        <strong>{edu.institution || "Institution"}</strong>
                                        <span>{edu.graduation_date}</span>
                                    </div>
                                    <div className="lp-item-sub">
                                        {edu.degree} {edu.gpa ? ` (GPA: ${edu.gpa})` : ""}
                                        {edu.location ? `, ${edu.location}` : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Projects */}
                    {activeSections.includes("projects") && data.projects?.length > 0 && data.projects[0].name && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Projects</h2>
                            {data.projects.map((proj, i) => (
                                <div key={i} className="lp-item">
                                    <div className="lp-item-header">
                                        <strong>{proj.name}</strong>
                                        {proj.technologies && <span>{proj.technologies}</span>}
                                    </div>
                                    {proj.demo_link && (
                                        <div className="lp-item-sub">
                                            <a href={proj.demo_link}>{proj.demo_link}</a>
                                        </div>
                                    )}
                                    <ul className="lp-bullets">
                                        {(proj.description || []).filter(d => d.trim()).map((desc, j) => (
                                            <li key={j}>{desc}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Skills */}
                    {activeSections.includes("skills") && data.skills?.length > 0 && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Skills</h2>
                            <div className="lp-skills-list">
                                {data.skills.filter(cat => cat.category_name || (cat.skills && cat.skills.some(s => s.trim()))).map((cat, i) => (
                                    <div key={i} className="lp-skill-row">
                                        {cat.category_name && <strong>{cat.category_name}: </strong>}
                                        <span>{cat.skills.filter(s => s.trim()).join(", ")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certifications */}
                    {activeSections.includes("certifications") && data.certifications?.filter(c => c.trim()).length > 0 && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Certifications</h2>
                            <ul className="lp-bullets">
                                {data.certifications.filter(c => c.trim()).map((cert, i) => (
                                    <li key={i}>{cert}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Publications */}
                    {activeSections.includes("publications") && data.publications?.length > 0 && data.publications[0].title && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Publications</h2>
                            {data.publications.map((pub, i) => (
                                <div key={i} className="lp-item">
                                    <strong>{pub.title}</strong>
                                    {pub.publisher && <span> - {pub.publisher}</span>}
                                    {pub.date && <span> ({pub.date})</span>}
                                    {pub.summary && <div className="lp-summary-text">{pub.summary}</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Awards */}
                    {activeSections.includes("awards") && data.awards?.length > 0 && data.awards[0].title && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Awards</h2>
                            {data.awards.map((award, i) => (
                                <div key={i} className="lp-item">
                                    <strong>{award.title}</strong>
                                    {award.awarder && <span> - {award.awarder}</span>}
                                    {award.date && <span> ({award.date})</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Volunteer */}
                    {activeSections.includes("volunteer") && data.volunteer?.length > 0 && data.volunteer[0].organization && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Volunteer Experience</h2>
                            {data.volunteer.map((vol, i) => (
                                <div key={i} className="lp-item">
                                    <div className="lp-item-header">
                                        <strong>{vol.role || "Role"}</strong>
                                        <span>{vol.start_date} {vol.end_date ? `- ${vol.end_date}` : ""}</span>
                                    </div>
                                    <div className="lp-item-sub"><i>{vol.organization}</i></div>
                                    <ul className="lp-bullets">
                                        {(vol.description || []).filter(d => d.trim()).map((desc, j) => (
                                            <li key={j}>{desc}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Languages */}
                    {activeSections.includes("languages") && data.languages?.filter(l => l.trim()).length > 0 && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Languages</h2>
                            <div className="lp-skills-list">
                                {data.languages.filter(l => l.trim()).join(", ")}
                            </div>
                        </div>
                    )}

                    {/* Coursework */}
                    {activeSections.includes("coursework") && (data.coursework?.major_coursework?.filter(c => c.trim()).length > 0 || data.coursework?.minor_coursework?.filter(c => c.trim()).length > 0) && (
                        <div className="lp-section">
                            <h2 className="lp-section-title">Relevant Coursework</h2>
                            {data.coursework?.major_coursework?.filter(c => c.trim()).length > 0 && (
                                <div className="lp-skill-row">
                                    <strong>Major: </strong>
                                    <span>{data.coursework.major_coursework.filter(c => c.trim()).join(", ")}</span>
                                </div>
                            )}
                            {data.coursework?.minor_coursework?.filter(c => c.trim()).length > 0 && (
                                <div className="lp-skill-row">
                                    <strong>Minor: </strong>
                                    <span>{data.coursework.minor_coursework.filter(c => c.trim()).join(", ")}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LivePreview;
