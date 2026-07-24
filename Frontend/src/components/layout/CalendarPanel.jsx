import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { calendarService } from '../../services/api';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const CalendarPanel = ({ selectedDate, onDateSelect }) => {
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [calendarMap, setCalendarMap] = useState({});

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const { data } = await calendarService.getMonth(viewMonth + 1, viewYear);
                if (data.success) {
                    setCalendarMap(data.data.calendarMap);
                }
            } catch (err) {
                console.error('Failed to fetch calendar:', err);
            }
        };
        fetchCalendar();
    }, [viewMonth, viewYear]);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    const goToToday = () => {
        const now = new Date();
        setViewMonth(now.getMonth());
        setViewYear(now.getFullYear());
        const dateStr = now.toISOString().slice(0, 10);
        onDateSelect(dateStr);
    };

    const handleDayClick = (day) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onDateSelect(dateStr);
    };

    const isToday = (day) => {
        return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        const sel = new Date(selectedDate);
        return day === sel.getDate() && viewMonth === sel.getMonth() && viewYear === sel.getFullYear();
    };

    const getDayData = (day) => {
        const dayData = calendarMap[day];
        if (!dayData) return { journal: [], reminders: [], birthdays: [] };
        return {
            journal: dayData.journal || [],
            reminders: dayData.reminders || [],
            birthdays: dayData.birthdays || [],
        };
    };

    // Get selected day's events for the detail section
    const selectedDayNum = selectedDate ? new Date(selectedDate).getDate() : today.getDate();
    const selectedDayInView = selectedDate
        ? new Date(selectedDate).getMonth() === viewMonth && new Date(selectedDate).getFullYear() === viewYear
        : viewMonth === today.getMonth() && viewYear === today.getFullYear();
    const selectedDayData = selectedDayInView ? getDayData(selectedDayNum) : { journal: [], reminders: [], birthdays: [] };

    const isViewingCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

    // Build grid cells
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push(<div key={`empty-${i}`} className="cal-cell cal-empty" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayData = getDayData(day);
        const todayClass = isToday(day) ? 'cal-today' : '';
        const selectedClass = isSelected(day) ? 'cal-selected' : '';
        const hasAny = dayData.journal.length > 0 || dayData.reminders.length > 0 || dayData.birthdays.length > 0;

        cells.push(
            <button key={day} className={`cal-cell cal-day ${todayClass} ${selectedClass}`} onClick={() => handleDayClick(day)}>
                <span className="cal-day-number">{day}</span>
                {hasAny && (
                    <div className="cal-dots">
                        {dayData.journal.length > 0 && <span className="cal-dot cal-dot-journal" />}
                        {dayData.reminders.length > 0 && <span className="cal-dot cal-dot-reminder" />}
                        {dayData.birthdays.length > 0 && <span className="cal-dot cal-dot-birthday" />}
                    </div>
                )}
            </button>
        );
    }

    // Format the today banner
    const todayFormatted = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div className="calendar-panel">
            {/* Today Banner */}
            <button className="cal-today-banner" onClick={goToToday}>
                <CalendarDays size={16} />
                <div>
                    <div className="cal-today-day">{dayOfWeek}</div>
                    <div className="cal-today-date">{todayFormatted}</div>
                </div>
            </button>

            {/* Month Navigation */}
            <div className="cal-header">
                <button className="cal-nav" onClick={prevMonth}><ChevronLeft size={18} /></button>
                <span className="cal-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button className="cal-nav" onClick={nextMonth}><ChevronRight size={18} /></button>
            </div>

            {/* Grid */}
            <div className="cal-grid">
                {DAYS.map((d, i) => (
                    <div key={i} className="cal-cell cal-weekday">{d}</div>
                ))}
                {cells}
            </div>

            {/* Legend */}
            <div className="cal-legend">
                <span className="cal-legend-item"><span className="cal-dot cal-dot-journal" /> Journal</span>
                <span className="cal-legend-item"><span className="cal-dot cal-dot-reminder" /> Reminder</span>
                <span className="cal-legend-item"><span className="cal-dot cal-dot-birthday" /> Birthday</span>
            </div>

            {/* Selected Day Events */}
            {selectedDayInView && (
                <div className="cal-events">
                    <div className="cal-events-title">
                        {selectedDate
                            ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Today'}
                    </div>

                    {selectedDayData.birthdays.map((b, i) => (
                        <div key={`b-${i}`} className="cal-event-item cal-event-birthday">
                            🎂 {b.title}
                        </div>
                    ))}
                    {selectedDayData.reminders.map((r, i) => (
                        <div key={`r-${i}`} className="cal-event-item cal-event-reminder">
                            🔔 {r.title}
                        </div>
                    ))}
                    {selectedDayData.journal.map((j, i) => (
                        <div key={`j-${i}`} className="cal-event-item cal-event-journal">
                            📝 {j.title || 'Journal entry'}
                        </div>
                    ))}

                    {selectedDayData.journal.length === 0 && selectedDayData.reminders.length === 0 && selectedDayData.birthdays.length === 0 && (
                        <div className="cal-event-item" style={{ color: '#bbb', fontStyle: 'italic' }}>
                            No events
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CalendarPanel;
