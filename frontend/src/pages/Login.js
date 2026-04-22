import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            alert('Login failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleKeycloak = () => {
        window.location.href = 'http://localhost:8080/realms/auth-dashboard/protocol/openid-connect/auth?client_id=auth-dashboard-client&redirect_uri=http://localhost:3000/dashboard&response_type=code&scope=openid';
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <button onClick={handleKeycloak} style={{ marginTop: '10px', display: 'block' }}>
                Login with Keycloak
            </button>
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
    );
}

export default Login;