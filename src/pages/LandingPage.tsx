import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users,
  CheckSquare,
  DollarSign,
  BarChart3,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  Globe,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoWhite from "@/assets/logo-white.png";
import logoRed from "@/assets/logo-red.png";

const features = [
  {
    icon: Users,
    title: "CRM de Clientes",
    description: "Pipeline completo, histórico de interações e acompanhamento de cada cliente em um só lugar.",
  },
  {
    icon: CheckSquare,
    title: "Gestão de Tarefas",
    description: "Organize entregas por equipe, prazo e prioridade. Nunca perca um compromisso.",
  },
  {
    icon: DollarSign,
    title: "Financeiro Integrado",
    description: "Contratos, cobranças e lançamentos conectados ao Asaas. Receita previsível e visível.",
  },
  {
    icon: BarChart3,
    title: "Relatórios em Tempo Real",
    description: "Dashboard executivo com métricas de performance, churn e crescimento da agência.",
  },
  {
    icon: FileText,
    title: "Projetos & POPs",
    description: "Processos operacionais padronizados e projetos com checklist e cronograma.",
  },
  {
    icon: ShieldCheck,
    title: "Equipe & Permissões",
    description: "Controle de acesso por papel. Cada colaborador vê exatamente o que precisa.",
  },
];

const benefits = [
  { icon: Globe, text: "Multi-tenant — cada agência no seu próprio ambiente isolado" },
  { icon: Zap, text: "Integração nativa com Asaas para cobranças automáticas" },
  { icon: Layers, text: "Módulos independentes que crescem com a sua operação" },
  { icon: TrendingUp, text: "Dashboard executivo com visão 360° do negócio" },
];

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const logo = isDark ? logoWhite : logoRed;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <img src={logo} alt="Totum System" className="h-7 w-auto" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com a gente
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
            Plataforma completa para agências digitais
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight leading-tight">
            Gerencie sua agência{" "}
            <span className="text-primary">com inteligência</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            CRM, tarefas, contratos, financeiro e relatórios em uma plataforma
            integrada. Tudo que sua equipe precisa para entregar mais e crescer.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <Link to="/login">
                Acessar plataforma
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2">
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
              >
                Solicitar demonstração
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
              Tudo que sua agência precisa
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Módulos integrados para cobrir toda a operação, do cliente ao financeiro.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-4">
              Construído para escalar com você
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Do freelancer à agência com dezenas de colaboradores — o Totum
              cresce junto com a operação, sem perder controle nem visibilidade.
            </p>
            <ul className="space-y-4">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Stats card */}
          <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
            {[
              { label: "Clientes gerenciados", value: "Ilimitados" },
              { label: "Módulos disponíveis", value: "12+" },
              { label: "Integração com cobranças", value: "Asaas" },
              { label: "Ambientes isolados", value: "Multi-tenant" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold text-sm text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary-foreground">
            Pronto para organizar sua agência?
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Acesse agora ou fale com a gente para um tour personalizado pela plataforma.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto gap-2"
            >
              <Link to="/login">
                Acessar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar pelo WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={logo} alt="Totum System" className="h-6 w-auto opacity-70" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Totum System · Pixel Systems. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
