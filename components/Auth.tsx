
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
        <div className="max-w-md mx-auto p-12 bg-white rounded-[3rem] shadow-2xl border border-neutral-100 mt-20">
            <h2 className="text-3xl font-serif font-bold text-neutral-800 mb-2">
                {isSignUp ? 'Crea tu Cuenta' : 'Bienvenido de nuevo'}
            </h2>
            <p className="text-neutral-500 mb-8">Ingresa tus datos para acceder a Espejo-Neurosomatico.</p>

            <form onSubmit={handleAuth} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="tu@email.com"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                    {loading ? 'Procesando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-emerald-600 font-medium hover:underline"
                >
                    {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
            </div>
        </div>
    );
};
