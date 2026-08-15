import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Destino do `redirectTo` do signInWithOAuth.
 *
 * No fluxo PKCE o provedor devolve `?code=` nesta URL. O supabase-js troca esse
 * code por sessão sozinho durante a inicialização do client (detectSessionInUrl,
 * ligado por padrão) — por isso aqui não chamamos exchangeCodeForSession: o code
 * é de uso único e a segunda troca falharia.
 *
 * Esta página só aguarda o resultado dessa troca e encaminha o usuário.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;

    const finish = (path: string) => {
      if (done) return;
      done = true;
      navigate(path, { replace: true });
    };

    // O provedor sinaliza recusa/erro na própria query string.
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get("error_description") ?? params.get("error");
    if (providerError) {
      setError(providerError);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish("/");
    });

    // Cobre o caso da troca ja ter concluido antes deste efeito rodar.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish("/");
    });

    // Sem sessão e sem erro do provedor: normalmente URI de redirect divergente
    // entre GoTrue e Google Cloud Console, ou origem fora do GOTRUE_URI_ALLOW_LIST.
    const timeout = setTimeout(() => {
      if (!done) setError("Não foi possível concluir o login com o Google.");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-sm">
        {error ? (
          <>
            <h1 className="font-heading font-semibold text-foreground">Falha no login</h1>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="text-sm text-primary hover:underline"
            >
              Voltar ao login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Concluindo login…</p>
          </>
        )}
      </div>
    </div>
  );
}
