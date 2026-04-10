// Serviço de processamento de transcrições de TikTok via Ollama

import { ollamaGenerate, DEFAULT_TRANSCRIPTION_MODEL } from './ollamaService';
import { TranscriptionSkillInput, SkillExecutionResult } from '@/types/transcription';

// ============================================================
// SKILL 1: Extrator de Insights
// ============================================================
export const extractInsights = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult> => {
  const start = Date.now();
  try {
    const prompt = `Leia CUIDADOSAMENTE esta transcrição de vídeo TikTok e extraia 3-5 insights REAIS e específicos do conteúdo:

TEMA: "${input.subject}"
CRIADOR: "${input.criador}"
TRANSCRIÇÃO:
"${input.transcricao}"

REQUISITOS:
- Insights devem ser ESPECÍFICOS (não genéricos como "Insight 1, Insight 2")
- Devem vir diretamente do conteúdo real do vídeo
- Máximo 100 caracteres cada insight
- Formato JSON: {"insights": ["insight1", "insight2", ...]}

EXEMPLO DE BOM INSIGHT: "Ferramentas de IA como Claude podem aumentar produtividade em 40%"
EXEMPLO DE RUIM INSIGHT: "Insight 1"

Responda APENAS com o JSON, sem explicação adicional.`;

    const raw = await ollamaGenerate({ model, prompt });
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');
    return { skill: 'Extrator de Insights', output: json, model, execution_ms: Date.now() - start, success: true };
  } catch (err: any) {
    return { skill: 'Extrator de Insights', output: null, model, execution_ms: Date.now() - start, success: false, error: err.message };
  }
};

// ============================================================
// SKILL 2: Classificador de Conteúdo
// ============================================================
export const classifyContent = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult> => {
  const start = Date.now();
  try {
    const prompt = `Classifique CORRETAMENTE esta transcrição em UMA categoria principal baseado no conteúdo REAL:

TEMA: "${input.subject}"
TRANSCRIÇÃO: "${input.transcricao.substring(0, 500)}"

Categorias válidas:
- educational (tutorial, dica, aprendizado)
- entertainment (diversão, humor, entretenimento)
- sales (venda, promoção, CTA forte)
- news (notícia, análise, informação)
- tutorial (passo a passo, how-to)
- opinion (opinião, crítica, análise pessoal)
- tool_review (análise de ferramenta, demo)
- lifestyle (lifestyle, bem-estar, rotina)
- other

Responda APENAS a categoria em minúsculas, sem pontuação.
EXEMPLO: educational`;

    const raw = await ollamaGenerate({ model, prompt });
    const categoria = raw.toLowerCase().trim().split(/[\s,\.\!]/)[0];
    const valido = ['educational', 'entertainment', 'sales', 'news', 'tutorial', 'opinion', 'tool_review', 'lifestyle', 'other'];
    return { 
      skill: 'Classificador de Conteúdo', 
      output: { categoria: valido.includes(categoria) ? categoria : 'other', confianca: 0.85 }, 
      model, 
      execution_ms: Date.now() - start, 
      success: true 
    };
  } catch (err: any) {
    return { skill: 'Classificador de Conteúdo', output: null, model, execution_ms: Date.now() - start, success: false, error: err.message };
  }
};

// ============================================================
// SKILL 3: Gerador de Tags
// ============================================================
export const generateTags = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult> => {
  const start = Date.now();
  try {
    const prompt = `Gere 6-8 hashtags REAIS baseadas no conteúdo ESPECÍFICO deste vídeo TikTok:

TEMA: "${input.subject}"
CONTEÚDO: "${input.transcricao.substring(0, 400)}"

REQUISITOS:
- Tags relevantes ao assunto REAL do vídeo
- Sem espaços, começando com #
- Português ou inglês (conforme conteúdo)
- Mix de hashtags populares (#ia, #tiktok) e específicas
- Formato JSON: {"hashtags": ["#tag1", "#tag2", ...]}

EXEMPLO BOM: ["#claudeai", "#automacao", "#ia", "#tiktok", "#produtividade"]
EXEMPLO RUIM: ["#tag1", "#tag2"]

Responda APENAS com JSON.`;

    const raw = await ollamaGenerate({ model, prompt });
    const json = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || '[]');
    return { skill: 'Gerador de Tags', output: { hashtags: Array.isArray(json) ? json : [] }, model, execution_ms: Date.now() - start, success: true };
  } catch (err: any) {
    return { skill: 'Gerador de Tags', output: null, model, execution_ms: Date.now() - start, success: false, error: err.message };
  }
};

// ============================================================
// SKILL 4: Resumidor de Vídeo
// ============================================================
export const summarizeVideo = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult> => {
  const start = Date.now();
  try {
    const prompt = `Resuma este vídeo TikTok em 1-2 frases (máximo 150 caracteres) de forma CLARA e OBJETIVA:

TEMA: "${input.subject}"
CRIADOR: "${input.criador}"
CONTEÚDO: "${input.transcricao.substring(0, 800)}"

REQUISITOS:
- Ser ESPECÍFICO ao conteúdo real (não genérico)
- 1-2 frases apenas
- Máximo 150 caracteres
- Responder APENAS o resumo, sem aspas ou markdown

EXEMPLO: "Aprenda a usar Claude para criar posts de Instagram em 2 minutos com IA"`;

    const raw = await ollamaGenerate({ model, prompt });
    const resumo = raw.trim().substring(0, 150).replace(/^["']|["']$/g, '');
    return { skill: 'Resumidor de Vídeo', output: { resumo }, model, execution_ms: Date.now() - start, success: true };
  } catch (err: any) {
    return { skill: 'Resumidor de Vídeo', output: null, model, execution_ms: Date.now() - start, success: false, error: err.message };
  }
};

// ============================================================
// SKILL 5: Extrator de CTAs
// ============================================================
export const extractCTAs = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult> => {
  const start = Date.now();
  try {
    const prompt = `Extraia TODOS os call-to-actions (CTAs) específicos e explícitos deste vídeo:

TRANSCRIÇÃO:
"${input.transcricao}"

CTAs são frases como:
- "comenta X"
- "me segue"
- "clica no link"
- "ativa notificação"
- "compartilha"
- "assiste até o final"
- "coloca um like"

Formato JSON: ["cta1", "cta2", ...]
Se não tiver CTA claro, retorne: []
Responda APENAS com JSON.`;

    const raw = await ollamaGenerate({ model, prompt });
    const ctas = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || '[]');
    return { skill: 'Extrator de CTAs', output: { ctas: Array.isArray(ctas) ? ctas : [] }, model, execution_ms: Date.now() - start, success: true };
  } catch (err: any) {
    return { skill: 'Extrator de CTAs', output: null, model, execution_ms: Date.now() - start, success: false, error: err.message };
  }
};

// ============================================================
// SKILL 6: Detector de Trending Topics
// ============================================================
export const detectTrendingTopics = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult> => {
  const start = Date.now();
  try {
    const prompt = `Identifique tópicos TRENDING e tendências presentes nesta transcrição (2025-2026):

TRANSCRIÇÃO:
"${input.transcricao}"

Tópicos em alta em 2025-2026: IA, Claude, ChatGPT, automatização, Gemini, agentes de IA, prompting, RAG, embeddings, etc.

Formato JSON: ["topico1", "topico2", ...]
Máximo 4 tópicos.
Se não houver tópicos trending, retorne: []
Responda APENAS com JSON.`;

    const raw = await ollamaGenerate({ model, prompt });
    const topicos = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || '[]');
    return { skill: 'Detector de Trending Topics', output: { topicos: Array.isArray(topicos) ? topicos : [] }, model, execution_ms: Date.now() - start, success: true };
  } catch (err: any) {
    return { skill: 'Detector de Trending Topics', output: null, model, execution_ms: Date.now() - start, success: false, error: err.message };
  }
};

// ============================================================
// SKILL 7: Gerador de Scripts
// ============================================================
export const generateScript = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult> => {
  const start = Date.now();
  try {
    const prompt = `Crie um SCRIPT CURTO (50-80 palavras) otimizado para TikTok baseado neste conteúdo:

TEMA: "${input.subject}"
CRIADOR: "${input.criador}"
CONTEÚDO: "${input.transcricao.substring(0, 400)}"

REQUISITOS:
- Hook forte (primeiros 5 segundos)
- Tom casual e direto
- CTA clara no final
- Pronto para gravar com a mão ou câmera
- 50-80 palavras exatamente
- Responda APENAS o script, sem formatação extra

EXEMPLO:
"E aí! Você sabia que Claude consegue fazer em 2 minutos o que você levaria 1 hora?
Assista como funciona... [pausa visual]
Me segue para mais dicas de IA!"`;

    const raw = await ollamaGenerate({ model, prompt });
    const script = raw.trim().substring(0, 250).replace(/^["'\n]+|["'\n]+$/g, '');
    return { skill: 'Gerador de Scripts', output: { script }, model, execution_ms: Date.now() - start, success: true };
  } catch (err: any) {
    return { skill: 'Gerador de Scripts', output: null, model, execution_ms: Date.now() - start, success: false, error: err.message };
  }
};

// Executa todas as 7 skills em uma transcrição
export const processAllSkills = async (
  input: TranscriptionSkillInput,
  model = DEFAULT_TRANSCRIPTION_MODEL
): Promise<SkillExecutionResult[]> => {
  const results = await Promise.allSettled([
    extractInsights(input, model),
    classifyContent(input, model),
    generateTags(input, model),
    summarizeVideo(input, model),
    extractCTAs(input, model),
    detectTrendingTopics(input, model),
    generateScript(input, model),
  ]);

  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : { skill: 'unknown', output: null, model, execution_ms: 0, success: false, error: String(r.reason) }
  );
};
