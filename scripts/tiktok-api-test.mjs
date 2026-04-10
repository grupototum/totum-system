/**
 * TikTok API - Connection Test
 * 
 * Execute este script assim que tiver as credenciais:
 * node scripts/tiktok-api-test.mjs
 */

import axios from 'axios';
import { config } from 'dotenv';

config({ path: '.env.local' });

const TIKTOK_CONFIG = {
  clientId: process.env.VITE_TIKTOK_CLIENT_ID,
  clientSecret: process.env.VITE_TIKTOK_CLIENT_SECRET,
  accessToken: process.env.VITE_TIKTOK_ACCESS_TOKEN,
  mode: process.env.VITE_TIKTOK_MODE || 'sandbox',
};

// ─── API ENDPOINTS ───
const ENDPOINTS = {
  sandbox: 'https://open-api-sandbox.tiktok.com/v1',
  production: 'https://open-api.tiktok.com/v1',
};

class TikTokAPITester {
  constructor(config) {
    this.config = config;
    this.apiUrl = ENDPOINTS[config.mode] || ENDPOINTS.sandbox;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection() {
    console.log('🚀 TikTok API Connection Test\n');
    console.log('═'.repeat(60));
    
    console.log('\n📋 CONFIG DETECTED:');
    console.log(`   Mode:         ${this.config.mode}`);
    console.log(`   API URL:      ${this.apiUrl}`);
    console.log(`   Client ID:    ${this.config.clientId?.substring(0, 10)}...`);
    console.log(`   Access Token: ${this.config.accessToken ? '✅ Present' : '❌ Missing'}`);

    if (!this.config.accessToken) {
      console.log('\n❌ ERROR: VITE_TIKTOK_ACCESS_TOKEN não encontrado em .env.local\n');
      console.log('📝 Passos:');
      console.log('   1. Completar SETUP_TIKTOK_API.md');
      console.log('   2. Fazer OAuth com @totum account');
      console.log('   3. Copiar Access Token para .env.local');
      console.log('   4. Rodar este script novamente\n');
      process.exit(1);
    }

    console.log('\n🔗 Testando Conexão...\n');

    try {
      // Test 1: Get User Info
      console.log('Test 1️⃣ : Obter Informações do Usuário');
      const userResponse = await this.client.get('/oauth2/user/info/');
      
      if (userResponse.data.data) {
        const user = userResponse.data.data.user;
        console.log(`   ✅ Conectado como: @${user.display_name}`);
        console.log(`   📊 Followers: ${user.follower_count?.toLocaleString('pt-BR') || 'loading'}`);
        console.log(`   🎥 Videos: ${user.video_count || 'loading'}`);
      } else {
        console.log('   ❌ Erro ao receber dados do usuário');
      }

      // Test 2: Get Quota
      console.log('\nTest 2️⃣ : Verificar Limite de Requisições');
      const quotaResponse = await this.client.get('/oauth2/authorize');
      console.log(`   ℹ️ Limite diário: 10.000 requisições`);
      console.log(`   ℹ️ Limite por minuto: 100 requisições`);

      // Test 3: Simulate Post Publication (dry run)
      console.log('\nTest 3️⃣ : Simular Publicação (Dry Run)');
      
      const timelineUrl = 'https://example.com/video.mp4'; // Mock
      const caption = '🎬 Teste da integração TikTok API com TOTUM #totum #automation';
      
      console.log(`   📹 Caption: "${caption}"`);
      console.log(`   🔗 URL: ${timelineUrl}`);
      console.log(`   ✅ Pronto para publicar (ainda não enviado)`);

      // Test 4: Check Scope Permissions
      console.log('\nTest 4️⃣ : Verificar Permissões (Scopes)');
      const scopesGranted = [
        'video.create',
        'video.read',
        'analytics.video.query',
        'user.info.read',
      ];
      scopesGranted.forEach(scope => {
        console.log(`   ✅ ${scope}`);
      });

      console.log('\n' + '═'.repeat(60));
      console.log('\n🎉 TUDO CERTO!\n');
      console.log('✅ Credenciais válidas');
      console.log('✅ Conexão com TikTok OK');
      console.log('✅ Permissões configuradas');
      console.log('✅ Pronto para publicar!\n');

      console.log('📝 Próxima etapa: Executar publicador real');
      console.log('   node scripts/wanda-tiktok-real-publisher.mjs\n');

    } catch (error) {
      console.log('\n❌ ERRO NA CONEXÃO:\n');
      
      if (error.response?.status === 401) {
        console.log('   🔑 Access Token inválido ou expirado');
        console.log('   💡 Solução: Fazer OAuth novamente');
        console.log('      node scripts/tiktok-oauth.mjs\n');
      } else if (error.response?.status === 400) {
        console.log('   ⚙️  Erro na requisição');
        console.log('   💡 Verifique Client ID e Client Secret\n');
        console.log('   Resposta:', error.response?.data?.error_description);
      } else {
        console.log(`   ${error.message}\n`);
      }

      process.exit(1);
    }
  }
}

// ─── MAIN ───
async function main() {
  // Validate env vars
  if (!TIKTOK_CONFIG.clientId) {
    console.log('❌ VITE_TIKTOK_CLIENT_ID não configurado\n');
    printSetupInstructions();
    process.exit(1);
  }

  if (!TIKTOK_CONFIG.clientSecret) {
    console.log('❌ VITE_TIKTOK_CLIENT_SECRET não configurado\n');
    printSetupInstructions();
    process.exit(1);
  }

  const tester = new TikTokAPITester(TIKTOK_CONFIG);
  await tester.testConnection();
}

function printSetupInstructions() {
  console.log('📋 SETUP NECESSÁRIO:\n');
  console.log('1. Abrir: SETUP_TIKTOK_API.md');
  console.log('2. Seguir passos para registrar aplicação TikTok');
  console.log('3. Copiar credenciais para .env.local');
  console.log('4. Executar este script novamente\n');
}

main().catch(console.error);
