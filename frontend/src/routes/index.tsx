import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase.ts";
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
  Image as ImageIcon,
  Upload,
  X,
  Paperclip,
  Copy,
  Users,
  Settings2,
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [clientName, setClientName] = useState("Алексей");
  const [clientEmail, setClientEmail] = useState("");
  const [points, setPoints] = useState(1250);
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [businessData, setBusinessData] = useState({
    name: "Coffee Lab",
    category: "cafe",
    city: "Алматы",
    email: "",
  });

  // Helper: check if logged in user is a business owner
  const checkAndSetUserRole = async (session: any) => {
    if (!session) return;

    const userName =
      session.user.user_metadata?.full_name ||
      session.user.email?.split("@")[0] ||
      "Пользователь";

    setIsLoggedIn(true);
    setClientName(userName);
    setClientEmail(session.user.email || "");

    // Check if this user has a business profile in Supabase
    const { data: bizData } = await supabase
      .from("businesses")
      .select("id, name, category, city, email")
      .eq("id", session.user.id)
      .single();

    if (bizData) {
      // User is a business owner
      setMode("business");
      setBusinessData({
        name: bizData.name || "",
        category: bizData.category || "",
        city: bizData.city || "",
        email: bizData.email || "",
      });
      setOnboarded(true);
    } else {
      // User is a regular client — always switch to client mode and skip onboarding
      setMode("client");
      setOnboarded(true);
      
      // Fetch user balance
      const { data: balanceData } = await supabase
        .from("user_balances")
        .select("balance")
        .eq("user_email", session.user.email)
        .single();
      
      if (balanceData) {
        setPoints(balanceData.balance || 0);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      checkAndSetUserRole(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        checkAndSetUserRole(session);
      } else {
        setIsLoggedIn(false);
        setOnboarded(false);
        setMode("business");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOnboarding = async (data: { name: string; category: string; city: string; email: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error } = await supabase
          .from("businesses")
          .upsert({
            id: session.user.id,
            name: data.name,
            email: data.email,
            category: data.category,
            city: data.city,
          });

        if (error) throw error;
      }

      setBusinessData(data);
      setOnboarded(true);
      toast.success(`Добро пожаловать в Revvy, ${data.name}!`);
    } catch (error: any) {
      console.error("Error saving business profile:", error);
      toast.error("Не удалось сохранить профиль: " + error.message);
    }
  };

  const handleClientAuth = (name: string, email?: string) => {
    setClientName(name);
    if (email) setClientEmail(email);
    setIsLoggedIn(true);
    toast.success(`Добро пожаловать, ${name}!`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
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
        showModeToggle={!onboarded && !isLoggedIn}
        isClientLoggedIn={isLoggedIn}
        onboarded={onboarded}
        onLogout={handleLogout}
        points={mode === "client" ? points : undefined}
      />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {mode === "business" ? (
          !isLoggedIn ? (
            <ClientAuth onComplete={handleClientAuth} />
          ) : onboarded ? (
            <BusinessDashboard name={businessData.name} />
          ) : (
            <Onboarding onComplete={handleOnboarding} />
          )
        ) : isLoggedIn ? (
          <ClientDashboard
            name={clientName}
            email={clientEmail}
            points={points}
            setPoints={setPoints}
            myCoupons={myCoupons}
            setMyCoupons={setMyCoupons}
          />
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
  onComplete: (data: { name: string; category: string; city: string; email: string }) => void;
}) {
  const [data, setData] = useState({ name: "", category: "", city: "", email: "" });

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
            <Label className="text-sm font-medium">Email компании</Label>
            <Input
              type="email"
              placeholder="biz@example.com"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
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
            disabled={!data.name || !data.category || !data.email}
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
  points,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  showModeToggle: boolean;
  isClientLoggedIn?: boolean;
  onboarded?: boolean;
  onLogout: () => void;
  points?: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
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

          {mode === "client" && isClientLoggedIn && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">{points} pts</span>
            </div>
          )}
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
    { icon: MessageSquare, label: "Всего отзывов", value: "...", delta: "" },
    { icon: Star, label: "Средний рейтинг", value: "...", delta: "" },
    { icon: Gift, label: "Активных купонов", value: "...", delta: "" },
  ]);

  const fetchStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const bizId = session.user.id;

    // 1. Total Reviews
    const { count: reviewsCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId);

    // 2. Average Rating
    const { data: ratingData } = await supabase
      .from("reviews")
      .select("points")
      .eq("business_id", bizId);
    
    const avgRating = ratingData?.length 
      ? (ratingData.reduce((acc, r) => acc + (r.points > 200 ? 5 : r.points > 100 ? 4 : 3), 0) / ratingData.length).toFixed(1)
      : "5.0";

    // 3. Coupons count
    const { count: couponsCount } = await supabase
      .from("coupons")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bizId);

    setStats([
      { icon: MessageSquare, label: "Всего отзывов", value: (reviewsCount || 0).toString(), delta: "+1" },
      { icon: Star, label: "Средний рейтинг", value: avgRating, delta: "AI" },
      { icon: Gift, label: "Активных купонов", value: (couponsCount || 0).toString(), delta: "" },
    ]);
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
          <BonusEditor onBonusAdded={fetchStats} />
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
  delta?: string;
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Get current user session to get business_id
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Вы не авторизованы");
        return;
      }
      const businessId = session.user.id;

      // 2. Save widget config and notification template to Supabase
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          widget_config: {
            title: modalTitle,
            description: modalText,
            button_color: buttonColor,
          },
          notification_template: {
            subject: title,
            body: body,
          },
        })
        .eq("id", businessId);

      if (updateError) throw updateError;

      // 3. Call backend to generate API key
      const response = await fetch("http://localhost:8000/api/generate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Ошибка генерации ключа");

      const key = data.api_key;
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
      setIsSaved(true);
      toast.success("Настройки сохранены и API ключ сгенерирован!");
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      toast.error("Ошибка: " + (err.message || "Что-то пошло не так"));
    } finally {
      setIsSaving(false);
    }
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("businesses")
        .select("points_weak, points_medium, points_detailed")
        .eq("id", session.user.id)
        .single();
      
      if (data) {
        setPointsPerReviewType({
          poor: data.points_weak || 50,
          medium: data.points_medium || 150,
          detailed: data.points_detailed || 300,
        });
      }
    };
    fetchPoints();
  }, []);

  const handleSavePoints = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("businesses")
        .update({
          points_weak: pointsPerReviewType.poor,
          points_medium: pointsPerReviewType.medium,
          points_detailed: pointsPerReviewType.detailed,
        })
        .eq("id", session.user.id);
      
      if (error) throw error;
      toast.success("Настройки баллов сохранены!");
      onBonusAdded?.();
    } catch (err: any) {
      toast.error("Ошибка сохранения: " + err.message);
    } finally {
      setSaving(false);
    }
  };

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

      <div className="flex justify-end mt-4">
        <Button 
          onClick={handleSavePoints} 
          disabled={saving}
          className="bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Сохранить настройки баллов
        </Button>
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Последние отзывы</CardTitle>
          <CardDescription>AI уже оценил качество и начислил бонусы</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchReviews()} disabled={loading}>
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-muted/10 p-5 transition-all hover:bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{review.user_email?.split("@")[0] || "Гость"}</div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                        5.0
                      </span>
                      <span>•</span>
                      <span>{new Date(review.created_at).toLocaleDateString("ru-RU")}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 uppercase border-primary/20 text-primary">
                        {review.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-primary">+{review.points} pts</div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                {review.text}
              </p>
              {review.ai_analysis && (
                <div className="mt-3 rounded-lg bg-primary/5 p-3 text-[11px] border border-primary/10">
                  <div className="flex items-center gap-1.5 font-bold text-primary mb-1 uppercase tracking-tighter">
                    <Sparkles className="h-3 w-3" /> AI Анализ:
                  </div>
                  <div className="text-muted-foreground italic line-clamp-2">
                    {review.ai_analysis}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-3xl border-border/40">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Отзывов пока нет</p>
          </div>
        )}
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
  const [showConfirmation, setShowConfirmation] = useState(false);

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
        setShowConfirmation(true);
        toast.success("Регистрация успешна! Проверьте email.");
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

  if (showConfirmation) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/40 bg-card/40 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-bounce-subtle">
              <Bell className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Проверьте почту</CardTitle>
            <CardDescription className="text-base mt-4 px-4">
              Мы отправили ссылку для подтверждения на <strong>{email}</strong>. 
              Пожалуйста, перейдите по ней, чтобы активировать аккаунт.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-8 flex flex-col gap-4">
            <Button variant="outline" className="h-12" onClick={() => setShowConfirmation(false)}>
              Вернуться ко входу
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Не получили письмо? Проверьте папку Спам.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {isSignUp ? "Создайте аккаунт для вашего бизнеса" : "Войдите для управления вашим бизнесом"}
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

function ClientDashboard({
  name,
  email,
  points,
  setPoints,
  myCoupons,
  setMyCoupons,
}: {
  name: string;
  email: string;
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  myCoupons: any[];
  setMyCoupons: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [clientStats, setClientStats] = useState([
    { icon: Coins, label: "Баллов накоплено", value: points.toLocaleString(), delta: "+300" },
    { icon: MessageSquare, label: "Отзывов оставлено", value: "34", delta: "+3" },
    { icon: Gift, label: "Активных бонусов", value: "5" },
  ]);

  useEffect(() => {
    setClientStats((prev) =>
      prev.map((s) => (s.label === "Баллов накоплено" ? { ...s, value: points.toLocaleString() } : s)),
    );
  }, [points]);

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientData = async () => {
    if (!email) return;
    setLoading(true);

    // 1. Fetch History
    const { data: revs, error: revErr } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (!revErr && revs) {
      setHistory(revs.map(r => ({
        place: "Отзыв в заведении",
        date: new Date(r.created_at).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        rating: 5,
        text: r.text,
        bonus: `+${r.points} pts`
      })));

      // 2. Update Stats
      setClientStats(prev => prev.map(s => {
        if (s.label === "Отзывов оставлено") return { ...s, value: revs.length.toString() };
        if (s.label === "Баллов накоплено" && revs.length > 0) return { ...s, delta: `+${revs[0].points}` };
        return s;
      }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientData();
  }, [email]);

  const handleAddReview = (
    place: string,
    rating: number,
    text: string,
    images: string[] = [],
  ) => {
    // This is for local-only reviews (manual add from UI), but we mostly use API
    const earnedPoints = rating >= 4 ? 300 : 150;
    const newReview = {
      place,
      date: new Date().toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      rating,
      text,
      bonus: `${earnedPoints} баллов`,
      images,
    };
    setHistory([newReview, ...history]);

    const newPoints = points + earnedPoints;
    setPoints(newPoints);

    setClientStats((prev) =>
      prev.map((s) => {
        if (s.label === "Баллов накоплено") {
          return { ...s, value: newPoints.toLocaleString(), delta: `+${earnedPoints}` };
        }
        if (s.label === "Отзывов оставлено") {
          return { ...s, value: (parseInt(s.value) + 1).toString() };
        }
        return s;
      }),
    );
    toast.success(`Отзыв успешно отправлен! Вам начислено ${earnedPoints} баллов.`);
  };

  const handleExchangePoints = (amount: number, couponName: string) => {
    if (points >= amount) {
      const newPoints = points - amount;
      setPoints(newPoints);
      setMyCoupons((prev) => [
        ...prev,
        {
          name: couponName,
          date: new Date().toLocaleDateString("ru-RU"),
          code: Math.random().toString(36).toUpperCase().slice(2, 10),
        },
      ]);
      toast.success(`Вы успешно обменяли баллы на «${couponName}»!`);
      return true;
    } else {
      toast.error("Недостаточно баллов для обмена");
      return false;
    }
  };

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
          <StatCard key={i} icon={s.icon} label={s.label} value={s.value} delta={s.delta} />
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
          <TabsTrigger value="my-bonuses">
            <Award className="mr-1.5 h-4 w-4" /> Мои купоны
          </TabsTrigger>
          <TabsTrigger value="places">
            <MapPin className="mr-1.5 h-4 w-4" /> Заведения
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User2 className="mr-1.5 h-4 w-4" /> Профиль
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <ClientHistory history={history} />
        </TabsContent>
        <TabsContent value="coupons" className="mt-6">
          <ClientCoupons points={points} onExchange={handleExchangePoints} />
        </TabsContent>
        <TabsContent value="my-bonuses" className="mt-6">
          <MyCoupons coupons={myCoupons} />
        </TabsContent>
        <TabsContent value="places" className="mt-6">
          <ClientPlaces onLeaveReview={handleAddReview} />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ClientProfile name={name} email={email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MyCoupons({ coupons }: { coupons: any[] }) {
  if (coupons.length === 0) {
    return (
      <Card className="border-border/60 bg-card/40 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 text-muted-foreground mb-4">
            <Award className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">У вас пока нет купонов</CardTitle>
          <CardDescription className="max-w-xs mt-2">
            Зарабатывайте баллы, оставляя отзывы, и обменивайте их на подарки в магазине талонов.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {coupons.map((c, i) => (
        <Card key={i} className="overflow-hidden border-primary/20 bg-card/60 backdrop-blur-md">
          <CardContent className="p-0">
            <div className="flex">
              <div className="flex flex-col items-center justify-center bg-primary/10 border-r border-dashed border-primary/30 px-6 py-6">
                <QrCode className="h-10 w-10 text-primary" />
                <span className="mt-2 text-[10px] font-bold uppercase text-primary/60">Scan</span>
              </div>
              <div className="flex-1 p-5">
                <div className="text-xs text-muted-foreground mb-1">{c.date}</div>
                <div className="text-lg font-bold tracking-tight">{c.name}</div>
                <div className="mt-3 inline-flex items-center rounded-lg bg-background/80 px-3 py-1.5 border border-border">
                  <span className="font-mono text-sm font-bold tracking-widest">{c.code}</span>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground italic">
                  Покажите этот код сотруднику заведения
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ClientHistory({
  history,
}: {
  history: {
    place: string;
    date: string;
    rating: number;
    text: string;
    bonus: string;
    images?: string[];
  }[];
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
                <div className="font-medium text-primary">Отзыв в заведении</div>
                <div className="text-[10px] text-muted-foreground">{it.date}</div>
              </div>
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: it.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{it.text}</p>
            {it.images && it.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {it.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted"
                  >
                    <img src={img} alt="Review" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <Badge className="mt-3 bg-primary/15 text-primary border-0">
              <Gift className="mr-1 h-3 w-3" /> {it.bonus}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClientCoupons({
  points,
  onExchange,
}: {
  points: number;
  onExchange: (amount: number, name: string) => boolean;
}) {
  const coupons = [
    { name: "Скидка 10% на кофе", price: 500, description: "На любой кофе в Coffee Lab" },
    { name: "Бесплатный десерт", price: 800, description: "При заказе основного блюда" },
    { name: "Скидка 20% на стрижку", price: 1000, description: "В Barbershop K." },
  ];
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-border/60 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Магазин талонов
          </CardTitle>
          <CardDescription>Обменяйте баллы на купоны и скидки</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4 border border-primary/10">
            <Coins className="h-6 w-6 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Ваш баланс
              </div>
              <div className="text-2xl font-bold text-primary">{points.toLocaleString()} pts</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c, i) => {
          const canAfford = points >= c.price;
          return (
            <Card
              key={i}
              className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 group ${
                canAfford ? "border-primary/20 bg-card/60" : "border-border/40 bg-muted/20 opacity-80"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent transition-opacity group-hover:opacity-100 ${
                  canAfford ? "opacity-40" : "opacity-0"
                }`}
              />
              <CardContent className="relative p-6">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
                    canAfford ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Gift className="h-6 w-6" />
                </div>
                <div className="mt-5 text-xl font-bold tracking-tight">{c.name}</div>
                <div className="mt-1 text-sm text-muted-foreground/80 leading-relaxed">
                  {c.description}
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-bold ${canAfford ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {c.price}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      pts
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => onExchange(c.price, c.name)}
                    className={`rounded-xl px-5 h-10 font-bold transition-all ${
                      canAfford
                        ? "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                        : "bg-muted text-muted-foreground grayscale"
                    }`}
                  >
                    {canAfford ? "Обменять" : "Мало баллов"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ClientProfile({ name: initialName, email }: { name: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("+7 (707) 123-45-67");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState({ push: true, email: false });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Профиль успешно обновлен");
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://revvy.kz/invite/${name.toLowerCase().replace(" ", "-")}`);
    toast.success("Ссылка скопирована!");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
          <CardContent className="relative pt-0 px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-6">
              <div className="relative group">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-card text-primary text-4xl font-bold border-4 border-background shadow-xl overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-6 w-6" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                )}
              </div>
              <div className="pb-1">
                <div className="text-2xl font-bold tracking-tight">{name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold uppercase tracking-wider text-[10px]">
                    Gold Member
                  </Badge>
                  <span>•</span>
                  <span>Казахстан, Алматы</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Имя</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted/20 border-transparent" : "bg-background"}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Заблокировано</span>
                </div>
                <Input
                  value={email}
                  readOnly
                  className="bg-muted/30 border-transparent opacity-70 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Телефон</Label>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Заблокировано</span>
                </div>
                <Input
                  value={phone}
                  readOnly
                  className="bg-muted/30 border-transparent opacity-70 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Дата регистрации</Label>
                <Input value="15 марта 2024" readOnly className="bg-muted/20 border-transparent opacity-60" />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="flex-1 font-bold">Сохранить</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 font-bold">Отмена</Button>
                </>
              ) : (
                <Button variant="outline" className="w-full font-bold border-border/60 hover:bg-muted/30" onClick={() => setIsEditing(true)}>
                  Редактировать профиль
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Интересы и предпочтения</CardTitle>
            <CardDescription>Мы будем предлагать бонусы на основе ваших вкусов</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Кофе и десерты", icon: Gift },
              { label: "Спорт и здоровье", icon: Zap },
              { label: "Красота и уход", icon: Sparkles },
              { label: "Рестораны", icon: MessageSquare },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background border border-border">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <Switch defaultChecked={i % 2 === 0} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-border/60 bg-primary/5 border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Users className="h-24 w-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Пригласи друга</CardTitle>
            <CardDescription>Получите 500 баллов за каждого приведенного клиента</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={`revvy.kz/invite/${name.toLowerCase().replace(" ", "-")}`}
                className="bg-background/50 text-xs font-mono"
              />
              <Button size="icon" variant="secondary" onClick={copyReferral}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Приглашено друзей</span>
              <span className="text-primary font-bold">12</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Настройки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Push-уведомления</Label>
                <p className="text-[10px] text-muted-foreground">О новых бонусах и скидках</p>
              </div>
              <Switch checked={notifications.push} onCheckedChange={(v) => setNotifications({...notifications, push: v})} />
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email рассылка</Label>
                <p className="text-[10px] text-muted-foreground">Еженедельный дайджест</p>
              </div>
              <Switch checked={notifications.email} onCheckedChange={(v) => setNotifications({...notifications, email: v})} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Достижения</CardTitle>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Level 12</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Прогресс до 13 уровня</span>
                <span>85%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[85%] shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { label: "Критик", color: "bg-amber-500", desc: "Оставлено 10+ отзывов" },
                { label: "Адепт", color: "bg-blue-500", desc: "Сделано 5 обменов" },
                { label: "Первопроходец", color: "bg-emerald-500", desc: "Первый отзыв в новом месте" },
              ].map((b, i) => (
                <div key={i} className="group relative">
                  <div className={`h-12 w-12 rounded-full ${b.color} flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform cursor-help shadow-black/20`}>
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                    <div className="font-bold">{b.label}</div>
                    <div className="text-muted-foreground">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Следующие цели</div>
              {[
                { label: "Постоянный гость", progress: 80, target: "10/12 визитов" },
                { label: "Фотограф", progress: 45, target: "4/10 фото" },
              ].map((goal, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span>{goal.label}</span>
                    <span className="text-muted-foreground">{goal.target}</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/40 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function ClientPlaces({
  onLeaveReview,
}: {
  onLeaveReview: (place: string, rating: number, text: string, images: string[]) => void;
}) {
  const mockPlaces = [
    { name: "Coffee Lab", category: "Кафе", address: "ул. Абая, 12", distance: "200 м" },
    { name: "Barbershop K", category: "Красота", address: "пр. Достык, 45", distance: "450 м" },
    { name: "Fitness Pride", category: "Спорт", address: "ул. Сатпаева, 8", distance: "1.2 км" },
  ];

  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedPlace) {
      onLeaveReview(selectedPlace, rating, text, images);
      setSelectedPlace(null);
      setRating(5);
      setText("");
      setImages([]);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mockPlaces.map((p, i) => (
        <Card
          key={i}
          className="group overflow-hidden border-border/60 bg-card/50 transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5"
        >
          <CardContent className="p-0">
            <div className="h-40 bg-muted/30 relative flex items-center justify-center overflow-hidden">
              <MapPin className="h-12 w-12 text-primary opacity-20 transition-transform group-hover:scale-110" />
              <div className="absolute top-4 right-4 rounded-full bg-background/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-border/50">
                {p.distance}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                  {p.category}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1 tracking-tight">{p.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 opacity-80">
                <MapPin className="h-3.5 w-3.5" /> {p.address}
              </p>
              <Dialog
                open={selectedPlace === p.name}
                onOpenChange={(open) => (open ? setSelectedPlace(p.name) : setSelectedPlace(null))}
              >
                <DialogTrigger asChild>
                  <Button className="w-full mt-6 bg-primary/10 text-primary hover:bg-primary hover:text-white border-0 rounded-2xl h-11 font-semibold transition-all">
                    Оставить отзыв
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] border-border/60 bg-card/95 backdrop-blur-xl rounded-3xl">
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                      Отзыв для {p.name}
                    </DialogTitle>
                    <CardDescription className="text-base">
                      Ваш отзыв поможет заведению стать лучше, а вам принесет бонусы.
                    </CardDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Ваша оценка</Label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform active:scale-90"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                rating >= star
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground/30"
                              } transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Ваш комментарий</Label>
                        {images.length < 3 && (
                          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                            <Paperclip className="h-3.5 w-3.5" />
                            Прикрепить фото ({images.length}/3)
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                            />
                          </label>
                        )}
                      </div>
                      <Textarea
                        placeholder="Что вам особенно понравилось?..."
                        className="min-h-[120px] bg-background/50 border-border/60 focus:border-primary/50 text-base rounded-2xl p-4"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                      {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative h-14 w-14 rounded-lg border border-border overflow-hidden group"
                            >
                              <img src={img} alt="Preview" className="h-full w-full object-cover" />
                              <button
                                onClick={() => removeImage(idx)}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSubmit}
                      className="w-full h-12 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                      disabled={!text.trim()}
                    >
                      Отправить отзыв
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
