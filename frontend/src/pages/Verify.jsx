// frontend/src/pages/Verify.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Verify.css';

export default function Verify() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setError('Invalid verification link');
            setLoading(false);
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.verifyUser(token);
                if (response.success) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('role', response.budgeter.role);
                    localStorage.setItem('email', response.budgeter.email);
                    setMessage('✅ Email verified successfully! Redirecting...');
                    setTimeout(() => {
                        navigate(response.budgeter.role === 'admin' ? '/admin' : '/dashboard');
                    }, 3000);
                }
            } catch (err) {
                setError(err.message || 'Verification failed. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="verify-container">
            <div className="verify-card">
                <h1>🔐 Email Verification</h1>
                {loading && <p>Verifying your email...</p>}
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !message && !error && (
                    <button onClick={() => navigate('/auth')}>Go to Login</button>
                )}
            </div>
        </div>
    );
}