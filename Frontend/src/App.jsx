import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Sidebar from './components/layout/Sidebar';
import CalendarPanel from './components/layout/CalendarPanel';
import JournalPage from './pages/journal/JournalPage';
import ConnectionsPage from './pages/connections/ConnectionsPage';
import './components/layout/WorkspaceLayout.css';
import './components/layout/CalendarPanel.css';

// The 3-panel workspace shell
const Workspace = ({ children }) => {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().slice(0, 10) // Today as "YYYY-MM-DD"
    );

    return (
        <div className="workspace">
            <Sidebar />
            <main className="main-panel">
                <Routes>
                    <Route
                        path="/"
                        element={<JournalPage selectedDate={selectedDate} />}
                    />
                    <Route path="/people" element={<ConnectionsPage />} />
                </Routes>
            </main>
            <CalendarPanel
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
            />
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/*" element={<Workspace />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
