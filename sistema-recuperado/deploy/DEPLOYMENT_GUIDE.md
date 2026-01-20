# 🚀 Guia de Deploy - Hostinger VPS

Este guia detalha o processo de deployment do sistema para a Hostinger VPS.

## Arquivos de Configuração Criados

| Arquivo | Propósito |
|---------|-----------|
| `ecosystem.config.js` | Configuração PM2 para gerenciar processo |
| `.env.production.example` | Template de variáveis de ambiente |
| `deploy/nginx.conf` | Configuração Nginx reverse proxy |
| `deploy/deploy.sh` | Script de deploy automatizado |
| `deploy/setup-vps.sh` | Script de setup inicial do VPS |

---

## 📋 Passo a Passo

### 1. Configurar Subdomínio na Hostinger

1. Acesse o painel da Hostinger
2. Vá em **DNS Zone** ou **Subdomínios**
3. Crie um registro **A** apontando para o IP do seu VPS:
   ```
   Tipo: A
   Nome: app (ou seu subdomínio)
   Valor: IP_DO_SEU_VPS
   TTL: 3600
   ```

### 2. Conectar ao VPS via SSH

```bash
ssh root@SEU_IP_VPS
```

### 3. Executar Setup Inicial (apenas uma vez)

```bash
# Baixar script de setup
curl -O https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/deploy/setup-vps.sh

# Dar permissão e executar
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

**OU executar manualmente:**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx e Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Configurar firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 4. Clonar/Transferir Código

**Opção A - Via Git:**
```bash
mkdir -p /var/www
cd /var/www
git clone YOUR_REPO_URL sistema-recuperado
cd sistema-recuperado
```

**Opção B - Via SCP (do seu PC):**
```bash
# No seu computador local:
cd c:\Users\edugu\Downloads\Area-de-membros2\sistema-recuperado
scp -r . root@SEU_IP_VPS:/var/www/sistema-recuperado
```

### 5. Configurar Variáveis de Ambiente

```bash
cd /var/www/sistema-recuperado

# Criar arquivo de ambiente de produção
cp .env.production.example .env.production

# Editar com suas chaves reais
nano .env.production
```

**Conteúdo do .env.production:**
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://uoyhemfwkddlulmkvfci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
NEXT_PUBLIC_APP_URL=https://seu-subdominio.com.br
```

### 6. Build e Start

```bash
cd /var/www/sistema-recuperado

# Instalar dependências
npm ci

# Build para produção
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2 para auto-start
pm2 save
pm2 startup
```

### 7. Configurar Nginx

```bash
# Copiar configuração
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sistema-recuperado

# Editar para seu subdomínio
sudo nano /etc/nginx/sites-available/sistema-recuperado
# Substituir SEU_SUBDOMINIO.COM.BR pelo seu domínio real

# Ativar configuração
sudo ln -s /etc/nginx/sites-available/sistema-recuperado /etc/nginx/sites-enabled/

# Remover config padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 8. Configurar SSL

```bash
sudo certbot --nginx -d seu-subdominio.com.br
```

Siga as instruções do Certbot para obter o certificado SSL gratuito.

---

## 🔄 Atualizações Futuras

Para fazer deploy de novas versões:

```bash
cd /var/www/sistema-recuperado
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Ou manualmente:
```bash
git pull origin main
npm ci
npm run build
pm2 reload sistema-recuperado
```

---

## 🔍 Comandos Úteis

```bash
# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs sistema-recuperado

# Reiniciar aplicação
pm2 restart sistema-recuperado

# Ver uso de memória/CPU
pm2 monit

# Recarregar Nginx
sudo systemctl reload nginx

# Ver logs do Nginx
sudo tail -f /var/log/nginx/sistema-recuperado-access.log
sudo tail -f /var/log/nginx/sistema-recuperado-error.log
```

---

## ⚠️ Troubleshooting

### Aplicação não inicia
```bash
pm2 logs sistema-recuperado --lines 50
```

### Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar porta
curl http://localhost:5000
```

### Certificado SSL expirado
```bash
sudo certbot renew
```

### Memória insuficiente
```bash
# Ver uso de memória
free -h

# Reiniciar PM2 para liberar memória
pm2 restart all
```
