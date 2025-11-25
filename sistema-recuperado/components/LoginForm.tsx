'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation'; // Importante: use navigation no App Router
import { LogIn, Lock, Mail } from 'lucide-react'; // Ícones
import { Button, Input } from './UIComponents'; // Reusando seus componentes

// --- SCHEMA DE VALIDAÇÃO ---
const loginSchema = yup.object().shape({
  email: yup.string().email('Digite um email válido').required('O email é obrigatório'),
  password: yup.string().required('A senha é obrigatória').min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });

  // --- FUNÇÃO DE LOGIN (Simulação) ---
  const handleLogin = async (data: any) => {
    setIsLoading(true);
    setLoginError('');
    
    console.log("Tentando logar com:", data);

    // Simula uma chamada ao servidor (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // AQUI VOCÊ VAI CONECTAR SUA API REAL DEPOIS
    // Por enquanto, vamos fingir que deu certo
    if (data.password === "123456") {
        // Sucesso
        alert("Login realizado com sucesso!");
        router.push('/'); // Redireciona para a Home (onde está o formulário de times)
    } else {
        // Erro
        setLoginError("Credenciais inválidas. Tente senha '123456'");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Acessar Mozart</h1>
        <p className="text-gray-500 mt-2">Entre com suas credenciais para continuar.</p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
        
        {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100">
                {loginError}
            </div>
        )}

        <div className="space-y-4">
            <Input 
                label="E-mail" 
                type="email" 
                placeholder="seu@email.com"
                {...register('email')}
                error={errors.email?.message}
            />
            
            <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
            />
        </div>

        <Button 
            type="submit" 
            className="w-full h-12 text-lg" 
            isLoading={isLoading}
        >
            <LogIn className="w-5 h-5" />
            Entrar no Sistema
        </Button>
      </form>

      {/* Rodapé / Links Extras */}
      <div className="mt-8 flex flex-col gap-3 text-center text-sm">
        <button 
            type="button"
            onClick={() => window.open("https://dash.ticto.com.br/remember")}
            className="text-blue-600 hover:underline font-medium"
        >
            Esqueci minha senha
        </button>
        
        <div className="text-gray-400">ou</div>
        
        <button 
            type="button"
            onClick={() => window.open("https://dash.ticto.com.br/signup")}
            className="text-gray-600 hover:text-black font-medium"
        >
            Criar uma nova conta
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">© 2025 Ticto Tecnologia. Protegido por reCAPTCHA.</p>
      </div>
    </div>
  );
}