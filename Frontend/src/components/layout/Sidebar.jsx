import { NavLink } from 'react-router-dom';
import { BookOpen, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">F</div>

            <NavLink
                to="/"
                end
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title="Journal"
            >
                <BookOpen size={20} />
            </NavLink>

            <NavLink
                to="/people"
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title="People"
            >
                <Users size={20} />
            </NavLink>

            <div className="sidebar-spacer" />

            <button className="sidebar-item" onClick={logout} title="Log Out">
                <LogOut size={20} />
            </button>
        </nav>
    );
};

export default Sidebar;
