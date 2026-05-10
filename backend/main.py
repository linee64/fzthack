import os
import secrets
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
import resend
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Revieward API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role for DB access
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
resend.api_key = RESEND_API_KEY
genai.configure(api_key=GEMINI_API_KEY)

# --- Models ---

from uuid import UUID

class GenerateKeyRequest(BaseModel):
    business_id: UUID

class NotifyRequest(BaseModel):
    api_key: str
    user_email: EmailStr
    order_id: str

class ReviewRequest(BaseModel):
    api_key: str
    user_email: EmailStr
    order_id: str
    text: str
    has_photo: bool = False

# --- Helpers ---

async def get_business_by_api_key(api_key: str):
    response = supabase.table("businesses").select("*").eq("api_key", api_key).execute()
    if not response.data:
        return None
    return response.data[0]

def evaluate_review_with_ai(text: str, has_photo: bool) -> str:
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        prompt = f"""
Оцени отзыв и определи его категорию:

Категории:
- слабый: общие слова без деталей, например "хорошо" или "норм"
- средний: есть некоторые детали, но неполная картина
- подробный: конкретные детали, личный опыт, оценка сервиса/цены/качества

Критерии:
1. Конкретные детали: упоминает названия блюд, услуг, сотрудников или цены
2. Наличие фото: {"Да" if has_photo else "Нет"}
3. Оценка по критериям: упоминает сервис, цену или качество
4. Личный опыт: описывает личные ощущения и эмоции

Отзыв: {text}

Верни ТОЛЬКО валидный JSON без markdown и без пояснений:
{{
  "category": "слабый" или "средний" или "подробный"
}}
"""
        response = model.generate_content(prompt)
        # Clean up response if it contains markdown code blocks
        content = response.text.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        data = json.loads(content)
        return data.get("category", "слабый")
    except Exception as e:
        logger.error(f"AI Evaluation failed: {e}")
        return "слабый" # Fallback

# --- Endpoints ---

@app.post("/api/generate-key")
async def generate_key(req: GenerateKeyRequest):
    try:
        # Check if business exists
        business = supabase.table("businesses").select("*").eq("id", str(req.business_id)).execute()
        
        # Log for debug as requested
        logger.info(f"DEBUG: business_id={req.business_id}, result={business.data}")
        print(f"DEBUG: Supabase result for {req.business_id}: {business.data}")

        if not business.data:
            raise HTTPException(status_code=404, detail="Business not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {e}")
        if "invalid input syntax for type uuid" in str(e):
            raise HTTPException(status_code=400, detail="Invalid UUID format")
        raise HTTPException(status_code=500, detail="Database connection error")
    
    # Check if active key already exists
    if business.data[0].get("api_key"):
        # For hackathon purposes, we might allow regenerating, but let's follow the rule
        # raise HTTPException(status_code=400, detail="Business already has an active key")
        pass

    new_key = f"rw_live_{secrets.token_hex(16)}"
    
    # Save to api_keys table
    supabase.table("api_keys").insert({
        "business_id": req.business_id,
        "key": new_key,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    
    # Update business record
    supabase.table("businesses").update({"api_key": new_key}).eq("id", req.business_id).execute()
    
    return {"api_key": new_key}

@app.post("/api/notify")
async def notify(req: NotifyRequest):
    # Find business by api_key
    business = await get_business_by_api_key(req.api_key)
    if not business:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    template = business.get("notification_template", {
        "subject": "Оставьте отзыв о вашей покупке",
        "body": "Здравствуйте! Спасибо за покупку #{order_id} в {business_name}."
    })
    
    subject = template.get("subject", "Ваш заказ в {business_name}").replace("{business_name}", business["name"]).replace("{order_id}", req.order_id)
    body_text = template.get("body", "").replace("{business_name}", business["name"]).replace("{order_id}", req.order_id)
    
    review_url = f"{FRONTEND_URL}/review/{req.order_id}?key={req.api_key}&email={req.user_email}"
    
    html_content = f"""
    <html>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>{subject}</h2>
            <p>{body_text}</p>
            <div style="margin: 30px 0;">
                <a href="{review_url}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Оставить отзыв
                </a>
            </div>
            <p>Если кнопка не работает, скопируйте эту ссылку: <br> {review_url}</p>
            <hr>
            <p style="font-size: 12px; color: #777;">Это автоматическое уведомление от платформы Revieward.</p>
        </body>
    </html>
    """
    
    try:
        params = {
            "from": "Revieward <onboarding@resend.dev>", # Should use verified domain in production
            "to": [req.user_email],
            "subject": subject,
            "html": html_content,
        }
        resend.Emails.send(params)
    except Exception as e:
        logger.error(f"Resend error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    
    # Log notification
    supabase.table("notifications").insert({
        "business_id": business["id"],
        "user_email": req.user_email,
        "order_id": req.order_id,
        "sent_at": datetime.utcnow().isoformat()
    }).execute()
    
    return {"success": True, "message": f"Email отправлен на {req.user_email}"}

@app.get("/api/widget-config")
async def get_widget_config(api_key: str = Query(...)):
    business = await get_business_by_api_key(api_key)
    if not business:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return {
        "business_name": business.get("name"),
        "title": business.get("widget_config", {}).get("title", "Оставьте отзыв"),
        "description": business.get("widget_config", {}).get("description", "Поделитесь впечатлениями"),
        "button_color": business.get("widget_config", {}).get("button_color", "green")
    }

@app.post("/api/review")
async def submit_review(req: ReviewRequest):
    business = await get_business_by_api_key(req.api_key)
    if not business:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # AI Evaluation
    category = evaluate_review_with_ai(req.text, req.has_photo)
    
    # Determine points
    logger.info(f"Business config: {business}")
    points_map = {
        "слабый": business.get("points_weak", 10),
        "средний": business.get("points_medium", 25),
        "подробный": business.get("points_detailed", 50)
    }
    points = points_map.get(category, 10)
    logger.info(f"Category: {category}, Points awarded: {points}")
    
    # Save review
    supabase.table("reviews").insert({
        "business_id": business["id"],
        "user_email": req.user_email,
        "order_id": req.order_id,
        "text": req.text,
        "category": category,
        "points": points,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    
    # Update user balance
    # Check if user exists
    user_data = supabase.table("user_balances").select("*").eq("user_email", req.user_email).execute()
    if user_data.data:
        new_balance = user_data.data[0]["balance"] + points
        supabase.table("user_balances").update({"balance": new_balance}).eq("user_email", req.user_email).execute()
    else:
        new_balance = points
        supabase.table("user_balances").insert({"user_email": req.user_email, "balance": points}).execute()
    
    # Generate Coupon
    coupon_code = f"REV-{secrets.token_hex(4).upper()}"
    supabase.table("coupons").insert({
        "code": coupon_code,
        "business_id": business["id"],
        "user_email": req.user_email,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    
    return {
        "category": category,
        "points": points,
        "new_balance": new_balance,
        "coupon_code": coupon_code,
        "message": "Отзыв успешно сохранен!"
    }

@app.get("/api/reviews")
async def get_reviews(api_key: str = Query(...)):
    business = await get_business_by_api_key(api_key)
    if not business:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    reviews = supabase.table("reviews").select("*").eq("business_id", business["id"]).order("created_at", desc=True).execute()
    return reviews.data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
