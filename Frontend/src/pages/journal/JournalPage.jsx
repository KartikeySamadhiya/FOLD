import { useState, useEffect, useRef } from 'react';
import { Plus, Smile, Meh, Frown, Sparkles, Heart, Brain, X, Image as ImageIcon } from 'lucide-react';
import { journalService } from '../../services/api';

const MOOD_ICONS = {
    happy: { icon: Smile, label: 'Happy', color: '#4caf50' },
    neutral: { icon: Meh, label: 'Neutral', color: '#9e9e9e' },
    sad: { icon: Frown, label: 'Sad', color: '#2196f3' },
    excited: { icon: Sparkles, label: 'Excited', color: '#ff9800' },
    reflective: { icon: Brain, label: 'Reflective', color: '#9c27b0' },
    anxious: { icon: Brain, label: 'Anxious', color: '#f44336' },
    grateful: { icon: Heart, label: 'Grateful', color: '#e91e63' },
};

const JournalPage = ({ selectedDate }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const dateObj = selectedDate ? new Date(selectedDate) : new Date();
    const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const isToday =
        new Date().toISOString().slice(0, 10) ===
        (selectedDate || new Date().toISOString().slice(0, 10));

    // Fetch entries for selected date
    useEffect(() => {
        const fetchEntries = async () => {
            setLoading(true);
            try {
                const dateStr = selectedDate || new Date().toISOString().slice(0, 10);
                const { data } = await journalService.getByDate(dateStr);
                if (data.success) {
                    setEntries(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch entries:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEntries();
    }, [selectedDate]);

    const handleSave = async (formData) => {
        try {
            if (editingEntry) {
                const { data } = await journalService.update(editingEntry._id, formData);
                if (data.success) {
                    setEntries(entries.map((e) => (e._id === editingEntry._id ? data.data : e)));
                }
            } else {
                const { data } = await journalService.create({
                    ...formData,
                    date: selectedDate || new Date().toISOString().slice(0, 10),
                });
                if (data.success) {
                    setEntries([data.data, ...entries]);
                }
            }
            setShowForm(false);
            setEditingEntry(null);
        } catch (err) {
            console.error('Failed to save:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await journalService.delete(id);
            setEntries(entries.filter((e) => e._id !== id));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const openEdit = (entry) => {
        setEditingEntry(entry);
        setShowForm(true);
    };

    return (
        <>
            {/* Header */}
            <div className="main-header">
                <div>
                    <h1 className="main-title">
                        {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h1>
                    <p className="main-date-subtitle">{displayDate}</p>
                </div>
            </div>

            {/* Entry Cards */}
            {loading ? (
                <div className="empty-state">
                    <p className="empty-state-text">Loading...</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <p className="empty-state-text">
                        {isToday
                            ? "No folds yet today. Tap + to add one!"
                            : "No folds for this day."}
                    </p>
                </div>
            ) : (
                entries.map((entry) => {
                    const MoodInfo = MOOD_ICONS[entry.mood] || MOOD_ICONS.neutral;
                    const MoodIcon = MoodInfo.icon;
                    const hasImage = entry.photos && entry.photos.length > 0;

                    return (
                        <div
                            key={entry._id}
                            className={`entry-card ${hasImage ? 'entry-card-with-image' : ''}`}
                            onClick={() => openEdit(entry)}
                        >
                            {hasImage && (
                                <img
                                    src={entry.photos[0].url}
                                    alt={entry.photos[0].caption || 'Photo'}
                                    className="entry-card-image"
                                />
                            )}
                            <div>
                                {entry.title && <h3 className="entry-card-title">{entry.title}</h3>}
                                <p className="entry-card-content">{entry.content}</p>
                                <div className="entry-card-meta">
                                    <span className="mood-badge" style={{ color: MoodInfo.color }}>
                                        <MoodIcon size={14} /> {MoodInfo.label}
                                    </span>
                                    {entry.tags?.map((tag) => (
                                        <span key={tag} style={{ color: '#aaa' }}>#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Floating Add Button */}
            <button className="fab" onClick={() => { setEditingEntry(null); setShowForm(true); }} title="Add a fold">
                <Plus size={24} />
            </button>

            {/* Add/Edit Modal */}
            {showForm && (
                <EntryFormModal
                    entry={editingEntry}
                    onSave={handleSave}
                    onDelete={editingEntry ? () => { handleDelete(editingEntry._id); setShowForm(false); setEditingEntry(null); } : null}
                    onClose={() => { setShowForm(false); setEditingEntry(null); }}
                />
            )}
        </>
    );
};

// ---- Entry Form Modal (with photo upload) ----
const EntryFormModal = ({ entry, onSave, onDelete, onClose }) => {
    const [title, setTitle] = useState(entry?.title || '');
    const [content, setContent] = useState(entry?.content || '');
    const [mood, setMood] = useState(entry?.mood || 'neutral');
    const [photos, setPhotos] = useState(entry?.photos || []);
    const fileInputRef = useRef(null);

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos((prev) => [...prev, { url: reader.result, caption: '' }]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ title, content, mood, photos });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 className="modal-title" style={{ margin: 0 }}>
                        {entry ? 'Edit Fold' : 'New Fold'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="ws-form-group">
                        <label className="ws-label">Title (optional)</label>
                        <input
                            type="text"
                            className="ws-input"
                            placeholder="What's this fold about?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">Content</label>
                        <textarea
                            className="ws-textarea"
                            placeholder="Write your thoughts..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            required
                        />
                    </div>

                    {/* Photo Upload */}
                    <div className="ws-form-group">
                        <label className="ws-label">Photos</label>
                        {photos.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                {photos.map((photo, i) => (
                                    <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                                        <img
                                            src={photo.url}
                                            alt={`Photo ${i + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(i)}
                                            style={{
                                                position: 'absolute', top: -6, right: -6,
                                                width: 20, height: 20, borderRadius: '50%',
                                                background: '#e53935', color: '#fff', border: 'none',
                                                cursor: 'pointer', fontSize: '0.7rem', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                background: 'none', border: '1px dashed #ccc', borderRadius: 8,
                                padding: '8px 14px', fontSize: '0.8rem', color: '#888',
                                cursor: 'pointer', width: '100%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                        >
                            <ImageIcon size={16} /> Add photos
                        </button>
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">Mood</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {Object.entries(MOOD_ICONS).map(([key, info]) => {
                                const Icon = info.icon;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setMood(key)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '6px 12px', borderRadius: 99,
                                            border: mood === key ? `2px solid ${info.color}` : '1px solid #ddd',
                                            background: mood === key ? '#f5f5f5' : '#fff',
                                            cursor: 'pointer', fontSize: '0.8rem',
                                            color: info.color, fontWeight: mood === key ? 600 : 400,
                                        }}
                                    >
                                        <Icon size={14} /> {info.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="ws-btn-row">
                        {onDelete && (
                            <button type="button" className="ws-btn ws-btn-danger" onClick={onDelete}>Delete</button>
                        )}
                        <button type="button" className="ws-btn ws-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="ws-btn ws-btn-primary">
                            {entry ? 'Save Changes' : 'Create Fold'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JournalPage;
