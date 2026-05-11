import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sun,
  Moon,
  Zap,
  Globe,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoWhite from "@/assets/logo-white.png";
import logoRed from "@/assets/logo-red.png";

const products = [
  {
    name: "Totum System",
    tag: "Disponível",
    tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    description: "Plataforma completa de gestão para agências digitais. CRM, tarefas, financeiro e relatórios integrados.",
    href: "https://agencia.pixelsystem.online",
    icon: LayoutDashboard,
    features: ["CRM de clientes", "Gestão de tarefas", "Financeiro + Asaas", "Relatórios executivos"],
  },
  {
    name: "Upixel CRM",
    tag: "Beta",
    tagColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    description: "CRM com WhatsApp integrado, pipeline de vendas e automações para times de atendimento.",
    href: "https://github.com/grupototum/upixelcrm",
    icon: MessageCircle,
    features: ["CRM + WhatsApp", "Pipeline de vendas", "Automações", "Multi-atendente"],
  },
  {
    name: "Próximo produto",
    tag: "Em breve",
    tagColor: "bg-muted text-muted-foreground",
    description: "Novos microsaas sendo desenvolvidos. Acompanhe as novidades.",
    href: null,
    icon: Zap,
    features: ["Em desenvolvimento", "Novidades em breve"],
  },
];

const pillars = [
  { icon: Globe, title: "Multi-tenant", description: "Cada cliente no seu ambiente isolado, seguro e personalizado." },
  { icon: Layers, title: "Modular", description: "Sistemas independentes que se integram conforme a necessidade." },
  { icon: ShieldCheck, title: "Seguro", description: "Row Level Security no Supabase + autenticação robusta." },
  { icon: TrendingUp, title: "Escalável", description: "Infraestrutura cloud-native que cresce junto com o negócio." },
];

export default function PixelSystemsLanding() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const logo = isDark ? logoWhite : logoRed;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <img src={logo} alt="Pixel Systems" className="h-7 w-auto" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button asChild variant="ghost" size="sm">
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Contato
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/nova-agencia">Cadastrar agência</Link>
            </Button>
            <Button asChild size="sm">
              <a href="https://totum.pixelsystem.online" target="_blank" rel="noopener noreferrer">
                Acessar Totum
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
            Microsaas &amp; Sistemas Web
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight leading-tight">
            Tecnologia que{" "}
            <span className="text-primary">transforma negócios</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Desenvolvemos microsaas e sistemas web sob medida para agências,
            empresas e empreendedores que precisam de tecnologia séria sem
            complexidade desnecessária.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Falar com a gente
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2">
              <a href="#produtos">
                Ver produtos
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="produtos" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Nossos produtos</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Sistemas prontos para usar, com suporte e evolução contínua.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map(({ name, tag, tagColor, description, href, icon: Icon, features }) => (
              <div
                key={name}
                className="rounded-xl border border-border bg-card p-6 flex flex-col hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{description}</p>
                <ul className="space-y-1.5 mb-6">
                  {features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {href ? (
                  <Button asChild variant="outline" size="sm" className="gap-2 mt-auto">
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                      Conhecer <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="mt-auto opacity-50">
                    Em breve
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Como construímos</h2>
            <p className="mt-3 text-muted-foreground text-lg">Nossos princípios técnicos em cada produto.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center p-6 rounded-xl border border-border bg-card">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary-foreground">
            Tem um projeto em mente?
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Fale com a gente. Desenvolvemos sistemas sob medida ou adaptamos
            nossos produtos para o seu negócio.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                WhatsApp <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <a href="mailto:contato@pixelsystem.online">
                contato@pixelsystem.online
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={logo} alt="Pixel Systems" className="h-6 w-auto opacity-70" />
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="https://agencia.pixelsystem.online" className="hover:text-foreground transition-colors">Totum System</a>
            <Link to="/setup" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pixel Systems. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
