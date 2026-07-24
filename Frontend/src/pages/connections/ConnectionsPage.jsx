import { useState, useEffect, useRef } from 'react';
import {
    Plus, Heart, MapPin, Calendar, ExternalLink, X, Edit2, Trash2,
    Star, ChevronLeft, Mail, Phone, Image as ImageIcon,
} from 'lucide-react';
import { connectionService } from '../../services/api';

const RELATIONSHIP_COLORS = {
    friend: '#4285f4', family: '#e91e63', colleague: '#ff9800',
    acquaintance: '#9e9e9e', mentor: '#9c27b0', partner: '#f44336', other: '#607d8b',
};

const PLATFORM_DATA = {
    instagram: { icon: '📸', color: '#E4405F' },
    twitter: { icon: '𝕏', color: '#1DA1F2' },
    linkedin: { icon: 'in', color: '#0077B5' },
    github: { icon: '🐙', color: '#333' },
    facebook: { icon: 'f', color: '#1877F2' },
    snapchat: { icon: '👻', color: '#FFFC00' },
    discord: { icon: '🎮', color: '#5865F2' },
    whatsapp: { icon: '💬', color: '#25D366' },
    website: { icon: '🌐', color: '#333' },
    other: { icon: '🔗', color: '#888' },
};

const ConnectionsPage = () => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingConnection, setEditingConnection] = useState(null);
    const [viewingConnection, setViewingConnection] = useState(null);

    useEffect(() => { fetchConnections(); }, []);

    const fetchConnections = async () => {
        setLoading(true);
        try {
            const { data } = await connectionService.getAll();
            if (data.success) setConnections(data.data);
        } catch (err) { console.error('Failed to fetch connections:', err); }
        finally { setLoading(false); }
    };

    const handleSave = async (formData) => {
        try {
            if (editingConnection) {
                const { data } = await connectionService.update(editingConnection._id, formData);
                if (data.success) setConnections(connections.map((c) => (c._id === editingConnection._id ? data.data : c)));
            } else {
                const { data } = await connectionService.create(formData);
                if (data.success) setConnections([data.data, ...connections]);
            }
            setShowForm(false);
            setEditingConnection(null);
        } catch (err) { console.error('Failed to save:', err); }
    };

    const handleDelete = async (id) => {
        try {
            await connectionService.delete(id);
            setConnections(connections.filter((c) => c._id !== id));
            setViewingConnection(null);
        } catch (err) { console.error('Failed to delete:', err); }
    };

    const getInitials = (name) => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <>
            <div className="main-header">
                <div>
                    <h1 className="main-title">People</h1>
                    <p className="main-date-subtitle">{connections.length} connection{connections.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><p className="empty-state-text">Loading...</p></div>
            ) : connections.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <p className="empty-state-text">No connections yet. Tap + to add someone!</p>
                </div>
            ) : (
                /* ---- List View (like Dex screenshot) ---- */
                <div className="conn-list">
                    {connections.map((conn) => (
                        <div key={conn._id} className="conn-row" onClick={() => setViewingConnection(conn)}>
                            {/* Avatar */}
                            <div className="conn-avatar" style={{ background: RELATIONSHIP_COLORS[conn.relationship] || '#ccc' }}>
                                {conn.photo ? (
                                    <img src={conn.photo} alt={conn.name} />
                                ) : (
                                    getInitials(conn.name)
                                )}
                            </div>

                            {/* Name + Relationship */}
                            <div className="conn-info">
                                <span className="conn-name">
                                    {conn.name}
                                    {conn.isFavorite && <Star size={12} style={{ color: '#f5a623', fill: '#f5a623', marginLeft: 4 }} />}
                                </span>
                                <span className="conn-role">{conn.relationship}</span>
                            </div>

                            {/* Location */}
                            <span className="conn-meta">{conn.location || '—'}</span>

                            {/* Social Icons */}
                            <div className="conn-socials">
                                {(conn.socialLinks || []).slice(0, 4).map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="conn-social-icon"
                                        onClick={(e) => e.stopPropagation()}
                                        title={link.platform}
                                        style={{ color: PLATFORM_DATA[link.platform]?.color || '#888' }}
                                    >
                                        {PLATFORM_DATA[link.platform]?.icon || '🔗'}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="fab" onClick={() => { setEditingConnection(null); setShowForm(true); }} title="Add someone">
                <Plus size={24} />
            </button>

            {showForm && (
                <ConnectionFormModal
                    connection={editingConnection}
                    onSave={handleSave}
                    onClose={() => { setShowForm(false); setEditingConnection(null); }}
                />
            )}

            {viewingConnection && (
                <ConnectionDetailView
                    connection={viewingConnection}
                    onEdit={() => { setEditingConnection(viewingConnection); setViewingConnection(null); setShowForm(true); }}
                    onDelete={() => handleDelete(viewingConnection._id)}
                    onClose={() => setViewingConnection(null)}
                />
            )}
        </>
    );
};

// ===== Connection Form Modal (with photo + social links) =====
const ConnectionFormModal = ({ connection, onSave, onClose }) => {
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({
        name: connection?.name || '',
        nickname: connection?.nickname || '',
        relationship: connection?.relationship || 'friend',
        dateOfBirth: connection?.dateOfBirth ? new Date(connection.dateOfBirth).toISOString().slice(0, 10) : '',
        metDate: connection?.metOn?.date ? new Date(connection.metOn.date).toISOString().slice(0, 10) : '',
        metPlace: connection?.metOn?.place || '',
        metContext: connection?.metOn?.context || '',
        location: connection?.location || '',
        notes: connection?.notes || '',
        isFavorite: connection?.isFavorite || false,
        photo: connection?.photo || '',
        socialLinks: connection?.socialLinks || [],
    });

    const handleChange = (field, value) => setForm({ ...form, [field]: value });

    // Photo upload → base64
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => handleChange('photo', reader.result);
        reader.readAsDataURL(file);
    };

    // Social links management
    const addSocialLink = () => {
        setForm({ ...form, socialLinks: [...form.socialLinks, { platform: 'instagram', url: '' }] });
    };

    const updateSocialLink = (index, field, value) => {
        const updated = [...form.socialLinks];
        updated[index] = { ...updated[index], [field]: value };
        setForm({ ...form, socialLinks: updated });
    };

    const removeSocialLink = (index) => {
        setForm({ ...form, socialLinks: form.socialLinks.filter((_, i) => i !== index) });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            name: form.name,
            nickname: form.nickname,
            relationship: form.relationship,
            dateOfBirth: form.dateOfBirth || undefined,
            metOn: { date: form.metDate || undefined, place: form.metPlace, context: form.metContext },
            location: form.location,
            notes: form.notes,
            isFavorite: form.isFavorite,
            photo: form.photo,
            socialLinks: form.socialLinks.filter((l) => l.url.trim()),
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 className="modal-title" style={{ margin: 0 }}>{connection ? 'Edit Connection' : 'Add Someone'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Photo Upload */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 8px',
                                background: form.photo ? 'none' : '#f0f0f0', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', border: '2px dashed #ccc',
                            }}
                        >
                            {form.photo ? (
                                <img src={form.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <ImageIcon size={24} color="#bbb" />
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>Click to upload photo</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="ws-form-group">
                            <label className="ws-label">Name *</label>
                            <input className="ws-input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
                        </div>
                        <div className="ws-form-group">
                            <label className="ws-label">Nickname</label>
                            <input className="ws-input" value={form.nickname} onChange={(e) => handleChange('nickname', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="ws-form-group">
                            <label className="ws-label">Relationship</label>
                            <select className="ws-select" value={form.relationship} onChange={(e) => handleChange('relationship', e.target.value)}>
                                {Object.keys(RELATIONSHIP_COLORS).map((r) => (
                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ws-form-group">
                            <label className="ws-label">Birthday</label>
                            <input type="date" className="ws-input" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="ws-form-group">
                            <label className="ws-label">Met On</label>
                            <input type="date" className="ws-input" value={form.metDate} onChange={(e) => handleChange('metDate', e.target.value)} />
                        </div>
                        <div className="ws-form-group">
                            <label className="ws-label">Met At</label>
                            <input className="ws-input" placeholder="College, Office..." value={form.metPlace} onChange={(e) => handleChange('metPlace', e.target.value)} />
                        </div>
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">How you met</label>
                        <input className="ws-input" placeholder="Orientation day, conference..." value={form.metContext} onChange={(e) => handleChange('metContext', e.target.value)} />
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">Where they live</label>
                        <input className="ws-input" placeholder="City, Country" value={form.location} onChange={(e) => handleChange('location', e.target.value)} />
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">Your notes about them</label>
                        <textarea className="ws-textarea" placeholder="Thoughts, views..." value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3} />
                    </div>

                    {/* Social Links */}
                    <div className="ws-form-group">
                        <label className="ws-label">Social Links</label>
                        {form.socialLinks.map((link, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                <select
                                    className="ws-select"
                                    style={{ width: 130, flexShrink: 0 }}
                                    value={link.platform}
                                    onChange={(e) => updateSocialLink(i, 'platform', e.target.value)}
                                >
                                    {Object.keys(PLATFORM_DATA).map((p) => (
                                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                    ))}
                                </select>
                                <input
                                    className="ws-input"
                                    placeholder="https://..."
                                    value={link.url}
                                    onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                                />
                                <button type="button" onClick={() => removeSocialLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', flexShrink: 0 }}>
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addSocialLink} style={{
                            background: 'none', border: '1px dashed #ccc', borderRadius: 8,
                            padding: '6px 14px', fontSize: '0.8rem', color: '#888', cursor: 'pointer', width: '100%',
                        }}>
                            + Add social link
                        </button>
                    </div>

                    <div className="ws-form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={form.isFavorite} onChange={(e) => handleChange('isFavorite', e.target.checked)} />
                            <Star size={14} /> Mark as Favorite
                        </label>
                    </div>

                    <div className="ws-btn-row">
                        <button type="button" className="ws-btn ws-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="ws-btn ws-btn-primary">{connection ? 'Save' : 'Add Person'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===== Connection Detail View (inspired by Dex mobile screenshot) =====
const ConnectionDetailView = ({ connection, onEdit, onDelete, onClose }) => {
    const [activeTab, setActiveTab] = useState('details');
    const getInitials = (name) => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    const dob = connection.dateOfBirth
        ? new Date(connection.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;
    const metDate = connection.metOn?.date
        ? new Date(connection.metOn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="conn-detail-panel" onClick={(e) => e.stopPropagation()}>
                {/* Top Bar */}
                <div className="conn-detail-topbar">
                    <button onClick={onClose} className="conn-detail-back"><ChevronLeft size={20} /></button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onEdit} className="conn-detail-action"><Edit2 size={16} /></button>
                        <button onClick={onDelete} className="conn-detail-action" style={{ color: '#e53935' }}><Trash2 size={16} /></button>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="conn-detail-header">
                    <div className="conn-detail-avatar" style={{ background: RELATIONSHIP_COLORS[connection.relationship] }}>
                        {connection.photo ? (
                            <img src={connection.photo} alt={connection.name} />
                        ) : (
                            getInitials(connection.name)
                        )}
                    </div>
                    <h2 className="conn-detail-name">{connection.name}</h2>
                    <span className="conn-detail-role">{connection.relationship}</span>
                    {connection.isFavorite && <Star size={16} style={{ color: '#f5a623', fill: '#f5a623', marginTop: 4 }} />}
                </div>

                {/* Social Icons Row */}
                {connection.socialLinks?.length > 0 && (
                    <div className="conn-detail-socials">
                        {connection.socialLinks.map((link, i) => (
                            <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="conn-detail-social-btn"
                                title={link.platform}
                            >
                                {PLATFORM_DATA[link.platform]?.icon || '🔗'}
                            </a>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="conn-detail-tabs">
                    <button className={`conn-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
                    <button className={`conn-tab ${activeTab === 'reminders' ? 'active' : ''}`} onClick={() => setActiveTab('reminders')}>Reminders</button>
                </div>

                {/* Tab Content */}
                <div className="conn-detail-content">
                    {activeTab === 'details' && (
                        <div className="conn-detail-list">
                            {dob && (
                                <div className="conn-detail-row">
                                    <Calendar size={16} color="#888" />
                                    <div><span className="conn-detail-label">Birthday</span><br />{dob}</div>
                                </div>
                            )}
                            {connection.location && (
                                <div className="conn-detail-row">
                                    <MapPin size={16} color="#888" />
                                    <div><span className="conn-detail-label">Location</span><br />{connection.location}</div>
                                </div>
                            )}
                            {connection.metOn?.place && (
                                <div className="conn-detail-row">
                                    <span style={{ fontSize: '1rem' }}>🤝</span>
                                    <div>
                                        <span className="conn-detail-label">How you met</span><br />
                                        {connection.metOn.place}
                                        {connection.metOn.context && ` — ${connection.metOn.context}`}
                                        {metDate && <span style={{ color: '#888' }}> ({metDate})</span>}
                                    </div>
                                </div>
                            )}
                            {connection.nickname && (
                                <div className="conn-detail-row">
                                    <span style={{ fontSize: '1rem' }}>😊</span>
                                    <div><span className="conn-detail-label">Nickname</span><br />{connection.nickname}</div>
                                </div>
                            )}
                            {connection.notes && (
                                <div style={{ marginTop: 16, padding: '14px 16px', background: '#fafafa', borderRadius: 10, fontSize: '0.9rem', color: '#333', lineHeight: 1.7 }}>
                                    <span className="conn-detail-label" style={{ display: 'block', marginBottom: 6 }}>Your Notes</span>
                                    {connection.notes}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reminders' && (
                        <div>
                            {connection.reminders?.length > 0 ? (
                                connection.reminders.map((r, i) => (
                                    <div key={i} className="conn-detail-row">
                                        <span style={{ fontSize: '1rem' }}>🔔</span>
                                        <div>
                                            {r.title}<br />
                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                                {new Date(r.date).toLocaleDateString()} {r.recurring && '(recurring)'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#bbb', textAlign: 'center', padding: 32, fontSize: '0.9rem' }}>No reminders set</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectionsPage;
