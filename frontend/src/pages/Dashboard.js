import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchAdminData();
        }
    }, [user]);

    const fetchAdminData = async () => {
        try {
            const usersRes = await api.get('/users');
            setUsers(usersRes.data);
            const logsRes = await api.get('/users/logs');
            setLogs(logsRes.data);
        } catch (err) {
            console.error('Error fetching admin data', err);
        }
    };

    const changeRole = async (id, newRole) => {
        try {
            await api.patch(`/users/${id}/role`, { role: newRole });
            fetchAdminData();
        } catch (err) {
            alert('Error changing role');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Dashboard</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <button onClick={handleLogout}>Logout</button>

            <hr />
            
            {user.role === 'admin' && (
                <div>
                    <h3>Admin Area</h3>
                    <h4>Users</h4>
                    <ul>
                        {users.map(u => (
                            <li key={u.id} style={{ marginBottom: '10px' }}>
                                {u.email} - Current Role: {u.role}
                                <select 
                                    value={u.role} 
                                    onChange={(e) => changeRole(u.id, e.target.value)} 
                                    style={{ marginLeft: '10px' }}
                                >
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </li>
                        ))}
                    </ul>
                    <h4>Login Logs</h4>
                    <ul>
                        {logs.map(log => (
                            <li key={log.id}>
                                {new Date(log.timestamp).toLocaleString()} - {log.email} - {log.method} - {log.status} - {log.ip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {user.role === 'manager' && (
                <div>
                    <h3>Manager Area</h3>
                    <p>Welcome to the manager dashboard! You can view high-level summaries here.</p>
                </div>
            )}

            {user.role === 'user' && (
                <div>
                    <h3>User Area</h3>
                    <p>Welcome to your personal user dashboard.</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;