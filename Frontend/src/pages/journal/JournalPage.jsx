import { useState, useEffect, useRef } from 'react';
import { Plus, Smile, Meh, Frown, Sparkles, Heart, Brain, X, Image as ImageIcon, Bell, FileText, Edit, Trash2 } from 'lucide-react';
import { journalService, reminderService } from '../../services/api';

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
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [viewingEntry, setViewingEntry] = useState(null);
    const [fabOpen, setFabOpen] = useState(false);

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

    const handleSave = async (data) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title || '');
            formData.append('content', data.content || '');
            formData.append('mood', data.mood || 'neutral');
            
            // Preserve the original date if editing, otherwise use selectedDate or today
            const entryDate = editingEntry ? editingEntry.date : (selectedDate || new Date().toISOString().slice(0, 10));
            formData.append('date', entryDate);
            
            // Preserve existing tags if the form doesn't pass them
            if (data.tags && data.tags.length > 0) {
                formData.append('tags', JSON.stringify(data.tags));
            } else if (editingEntry && editingEntry.tags) {
                formData.append('tags', JSON.stringify(editingEntry.tags));
            }

            // Separate existing URL-based photos from newly uploaded File objects
            const existingPhotos = [];
            if (data.photos && data.photos.length > 0) {
                data.photos.forEach((photo) => {
                    if (photo.file) {
                        // New file the user just picked
                        formData.append('photos', photo.file);
                    } else if (photo.url) {
                        // Already-uploaded photo (ImageKit URL or legacy base64)
                        existingPhotos.push({ url: photo.url, caption: photo.caption || '' });
                    }
                });
            }
            formData.append('existingPhotos', JSON.stringify(existingPhotos));

            if (editingEntry) {
                const response = await journalService.update(editingEntry._id, formData);
                if (response.data.success) {
                    setEntries(entries.map(e => e._id === editingEntry._id ? response.data.data : e));
                }
            } else {
                const response = await journalService.create(formData);
                if (response.data.success) {
                    setEntries([response.data.data, ...entries]);
                }
            }
            setShowForm(false);
            setEditingEntry(null);
        } catch (err) {
            console.error('Failed to save fold:', err.response?.data || err.message || err);
            alert('Failed to save: ' + (err.response?.data?.message || err.message || 'Unknown error'));
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

    const handleReminderSave = async (reminderData) => {
        try {
            await reminderService.create({
                ...reminderData,
                date: selectedDate || new Date().toISOString().slice(0, 10),
            });
            setShowReminderForm(false);
            // Trigger a calendar refresh by dispatching a custom event
            window.dispatchEvent(new Event('reminder-changed'));
        } catch (err) {
            console.error('Failed to create reminder:', err);
        }
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
                            onClick={() => setViewingEntry(entry)}
                        >
                            {hasImage && (
                                <img
                                    src={entry.photos[0].url}
                                    alt={entry.photos[0].caption || 'Photo'}
                                    className="entry-card-image"
                                    loading="lazy"
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

            {/* FAB Menu */}
            <div
                className={`fab-container ${fabOpen ? 'fab-open' : ''}`}
                onMouseEnter={() => setFabOpen(true)}
                onMouseLeave={() => setFabOpen(false)}
            >
                {/* Main FAB - renders first, appears at bottom due to column-reverse */}
                <button className="fab" title="Create">
                    <Plus size={24} />
                </button>

                {/* Mini action buttons - fan out above */}
                <button
                    className="fab-mini fab-mini-fold"
                    onClick={() => { setEditingEntry(null); setShowForm(true); setFabOpen(false); }}
                    title="New Fold"
                >
                    <FileText size={18} />
                </button>
                <button
                    className="fab-mini fab-mini-reminder"
                    onClick={() => { setShowReminderForm(true); setFabOpen(false); }}
                    title="New Reminder"
                >
                    <Bell size={18} />
                </button>
            </div>

            {/* Add/Edit Journal Modal */}
            {showForm && (
                <EntryFormModal
                    entry={editingEntry}
                    onSave={handleSave}
                    onDelete={editingEntry ? () => { handleDelete(editingEntry._id); setShowForm(false); setEditingEntry(null); } : null}
                    onClose={() => { setShowForm(false); setEditingEntry(null); }}
                />
            )}

            {/* View Entry Detail Modal */}
            {viewingEntry && (
                <EntryDetailView
                    entry={viewingEntry}
                    onEdit={() => { setEditingEntry(viewingEntry); setViewingEntry(null); setShowForm(true); }}
                    onDelete={() => { handleDelete(viewingEntry._id); setViewingEntry(null); }}
                    onClose={() => setViewingEntry(null)}
                />
            )}

            {/* Reminder Modal */}
            {showReminderForm && (
                <ReminderFormModal
                    selectedDate={selectedDate}
                    onSave={handleReminderSave}
                    onClose={() => setShowReminderForm(false)}
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
            // Store the actual file for FormData upload, and generate a local URL for the preview
            setPhotos((prev) => [...prev, { url: URL.createObjectURL(file), caption: '', file: file }]);
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

// ---- Reminder Form Modal ----
const ReminderFormModal = ({ selectedDate, onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [recurring, setRecurring] = useState('none');

    const dateObj = selectedDate ? new Date(selectedDate) : new Date();
    const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ title, time, notes, recurring });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bell size={20} /> New Reminder
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{
                    background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8,
                    padding: '8px 12px', marginBottom: 16, fontSize: '0.85rem', color: '#f9a825',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    📅 {displayDate}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="ws-form-group">
                        <label className="ws-label">What do you need to remember?</label>
                        <input
                            type="text"
                            className="ws-input"
                            placeholder="e.g., Doctor appointment, Submit assignment..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">Time (optional)</label>
                        <input
                            type="time"
                            className="ws-input"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">Repeat</label>
                        <select
                            className="ws-select"
                            value={recurring}
                            onChange={(e) => setRecurring(e.target.value)}
                        >
                            <option value="none">Does not repeat</option>
                            <option value="daily">Every day</option>
                            <option value="weekly">Every week</option>
                            <option value="monthly">Every month</option>
                            <option value="yearly">Every year</option>
                        </select>
                    </div>

                    <div className="ws-form-group">
                        <label className="ws-label">Notes (optional)</label>
                        <textarea
                            className="ws-textarea"
                            placeholder="Any extra details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="ws-btn-row">
                        <button type="button" className="ws-btn ws-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="ws-btn ws-btn-primary">
                            Set Reminder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ---- Entry Detail View (Read-Only) ----
const EntryDetailView = ({ entry, onEdit, onDelete, onClose }) => {
    const MoodInfo = MOOD_ICONS[entry.mood] || MOOD_ICONS.neutral;
    const MoodIcon = MoodInfo.icon;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header Actions */}
                <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
                    <button onClick={onEdit} className="icon-button" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} title="Edit">
                        <Edit size={18} color="#1a1a1a" />
                    </button>
                    <button onClick={() => { if(window.confirm('Delete this fold?')) onDelete(); }} className="icon-button" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} title="Delete">
                        <Trash2 size={18} color="#e53935" />
                    </button>
                    <button onClick={onClose} className="icon-button" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} title="Close">
                        <X size={18} color="#1a1a1a" />
                    </button>
                </div>

                {/* Hero Image */}
                {entry.photos && entry.photos.length > 0 && (
                    <div style={{ width: '100%', height: '350px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #eee' }}>
                        <img 
                            src={entry.photos[0].url} 
                            alt={entry.photos[0].caption || 'Entry photo'} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                    </div>
                )}

                <div style={{ padding: '24px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a1a1a', margin: 0, flex: 1 }}>{entry.title || 'Untitled Fold'}</h2>
                        <span className="mood-badge" style={{ color: MoodInfo.color, fontSize: '0.85rem', padding: '4px 12px', background: `${MoodInfo.color}15`, marginTop: 4, marginLeft: 16 }}>
                            <MoodIcon size={16} /> {MoodInfo.label}
                        </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: 24, display: 'flex', gap: 16 }}>
                        <span>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        {entry.tags && entry.tags.length > 0 && (
                            <span style={{ color: '#4a3d8f' }}>{entry.tags.map(t => `#${t}`).join(' ')}</span>
                        )}
                    </div>

                    <div style={{ fontSize: '1.1rem', color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {entry.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JournalPage;
