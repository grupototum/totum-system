/**
 * TikTok OAuth - Get Access Token for @totum Account
 * 
 * Execute este script para autorizar a conta @totum:
 * node scripts/tiktok-oauth.mjs
 * 
 * Ele vai gerar um link de autorização. Copie, abra no navegador,
 * faça login com @totum, autorize, e o Access Token será exibido.
 */

import axios from 'axios';
import { config } from 'dotenv';
import https from 'https';
import { Server, createServer } from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env.local' });

const TIKTOK_CONFIG = {
  clientId: process.env.VITE_TIKTOK_CLIENT_ID,
  clientSecret: process.env.VITE_TIKTOK_CLIENT_SECRET,
  redirectUri: process.env.VITE_TIKTOK_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  mode: process.env.VITE_TIKTOK_MODE || 'sandbox',
};

const ENDPOINTS = {
  sandbox: {
    auth: 'https://sandbox.tiktok.com/v1/oauth/token',
    authorize: 'https://sandbox.tiktok.com/v1/oauth/authorize',
  },
  production: {
    auth: 'https://open-api.tiktok.com/v1/oauth/token',
    authorize: 'https://open-api.tiktok.com/v1/oauth/authorize',
  },
};

class TikTokOAuth {
  constructor(config) {
    this.config = config;
    this.endpoints = ENDPOINTS[config.mode];
    this.server = null;
    this.authorizationCode = null;
  }

  getAuthorizationUrl() {
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      response_type: 'code',
      scope: 'video.create,video.read,user.info.read,analytics.video.query',
      redirect_uri: this.config.redirectUri,
      state: 'security_token_' + Math.random().toString(36).substring(7),
    });

    return `${this.endpoints.authorize}?${params.toString()}`;
  }

  startCallbackServer() {
    return new Promise((resolve) => {
      const server = createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const code = parsedUrl.query.code;
        const error = parsedUrl.query.error;

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <h1>❌ Erro na Autorização</h1>
            <p>${error}: ${parsedUrl.query.error_description}</p>
            <p>Feche esta janela.</p>
          `);
          server.close();
          resolve(null);
          return;
        }

        if (code) {
          this.authorizationCode = code;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <h1>✅ Autorização Bem-sucedida!</h1>
            <p>Você autorizou a conta. Voltando ao terminal...</p>
            <script>window.close();</script>
          `);
          server.close();
          resolve(code);
        }
      });

      const PORT = 3000;
      server.listen(PORT, () => {
        console.log(`\n✅ Servidor de callback iniciado em http://localhost:${PORT}`);
        console.log(`   (aguardando autorização...)\n`);
      });

      this.server = server;
    });
  }

  async exchangeCodeForToken() {
    try {
      console.log('🔄 Trocando código por Access Token...\n');

      const response = await axios.post(this.endpoints.auth, {
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: this.authorizationCode,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao trocar código:', error.response?.data || error.message);
      throw error;
    }
  }

  async start() {
    console.log('🎬 TikTok OAuth Flow\n');
    console.log('═'.repeat(60));
    console.log('\n📋 Configuração:');
    console.log(`   Cliente ID: ${this.config.clientId.substring(0, 10)}...`);
    console.log(`   Modo: ${this.config.mode}`);
    console.log(`   Redirect URI: ${this.config.redirectUri}`);

    console.log('\n🔗 Link de Autorização:');
    const authUrl = this.getAuthorizationUrl();
    console.log(`\n${authUrl}\n`);
    console.log('👆 Copie o link acima e abra no navegador\n');

    // Start callback server
    const code = await this.startCallbackServer();

    if (!code) {
      console.log('❌ Autorização cancelada ou erro');
      process.exit(1);
    }

    // Exchange code for token
    try {
      const tokenData = await this.exchangeCodeForToken();

      console.log('\n✅ Access Token Obtido!\n');
      console.log('═'.repeat(60));
      console.log('\n📝 Copie isso no seu .env.local:\n');
      console.log(`VITE_TIKTOK_ACCESS_TOKEN=${tokenData.access_token}`);
      console.log('\n═'.repeat(60));

      console.log('\n💾 Guardando credenciais...');
      
      // Save to .env.local
      const envPath = '.env.local';
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /VITE_TIKTOK_ACCESS_TOKEN=.*/,
        `VITE_TIKTOK_ACCESS_TOKEN=${tokenData.access_token}`
      );
      fs.writeFileSync(envPath, envContent);

      console.log(`✅ Salvo em .env.local\n`);

      console.log('\n🎉 Próximo passo: Testar conexão');
      console.log('   node scripts/tiktok-api-test.mjs\n');

      // Save complete token info
      const tokenInfo = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        obtained_at: new Date().toISOString(),
      };

      fs.writeFileSync(
        'data/outputs/tiktok-auth.json',
        JSON.stringify(tokenInfo, null, 2)
      );

      console.log('📁 Token Info salvo em: data/outputs/tiktok-auth.json\n');

      process.exit(0);
    } catch (error) {
      console.error('\n❌ Erro geral:', error.message);
      process.exit(1);
    }
  }
}

// Main
if (!TIKTOK_CONFIG.clientId || !TIKTOK_CONFIG.clientSecret) {
  console.log('❌ Credenciais TikTok não configuradas\n');
  console.log('Verifique .env.local:');
  console.log('  - VITE_TIKTOK_CLIENT_ID');
  console.log('  - VITE_TIKTOK_CLIENT_SECRET\n');
  process.exit(1);
}

const oauth = new TikTokOAuth(TIKTOK_CONFIG);
oauth.start().catch(console.error);
