import React, { useState } from 'react';
import './Auth.css';
import { generateRSAKeyPair, exportPublicKeyAsJWK } from './utils/cryptoUtils';
import { storePrivateKey } from './utils/indexedDBManager';

function Register({ onRegisterSuccess, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('Generating encryption keys...');

        try {
            console.log("Generating RSA key pair...");
            const keyPair = await generateRSAKeyPair();
            console.log("RSA key pair generated");

            const publicKeyJWK = await exportPublicKeyAsJWK(keyPair.publicKey);
            console.log("Public key exported");

            setMessage('Registering user...');
            
            const baseUrl = process.env.REACT_APP_API_URL;
            const response = await fetch(`${baseUrl}/api/register`, {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    publicKey: publicKeyJWK
                }),
            });

            const result = await response.text();

            if (response.ok) {
                setMessage('Storing encryption keys...');
                await storePrivateKey(keyPair.privateKey);
                console.log("Private key stored in IndexedDB");

                setMessage('Registration successful! Redirecting to login...');
                console.log("Registration successful!");

                setTimeout(() => {
                    onSwitchToLogin();
                }, 2000);
            } else {
                setMessage(result);
                console.error("Registration failed:", result);
            }
        } catch (error) {
            console.error("Registration error:", error);
            setMessage('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-box">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                    disabled={isLoading}
                />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    disabled={isLoading}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Register'}
                </button>
            </form>

            {message && <p className="message">{message}</p>}
            <p className="login-link">
                Already have an account?{" "}
                <span
                    onClick={onSwitchToLogin}
                    style={{ color: "#00aaff", cursor: "pointer", fontWeight: "bold" }}
                >
                    Login
                </span>
            </p>
        </div>
    );
}

export default Register;