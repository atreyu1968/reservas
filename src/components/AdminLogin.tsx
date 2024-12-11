import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // En un entorno real, esto debería validarse contra el backend
    if (password === 'admin123') {
      onLogin(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-600 p-3 rounded-full">
          <Lock className="h-6 w-6 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Acceso Administrativo
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-600 focus:border-blue-600"
            placeholder="Ingrese la contraseña"
            required
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">
            Contraseña incorrecta
          </p>
        )}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}