
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-12 glass rounded-none shadow-2xl mt-20 text-center">
            <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-widest">
                {isSignUp ? 'Unirse al Círculo' : 'Acceso Miembro'}
            </h2>
            <p className="text-neutral-400 mb-8 text-sm tracking-wide">Ingresa tus credenciales de acceso.</p>

            <form onSubmit={handleAuth} className="space-y-8 text-left">
                <div className="group">
                    <label className="block text-xs font-bold text-[var(--brand-secondary)] uppercase tracking-[0.2em] mb-2 group-focus-within:text-[var(--brand-accent)] transition-colors">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full py-3 bg-transparent border-b border-white/20 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
                        placeholder="tu@email.com"
                        required
                    />
                </div>
                <div className="group">
                    <label className="block text-xs font-bold text-[var(--brand-secondary)] uppercase tracking-[0.2em] mb-2 group-focus-within:text-[var(--brand-accent)] transition-colors">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full py-3 bg-transparent border-b border-white/20 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    disabled={loading}
                    className="btn-primary w-full disabled:opacity-50"
                >
                    {loading ? 'Procesando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-neutral-500 hover:text-white uppercase tracking-widest transition-colors"
                >
                    {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Registrate'}
                </button>
            </div>
        </div>
    );
};
