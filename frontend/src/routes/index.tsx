import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  User2,
  Bell,
  QrCode,
  Gift,
  MessageSquare,
  Star,
  Sparkles,
  Loader2,
  History,
  MapPin,
  Award,
  Zap,
  Plus,
  Coins,
  Check,
  Save,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Revvy — Дашборд" },
      {
        name: "description",
        content: "API-платформа для сбора качественных отзывов с мгновенными бонусами клиентам.",
      },
    ],
  }),
  component: Dashboard,
});

type Mode = "business" | "client";

function Dashboard() {
  const [mode, setMode] = useState<Mode>("business");
  const [onboarded, setOnboarded] = useState(false);
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  const [clientName, setClientName] = useState("Алексей");
  const [businessData, setBusinessData] = useState({
    name: "Coffee Lab",
    category: "cafe",
    city: "Алматы",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsClientLoggedIn(true);
        setMode("client");
        setClientName(
          session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Пользователь",
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsClientLoggedIn(true);
        setMode("client");
        setClientName(
          session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Пользователь",
        );
      } else {
        setIsClientLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOnboarding = (data: { name: string; category: string; city: string }) => {
    setBusinessData(data);
    setOnboarded(true);
    toast.success(`Добро пожаловать в Revvy, ${data.name}!`);
  };

  const handleClientAuth = (name: string) => {
    setClientName(name);
    setIsClientLoggedIn(true);
    toast.success(`Добро пожаловать, ${name}!`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsClientLoggedIn(false);
    setOnboarded(false);
    setMode("business");
    toast.success("Вы вышли из системы");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <Header
        mode={mode}
        setMode={setMode}
        showModeToggle={!onboarded && !isClientLoggedIn}
        isClientLoggedIn={isClientLoggedIn}
        onboarded={onboarded}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {mode === "business" ? (
          onboarded ? (
            <BusinessDashboard name={businessData.name} />
          ) : (
            <Onboarding onComplete={handleOnboarding} />
          )
        ) : isClientLoggedIn ? (
          <ClientDashboard name={clientName} />
        ) : (
          <ClientAuth onComplete={handleClientAuth} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/20 py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm overflow-hidden">
              <img src="/logo.png" alt="Revvy Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight">Revvy</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Продукт
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Тарифы
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Помощь
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              API
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Конфиденциальность
            </a>
          </div>

          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Revvy Inc. Все права защищены.
          </div>
        </div>
      </div>
    </footer>
  );
}

function Onboarding({
  onComplete,
}: {
  onComplete: (data: { name: string; category: string; city: string }) => void;
}) {
  const [data, setData] = useState({ name: "", category: "", city: "" });

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/40 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white p-3 shadow-[var(--shadow-glow)] animate-bounce-subtle overflow-hidden">
            <img src="/logo.png" alt="Revvy Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Регистрация в Revvy</CardTitle>
          <CardDescription className="text-base mt-2">
            Давайте настроим ваш бизнес-профиль за пару секунд
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Название вашего бизнеса</Label>
            <Input
              placeholder="Напр: Coffee Lab"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="h-12 bg-background/50 border-border/60 focus:border-primary/50 transition-all text-base"
            />
          </div>
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Категория</Label>
            <Select onValueChange={(v) => setData({ ...data, category: v })}>
              <SelectTrigger className="h-12 bg-background/50 border-border/60 focus:border-primary/50 text-base">
                <SelectValue placeholder="Выберите направление" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/60">
                <SelectItem value="cafe">☕ Кафе и рестораны</SelectItem>
                <SelectItem value="beauty">✨ Красота и здоровье</SelectItem>
                <SelectItem value="retail">🛍️ Ритейл</SelectItem>
                <SelectItem value="services">🛠️ Услуги</SelectItem>
                <SelectItem value="other">⭐ Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Город</Label>
            <Input
              placeholder="Алматы"
              value={data.city}
              onChange={(e) => setData({ ...data, city: e.target.value })}
              className="h-12 bg-background/50 border-border/60 focus:border-primary/50 text-base"
            />
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-6 h-12 text-lg font-semibold shadow-[var(--shadow-glow)] transition-all active:scale-[0.98]"
            onClick={() => onComplete(data)}
            disabled={!data.name || !data.category}
          >
            Создать профиль
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Header({
  mode,
  setMode,
  showModeToggle,
  isClientLoggedIn,
  onboarded,
  onLogout,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  showModeToggle: boolean;
  isClientLoggedIn?: boolean;
  onboarded?: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-[var(--shadow-glow)] overflow-hidden">
            <img src="/logo.png" alt="Revvy Logo" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight">Revvy</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {mode === "business" ? "Business" : "Client"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showModeToggle ? <ModeToggle mode={mode} setMode={setMode} /> : null}
          {(isClientLoggedIn && mode === "client") || (onboarded && mode === "business") ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              Выйти
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="relative inline-flex items-center rounded-full border border-border bg-card p-1">
      <span
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-primary transition-transform duration-300 ease-out"
        style={{ transform: mode === "business" ? "translateX(0)" : "translateX(100%)" }}
      />
      <button
        onClick={() => setMode("business")}
        className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "business" ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">Бизнес</span>
      </button>
      <button
        onClick={() => setMode("client")}
        className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "client" ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <User2 className="h-4 w-4" />
        <span className="hidden sm:inline">Клиент</span>
      </button>
    </div>
  );
}

/* ---------------- BUSINESS ---------------- */

function BusinessDashboard({ name }: { name: string }) {
  const [stats, setStats] = useState([
    { icon: MessageSquare, label: "Отзывов за месяц", value: "1 248", delta: "+18%" },
    { icon: Star, label: "Средний рейтинг", value: "4.8", delta: "+0.2" },
    { icon: Gift, label: "Выдано бонусов", value: "932", delta: "+24%" },
  ]);

  const updateBonusStat = () => {
    setStats((prev) =>
      prev.map((s) =>
        s.label === "Выдано бонусов"
          ? { ...s, value: (parseInt(s.value.replace(/\s/g, "")) + 1).toLocaleString() }
          : s,
      ),
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Добро пожаловать, <span className="text-primary">{name}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Управляйте сбором отзывов, бонусами и AI-аналитикой в одном месте.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </section>

      <Tabs defaultValue="push" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="push">Конструктор</TabsTrigger>
          <TabsTrigger value="bonuses">Управление бонусами</TabsTrigger>
          <TabsTrigger value="reviews">Последние отзывы</TabsTrigger>
        </TabsList>

        <TabsContent value="push" className="mt-6">
          <PushEditor businessName={name} />
        </TabsContent>

        <TabsContent value="bonuses" className="mt-6">
          <BonusEditor onBonusAdded={updateBonusStat} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <RecentReviews />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/70 transition-all hover:border-primary/30 hover:shadow-lg group">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="secondary" className="bg-primary/15 text-primary border-0">
            {delta}
          </Badge>
        </div>
        <div className="mt-4 text-2xl font-semibold tracking-tight transition-all tabular-nums animate-in fade-in duration-500">
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function PushEditor({ businessName }: { businessName: string }) {
  const initialData = {
    title: `Спасибо за визит в ${businessName}! ✨`,
    body: "Оставьте короткий отзыв и получите приятный бонус при следующем визите к нам 🎁",
    modalTitle: "Оставьте отзыв",
    modalText: "Поделитесь впечатлениями и получите бонус сразу после оценки",
    buttonColor: "blue",
  };

  const [title, setTitle] = useState(initialData.title);
  const [body, setBody] = useState(initialData.body);
  const [modalTitle, setModalTitle] = useState(initialData.modalTitle);
  const [modalText, setModalText] = useState(initialData.modalText);
  const [buttonColor, setButtonColor] = useState(initialData.buttonColor);
  const [previewMode, setPreviewMode] = useState<"email" | "modal">("email");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keys, setKeys] = useState([
    { name: "Основной ключ", key: "rw_live_3j9sdfk29", createdAt: "10 мая 2026" },
  ]);

  const buttonColors = [
    { value: "blue", label: "Синий", className: "bg-blue-600 text-white" },
    { value: "purple", label: "Фиолетовый", className: "bg-purple-600 text-white" },
    { value: "green", label: "Зелёный", className: "bg-emerald-600 text-white" },
  ];

  const generateKey = () => `rw_live_${Math.random().toString(36).slice(2, 11)}`;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const key = generateKey();
      setApiKey(key);
      setKeys((prev) => [
        ...prev,
        {
          name: `Ключ ${prev.length + 1}`,
          key,
          createdAt: new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        },
      ]);
      setIsSaving(false);
      setIsSaved(true);
      toast.success("Настройки успешно сохранены!");
      setTimeout(() => setIsSaved(false), 2000);
    }, 1200);
  };

  const handleCopyApiKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    toast.success("Ключ скопирован");
  };

  const handleCreateKey = () => {
    const key = generateKey();
    setKeys((prev) => [
      ...prev,
      {
        name: `Ключ ${prev.length + 1}`,
        key,
        createdAt: new Date().toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      },
    ]);
    toast.success("Новый ключ создан!");
  };

  const handleDeleteKey = (keyToRemove: string) => {
    setKeys((prev) => prev.filter((item) => item.key !== keyToRemove));
  };

  const maskKey = (key: string) => `***${key.slice(-4)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
      <Card className="space-y-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Конструктор email-сообщения и окна
          </CardTitle>
          <CardDescription>Настройте письмо и модальное окно в одном месте.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4 rounded-3xl border border-border p-5 bg-background/80">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bell className="h-4 w-4 text-primary" /> Email-сообщение
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Текст письма</Label>
                <Textarea
                  id="body"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-border p-5 bg-background/80">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bell className="h-4 w-4 text-primary" /> Модальное окно
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modalTitle">Заголовок окна</Label>
                <Input
                  id="modalTitle"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modalText">Текст-приглашение</Label>
                <Textarea
                  id="modalText"
                  rows={4}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Выбор цвета кнопки</Label>
                <div className="flex flex-wrap gap-3">
                  {buttonColors.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setButtonColor(option.value)}
                      className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 ${
                        buttonColor === option.value
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "hover:ring-1 hover:ring-border"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full shadow-sm ${option.className}`} />
                      <span className="absolute -bottom-6 scale-0 text-[10px] font-medium text-muted-foreground transition-transform group-hover:scale-100">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className={`min-w-[220px] transition-all ${
                isSaved
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить и получить API ключ
            </Button>
          </div>

          {apiKey ? (
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm">Ваш API ключ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border bg-background/80 p-4 font-mono text-sm">
                  {apiKey}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleCopyApiKey}
                    className="bg-primary text-primary-foreground"
                  >
                    Скопировать
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Сохраните ключ — он показывается один раз
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-gradient-to-b from-card to-background">
          <CardHeader>
            <CardTitle className="text-base">Превью</CardTitle>
            <CardDescription>Так увидит клиент</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-border bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("email")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${previewMode === "email" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
                >
                  Письмо
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("modal")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${previewMode === "modal" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
                >
                  Окно отзыва
                </button>
              </div>

              {previewMode === "email" ? (
                <div className="mx-auto w-full max-w-[320px] rounded-[2.5rem] border border-border bg-background p-3 shadow-[var(--shadow-glow)]">
                  <div className="rounded-[2rem] bg-card p-4 min-h-[400px]">
                    <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
                      <span>9:41</span>
                      <span className="uppercase tracking-widest">Email</span>
                    </div>
                    <div className="rounded-lg border border-border bg-background overflow-hidden">
                      <div className="border-b border-border bg-muted/30 px-3 py-2 text-[10px] space-y-1">
                        <div>
                          <span className="text-muted-foreground">От:</span> Revvy
                        </div>
                        <div>
                          <span className="text-muted-foreground">Тема:</span> {title}
                        </div>
                      </div>
                      <div className="p-4 text-xs">
                        <div className="h-10 w-10 rounded-lg bg-white p-1 flex items-center justify-center mb-4 shadow-sm overflow-hidden">
                          <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="font-semibold mb-2">{title}</div>
                        <div className="text-muted-foreground leading-relaxed text-[10px]">
                          {body}
                        </div>
                        <div className="mt-6 pt-4 border-t border-border">
                          <div className="h-8 w-28 rounded bg-primary text-[9px] flex items-center justify-center text-primary-foreground font-medium uppercase tracking-wider">
                            Получить бонус
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto pt-10">
                      <div className="h-1 w-24 mx-auto rounded-full bg-muted/40" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[320px] rounded-[2.5rem] border border-border bg-background p-3 shadow-[var(--shadow-glow)]">
                  <div className="relative rounded-[2rem] bg-card p-6 min-h-[400px] flex flex-col items-center text-center">
                    <div className="absolute top-4 right-4 text-muted-foreground/30">✕</div>
                    <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Star className="h-8 w-8 fill-primary/20" />
                    </div>
                    <div className="mt-6">
                      <div className="text-lg font-bold tracking-tight">{modalTitle}</div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80">
                        {modalText}
                      </p>
                    </div>

                    <div className="mt-8 flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className="h-8 w-8 rounded-lg border border-border bg-muted/20 flex items-center justify-center text-muted-foreground/40"
                        >
                          ★
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto w-full">
                      <button
                        className={`w-full rounded-2xl py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-lg hover:brightness-110 active:scale-[0.98] ${
                          buttonColor === "blue"
                            ? "bg-blue-600 text-white shadow-blue-500/20"
                            : buttonColor === "purple"
                              ? "bg-purple-600 text-white shadow-purple-500/20"
                              : "bg-emerald-600 text-white shadow-emerald-500/20"
                        }`}
                      >
                        Оставить отзыв
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Мои API ключи</CardTitle>
              <CardDescription>Управляйте ключами доступа к API.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleCreateKey}>
              Создать новый ключ
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr>
                  <th className="pb-3 font-medium">Название</th>
                  <th className="pb-3 font-medium">Ключ</th>
                  <th className="pb-3 font-medium">Дата создания</th>
                  <th className="pb-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((item) => (
                  <tr key={item.key} className="border-t border-border/50">
                    <td className="py-3">{item.name}</td>
                    <td className="py-3 font-mono">{maskKey(item.key)}</td>
                    <td className="py-3 text-muted-foreground">{item.createdAt}</td>
                    <td className="py-3">
                      <Button size="sm" variant="outline" onClick={() => handleDeleteKey(item.key)}>
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BonusEditor({ onBonusAdded }: { onBonusAdded?: () => void }) {
  const [pointsPerReviewType, setPointsPerReviewType] = useState({
    poor: 50,
    medium: 150,
    detailed: 300,
  });

  const [coupons, setCoupons] = useState([] as { id: number; name: string; pointsPrice: number }[]);

  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ name: "", pointsPrice: "" });

  const handleAddCoupon = () => {
    if (newCoupon.name && newCoupon.pointsPrice) {
      const coupon = {
        id: coupons.length + 1,
        name: newCoupon.name,
        pointsPrice: parseInt(newCoupon.pointsPrice),
      };
      setCoupons([...coupons, coupon]);
      toast.success("Купон успешно добавлен!");
      onBonusAdded?.();
      setNewCoupon({ name: "", pointsPrice: "" });
      setIsCouponDialogOpen(false);
    }
  };

  const handleDeleteCoupon = (id: number) => {
    setCoupons(coupons.filter((c) => c.id !== id));
    toast.success("Купон удалён");
  };

  const reviewTypeLabels = {
    poor: {
      title: "Неподходящий или слабый отзыв",
      description: "Низкое качество, спам, неполная информация",
      icon: "🔴",
    },
    medium: {
      title: "Средний отзыв",
      description: "Базовая информация, нейтральный тон",
      icon: "🟡",
    },
    detailed: {
      title: "Подробный отзыв",
      description: "Развёрнутый, конструктивный, с деталями",
      icon: "🟢",
    },
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" /> Система баллов Revvy
          </CardTitle>
          <CardDescription>
            Установите количество баллов за разные типы отзывов. Клиенты смогут потратить баллы на
            купоны.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Points per Review Type */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(["poor", "medium", "detailed"] as const).map((reviewType) => {
          const typeInfo = reviewTypeLabels[reviewType];
          return (
            <Card key={reviewType} className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl mb-2">{typeInfo.icon}</div>
                    <h3 className="font-semibold text-foreground">{typeInfo.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{typeInfo.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Баллы за отзыв этого типа</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={pointsPerReviewType[reviewType]}
                        onChange={(e) =>
                          setPointsPerReviewType((prev) => ({
                            ...prev,
                            [reviewType]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="bg-background/50"
                      />
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        pts
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-xs text-muted-foreground">При каждом отзыве:</div>
                    <div className="text-lg font-bold text-primary">
                      {pointsPerReviewType[reviewType]} баллов
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coupons Section */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Доступные купоны
            </CardTitle>
            <CardDescription>Клиенты покупают эти купоны на заработанные баллы</CardDescription>
          </div>
          <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)]">
                <Plus className="mr-2 h-4 w-4" /> Добавить купон
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-border/60 bg-card/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" /> Новый купон
                </DialogTitle>
                <CardDescription>
                  Создайте купон, который клиенты смогут купить за баллы.
                </CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon-name">Название купона</Label>
                  <Input
                    id="coupon-name"
                    placeholder="Напр: Бесплатный десерт"
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-price">Цена в баллах Revvy</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="coupon-price"
                      type="number"
                      min="0"
                      placeholder="Напр: 250"
                      value={newCoupon.pointsPrice}
                      onChange={(e) => setNewCoupon({ ...newCoupon, pointsPrice: e.target.value })}
                      className="bg-background/50"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">pts</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCouponDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleAddCoupon} className="bg-primary text-primary-foreground">
                  Создать купон
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {coupons.length > 0 ? (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4 transition-all hover:bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="font-medium">{coupon.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">Цена за купон</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{coupon.pointsPrice}</div>
                      <div className="text-xs text-muted-foreground">баллов</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Нет купонов. Добавьте первый купон, нажав кнопку выше.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
    </div>
  );
}

function QrApiPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> QR-код заведения
          </CardTitle>
          <CardDescription>Распечатайте на чеке или столиках</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="grid h-48 w-48 grid-cols-8 gap-1 rounded-2xl border border-border bg-background p-3">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${Math.random() > 0.5 ? "bg-foreground" : "bg-transparent"}`}
              />
            ))}
          </div>
          <Button variant="outline">Скачать PNG</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> API-ключ
          </CardTitle>
          <CardDescription>Используйте для интеграции с вашей CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 font-mono text-sm">
            sk_live_••••••••••3f9a2c
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Скопировать</Button>
            <Button variant="outline">Перевыпустить</Button>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4 text-xs text-muted-foreground">
            <span className="text-primary">POST</span> https://api.snapreview.io/v1/reviews
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentReviews() {
  const reviews = [
    {
      name: "Анна К.",
      text: "Всё очень понравилось, сервис на высшем уровне!",
      rating: 5,
      bonus: "Скидка 10%",
    },
    {
      name: "Игорь П.",
      text: "Быстро, качественно, уютно. Зайду ещё.",
      rating: 5,
      bonus: "Приятный подарок",
    },
    {
      name: "Мария С.",
      text: "Хорошее обслуживание, но было немного шумно.",
      rating: 4,
      bonus: "Комплимент",
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние отзывы</CardTitle>
        <CardDescription>AI уже оценил качество и начислил бонусы</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.name}</div>
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-primary/15 text-primary border-0">
                <Gift className="mr-1 h-3 w-3" /> {r.bonus}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Zap className="mr-1 h-3 w-3" /> AI score 0.92
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- CLIENT AUTH ---------------- */

function ClientAuth({ onComplete }: { onComplete: (name: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Регистрация успешна! Проверьте email для подтверждения.");
        if (data.user) {
          onComplete(data.user.email?.split("@")[0] || "Пользователь");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Вход выполнен успешно!");
        if (data.user) {
          onComplete(
            data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Пользователь",
          );
        }
      }
    } catch (error) {
      toast.error((error as Error).message || "Произошла ошибка при авторизации");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error((error as Error).message || "Ошибка входа через Google");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/40 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white p-3 shadow-[var(--shadow-glow)] animate-bounce-subtle overflow-hidden">
            <img src="/logo.png" alt="Revvy Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isSignUp ? "Регистрация в Revvy" : "Вход в Revvy"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Войдите или создайте аккаунт для продолжения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2.5">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                placeholder="ваша@почта.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background/50 border-border/60 focus:border-primary/50 transition-all text-base"
                required
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-sm font-medium">Пароль</Label>
              <Input
                type="password"
                placeholder="Ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-background/50 border-border/60 focus:border-primary/50 transition-all text-base"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSignUp ? "Зарегистрироваться" : "Войти"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Или</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium bg-background/50"
            onClick={handleGoogleAuth}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Продолжить с Google
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-4">
            {isSignUp ? "Уже есть аккаунт? " : "Нет аккаунта? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Войти" : "Зарегистрироваться"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- CLIENT ---------------- */

function ClientDashboard({ name }: { name: string }) {
  const [clientStats, setClientStats] = useState([
    { icon: MessageSquare, label: "Отзывов оставлено", value: "34", delta: "+3" },
    { icon: Award, label: "Уровень", value: "Gold" },
    { icon: Gift, label: "Активных бонусов", value: "5" },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <section>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Привет, <span className="text-primary">{name}</span>
          </h1>
          <p className="text-muted-foreground max-w-md">
            Ваши отзывы превращаются в бонусы. Чем качественнее — тем больше выгода.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {clientStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </section>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="history">
            <History className="mr-1.5 h-4 w-4" /> История
          </TabsTrigger>
          <TabsTrigger value="coupons">
            <Gift className="mr-1.5 h-4 w-4" /> Магазин талонов
          </TabsTrigger>
          <TabsTrigger value="places">
            <MapPin className="mr-1.5 h-4 w-4" /> Заведения
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User2 className="mr-1.5 h-4 w-4" /> Профиль
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <ClientHistory history={[]} />
        </TabsContent>
        <TabsContent value="coupons" className="mt-6">
          <ClientCoupons />
        </TabsContent>
        <TabsContent value="places" className="mt-6">
          <ClientPlaces places={[]} />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ClientProfile name={name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientHistory({
  history,
}: {
  history: { place: string; date: string; rating: number; text: string; bonus: string }[];
}) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История отзывов</CardTitle>
          <CardDescription>Все ваши отзывы и полученные бонусы</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>У вас пока нет отзывов</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>История отзывов</CardTitle>
        <CardDescription>Все ваши отзывы и полученные бонусы</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((it, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-muted/20 p-4 animate-in fade-in slide-in-from-top-4 duration-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{it.place}</div>
                <div className="text-xs text-muted-foreground">{it.date}</div>
              </div>
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: it.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{it.text}</p>
            <Badge className="mt-3 bg-primary/15 text-primary border-0">
              <Gift className="mr-1 h-3 w-3" /> {it.bonus}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClientCoupons() {
  const coupons = [
    { name: "Скидка 10% на кофе", price: 500, description: "На любой кофе в Coffee Lab" },
    { name: "Бесплатный десерт", price: 800, description: "При заказе основного блюда" },
    { name: "Скидка 20% на стрижку", price: 1000, description: "В Barbershop K." },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Магазин талонов</CardTitle>
          <CardDescription>Обменяйте баллы на купоны и скидки</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c, i) => (
          <Card key={i} className="relative overflow-hidden border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardContent className="relative p-5">
              <Gift className="h-8 w-8 text-primary" />
              <div className="mt-4 text-lg font-semibold">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.description}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium">{c.price} баллов</span>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Обменять
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ClientProfile({ name }: { name: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Профиль</CardTitle>
        <CardDescription>Ваши личные данные</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary text-2xl font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">Клиент</div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Имя</Label>
            <Input value={name} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={`${name.toLowerCase()}@example.com`} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input value="+7 (999) 123-45-67" readOnly />
          </div>
          <div className="space-y-2">
            <Label>Дата регистрации</Label>
            <Input value="15 марта 2024" readOnly />
          </div>
        </div>
        <Button variant="outline" className="w-full">
          Редактировать профиль
        </Button>
      </CardContent>
    </Card>
  );
}
function ClientPlaces({
  places,
}: {
  places: { name: string; category: string; address: string; distance: string }[];
}) {
  const mockPlaces = [
    { name: "Coffee Lab", category: "Кафе", address: "ул. Абая, 12", distance: "200 м" },
    { name: "Barbershop K", category: "Красота", address: "пр. Достык, 45", distance: "450 м" },
    { name: "Fitness Pride", category: "Спорт", address: "ул. Сатпаева, 8", distance: "1.2 км" },
  ];

  const displayPlaces = places.length > 0 ? places : mockPlaces;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {displayPlaces.map((p, i) => (
        <Card key={i} className="group overflow-hidden transition-all hover:shadow-lg">
          <CardContent className="p-0">
            <div className="h-32 bg-muted/30 relative flex items-center justify-center overflow-hidden">
              <MapPin className="h-10 w-10 text-primary opacity-20 transition-transform group-hover:scale-110" />
              <div className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-medium border border-border">
                {p.distance}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {p.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {p.address}
              </p>
              <Button size="sm" className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary hover:text-white border-0">
                Оставить отзыв
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
