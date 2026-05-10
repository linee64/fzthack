import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Star, 
  MessageSquare, 
  Check, 
  Loader2, 
  Award, 
  Gift, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { z } from "zod";

const reviewSearchSchema = z.object({
  key: z.string().optional(),
  email: z.string().optional(),
});

export const Route = createFileRoute("/review/$orderId")({
  validateSearch: (search) => reviewSearchSchema.parse(search),
  component: ReviewPage,
});

function ReviewPage() {
  const { orderId } = Route.useParams();
  const { key: apiKey, email: userEmail } = Route.useSearch();

  const [step, setStep] = useState<"confirm" | "form" | "success">("confirm");
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!apiKey) {
      toast.error("Отсутствует ключ доступа");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/api/widget-config?api_key=${apiKey}`)
      .then(res => {
        if (!res.ok) throw new Error("Не удалось загрузить настройки");
        return res.json();
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error("Ошибка загрузки данных заведения");
        setLoading(false);
      });
  }, [apiKey]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Пожалуйста, напишите отзыв");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          order_id: orderId,
          user_email: userEmail || "guest@example.com",
          text: text,
          has_photo: false
        })
      });

      if (!res.ok) throw new Error("Ошибка при отправке отзыва");
      
      const data = await res.json();
      setResult(data);
      setStep("success");
      toast.success("Отзыв принят!");
    } catch (err) {
      toast.error("Не удалось отправить отзыв");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <Card className="max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <h1 className="text-xl font-bold text-destructive">Ошибка доступа</h1>
            <p className="mt-2 text-muted-foreground">Ссылка недействительна или срок её действия истёк.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
          <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        </div>
        
        <Card className="w-full max-w-md border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-700 overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Подтверждение отзыва</CardTitle>
            <CardDescription className="text-base mt-2">
              Вы собираетесь оставить отзыв для заведения <br />
              <span className="font-bold text-foreground text-lg">{config.business_name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="rounded-xl bg-muted/30 p-4 border border-border/40">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Ваш заказ</div>
              <div className="text-lg font-mono font-bold">#{orderId}</div>
            </div>
            
            <Button 
              className="w-full h-12 text-lg font-bold shadow-[var(--shadow-glow)] transition-all active:scale-95" 
              onClick={() => setStep("form")}
            >
              Продолжить <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
              Ваш отзыв будет проанализирован AI для начисления бонусов
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{config.title || "Ваш отзыв"}</CardTitle>
            <CardDescription className="text-base">
              {config.description || "Поделитесь впечатлениями и получите бонусы"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-medium">Как вы оцениваете ваш визит?</label>
              <div className="flex justify-between px-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`h-10 w-10 ${
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
              <label className="text-sm font-medium">Расскажите подробнее</label>
              <Textarea 
                placeholder="Что вам понравилось больше всего?..."
                className="min-h-[150px] bg-background/50 border-border/60 focus:border-primary/50 text-base p-4 rounded-2xl"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground italic">
                💡 Совет: подробные отзывы приносят больше баллов!
              </p>
            </div>
            
            <Button 
              className="w-full h-14 text-xl font-bold shadow-lg transition-all active:scale-95"
              disabled={submitting}
              onClick={handleSubmit}
              style={{ backgroundColor: config.button_color === 'green' ? '#10b981' : config.button_color === 'purple' ? '#8b5cf6' : '#3b82f6' }}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Обработка...</>
              ) : (
                "Отправить отзыв"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        </div>
        
        <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
          <CardContent className="pt-12 pb-10 space-y-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20 animate-bounce-subtle">
              <Check className="h-12 w-12" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Спасибо!</h1>
              <p className="text-muted-foreground">Ваш отзыв успешно принят.</p>
            </div>
            
            <div className="py-4 px-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" /> Качество отзыва
                </div>
                <Badge className="bg-primary/20 text-primary border-0 font-bold uppercase tracking-wider text-[10px]">
                  {result.category}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Award className="h-4 w-4 text-primary" /> Получено баллов
                </div>
                <div className="text-xl font-bold text-primary">+{result.points}</div>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Ваш секретный купон</div>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex items-center justify-center rounded-2xl bg-background border-2 border-dashed border-primary/40 p-6">
                  <span className="font-mono text-2xl font-black tracking-widest text-primary">{result.coupon_code}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Покажите этот код сотруднику при следующем визите
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
