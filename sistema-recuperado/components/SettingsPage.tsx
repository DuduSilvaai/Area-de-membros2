'use client';

import React, { useState } from 'react';
import {
  User,
  Lock,
  CreditCard,
  Mail,
  Check,
  X,
  Camera,
  Save
} from 'lucide-react';
import { Button } from '@/components/UIComponents';
import { Input } from '@/components/UIComponents';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: 'João Silva',
    email: 'joao@empresa.com',
    avatar: '/avatars/joao.jpg'
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Perfil atualizado com sucesso!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Senha alterada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Lock },
    { id: 'billing', label: 'Assinatura', icon: CreditCard }
  ];

  return (
    <div style={{ maxWidth: '896px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Configurações</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Gerencie suas preferências e configurações de conta</p>

      {/* Premium Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <nav style={{ display: 'flex', gap: '32px', marginBottom: '-1px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 4px',
                  borderBottom: isActive ? '2px solid var(--primary-main)' : '2px solid transparent',
                  color: isActive ? 'var(--primary-main)' : 'var(--text-secondary)',
                  fontWeight: '500',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            border: '1px solid var(--border-color)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>Informações do Perfil</h2>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '24px' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      height: '96px',
                      width: '96px',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-hover) 100%)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User style={{ width: '48px', height: '48px', color: 'var(--text-on-primary)' }} />
                      )}
                    </div>
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        right: '-8px',
                        backgroundColor: 'var(--bg-surface)',
                        padding: '8px',
                        borderRadius: 'var(--radius-full)',
                        boxShadow: 'var(--shadow-medium)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                      title="Alterar foto"
                    >
                      <Camera style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Nome
                    </label>
                    <input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-canvas)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        transition: 'border-color 0.2s ease',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-canvas)',
                        color: 'var(--text-disabled)',
                        fontSize: '14px',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary">
                  <Save style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Salvar alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            border: '1px solid var(--border-color)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>Alterar Senha</h2>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Senha Atual
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nova Senha
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirmar Nova Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ paddingTop: '8px' }}>
                <Button type="submit" variant="primary">
                  Alterar Senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            border: '1px solid var(--border-color)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>Plano Atual</h2>

            <div style={{
              backgroundColor: 'var(--bg-canvas)',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Plano Empresarial</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>R$ 199,90/mês</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-disabled)', marginTop: '8px' }}>Próximo vencimento: 10/12/2023</p>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(46, 204, 113, 0.15)',
                  color: 'var(--status-success)',
                }}>
                  Ativo
                </span>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recursos Incluídos</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Até 50 usuários',
                    '100GB de armazenamento',
                    'Suporte prioritário',
                    'Backup diário',
                    'Domínio personalizado'
                  ].map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Check style={{ width: '20px', height: '20px', color: 'var(--status-success)', marginRight: '8px', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Método de Pagamento</h3>

              <div style={{
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    height: '40px',
                    width: '64px',
                    backgroundColor: 'var(--primary-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                  }}>
                    <CreditCard style={{ width: '20px', height: '20px', color: 'var(--primary-main)' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Cartão de Crédito</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Terminado em 4242</p>
                  </div>
                </div>
                <Button variant="outline">Alterar</Button>
              </div>
            </div>

            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Histórico de Faturas</h3>

              <div style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-canvas)' }}>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { date: '10/11/2023', description: 'Assinatura Mensal', amount: 'R$ 199,90', status: 'Pago' },
                      { date: '10/10/2023', description: 'Assinatura Mensal', amount: 'R$ 199,90', status: 'Pago' },
                      { date: '10/09/2023', description: 'Assinatura Mensal', amount: 'R$ 199,90', status: 'Pago' },
                    ].map((invoice, index) => (
                      <tr key={index} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-primary)' }}>{invoice.date}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{invoice.description}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{invoice.amount}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            padding: '4px 10px',
                            display: 'inline-flex',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(46, 204, 113, 0.15)',
                            color: 'var(--status-success)',
                          }}>
                            {invoice.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <a href="#" style={{ color: 'var(--primary-main)', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>Ver recibo</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;