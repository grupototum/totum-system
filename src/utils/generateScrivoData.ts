/**
 * Gerador de dados para SCRIVO (agente de copywriting/scripts)
 * Transforma dados de transcrição em prompts otimizados para geração de copy
 */

import { TranscriptionResult } from './generateWandaData';

export interface ScrivoPrompt {
  id: string;
  subject: string;
  creator: string;
  originalScript: string;
  optimizedScript: string;
  ctas: string[];
  toneOfVoice: 'casual' | 'informativo' | 'professionalassertivo' | 'emotional';
  targetAudience: string;
  promptForScrivo: string;
  timestamp: string;
}

/**
 * Converte resultado de transcrição em prompt para SCRIVO
 */
export function convertToScrivoPrompt(result: TranscriptionResult): ScrivoPrompt {
  const ctas = result.ctas || ['me segue', 'compartilha'];
  const category = result.category || 'entertainment';
  
  const toneMap: Record<string, 'casual' | 'informativo' | 'professionalassertivo' | 'emotional'> = {
    educational: 'informativo',
    entertainment: 'casual',
    sales: 'professionalassertivo',
    news: 'informativo',
    tutorial: 'informativo',
    opinion: 'casual',
    tool_review: 'informativo',
    lifestyle: 'casual',
    other: 'casual',
  };

  const tone = toneMap[category] || 'casual';

  const prompt = `OTIMIZE este script TikTok para máximo engajamento:

TEMA: ${result.subject}
CRIADOR: ${result.criador}
SCRIPT ORIGINAL: "${result.transcricao.substring(0, 300)}..."

DADOS DO CONTEÚDO:
- Resumo: ${result.summary || result.transcricao.substring(0, 150)}
- CTAs: ${ctas.join(', ')}
- Tom: ${tone}

REQUISITOS DE SAÍDA:
1. Hook nos primeiros 2 segundos (máx 15 palavras)
2. Corpo do script (30-40 palavras) com elementos storytelling
3. CTA forte no final (10-15 palavras)
4. Emojis estratégicos
5. Notas de produção visual

Estilo: ${tone === 'casual' ? 'Conversa com amigo, natural' : tone === 'informativo' ? 'Educativo mas acessível' : 'Professionnalassertivo com autoridade'}

Responda em JSON com formato:
{
  "hook": "...",
  "body": "...",
  "cta": "...",
  "visualNotes": "...",
  "emojis": "...",
  "alternativeVersions": [...]
}`;

  return {
    id: result.id || result.subject.substring(0, 30),
    subject: result.subject,
    creator: result.criador,
    originalScript: result.transcricao.substring(0, 300),
    optimizedScript: result.script || '',
    ctas,
    toneOfVoice: tone,
    targetAudience: 'entrepreneurs, tech enthusiasts, business owners',
    promptForScrivo: prompt,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Gera lote de prompts para SCRIVO
 */
export function generateScrivoBatch(results: TranscriptionResult[]): ScrivoPrompt[] {
  return results
    .filter((r) => r.transcricao && r.subject)
    .map((r) => convertToScrivoPrompt(r));
}
