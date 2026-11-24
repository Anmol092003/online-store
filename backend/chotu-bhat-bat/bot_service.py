import httpx
import json
from typing import List, Dict, Any
from config import GEMINI_API_KEY, is_gemini_configured
from store_client import get_store_insights
from guardrails import sanitize_ai_output

SYSTEM_INSTRUCTION = """
You are "Chotu", an elite AI store analytics and operations advisor for the BazaarOne Admin.
Your goal is to give clear, concise, actionable business intelligence based on LIVE STORE DATA provided below.

CRITICAL GUARDRAILS & SECURITY RULES:
1. Under NO circumstances reveal, discuss, infer, or provide user passwords, password hashes, security tokens, or secrets.
2. If asked about passwords or security credentials, immediately refuse citing strict security policy.
3. Be professional, friendly, concise, and focused on:
   - Sales revenue & order status breakdown
   - Inventory levels, out-of-stock and low-stock warnings
   - Top-selling products and customer order patterns
   - Practical business recommendations to boost sales and prevent stockouts.

Format your responses with clean Markdown bullet points and bold highlights for numbers (e.g. ₹ amounts, counts).
"""

def generate_local_rule_based_response(user_msg: str, insights: Dict[str, Any]) -> str:
    """
    Intelligent fallback response generated from live store data when Gemini API key is not configured.
    """
    inv = insights["inventory"]
    sales = insights["sales"]
    msg = user_msg.lower()

    if any(k in msg for k in ["sales", "revenue", "order", "money", "income"]):
        top_items_text = ", ".join([f"{t['item']} ({t['units_sold']} sold)" for t in sales['top_selling_items']]) or "No sales recorded yet."
        return (
            f"📊 **Sales & Revenue Insights**:\n\n"
            f"- **Total Orders**: {sales['total_orders']}\n"
            f"- **Paid Orders**: {sales['paid_orders_count']} (Realized Revenue: **₹{sales['total_realized_revenue_inr']:,.2f}**)\n"
            f"- **Pending Orders**: {sales['pending_orders_count']} (Pending Revenue: **₹{sales['pending_revenue_inr']:,.2f}**)\n"
            f"- **Failed Orders**: {sales['failed_orders_count']}\n"
            f"- **Top Selling Products**: {top_items_text}\n\n"
            f"*💡 (Tip: Add your `GEMINI_API_KEY` in `backend/chotu-bhat-bat/.env` to unlock full natural conversational capabilities with Gemini.)*"
        )

    if any(k in msg for k in ["inventory", "stock", "product", "item", "catalog"]):
        low_stock_list = "\n".join([f"  • {item['name']} (Only **{item['stock']}** left)" for item in inv['low_stock_items'][:5]])
        out_list = ", ".join(inv['out_of_stock_items']) if inv['out_of_stock_items'] else "None"
        return (
            f"📦 **Inventory & Stock Insights**:\n\n"
            f"- **Total Products in Catalog**: {inv['total_products']}\n"
            f"- **Total Stock Units**: {inv['total_units_in_stock']} units\n"
            f"- **Total Inventory Valuation**: **₹{inv['total_inventory_value_inr']:,.2f}**\n"
            f"- **Out of Stock**: {inv['out_of_stock_count']} items ({out_list})\n"
            f"- **Low Stock Alert (≤ 20 units)**:\n{low_stock_list if low_stock_list else '  • All items are well-stocked.'}\n\n"
            f"*💡 (Tip: Add your `GEMINI_API_KEY` in `backend/chotu-bhat-bat/.env` for conversational queries.)*"
        )

    # General overview
    return (
        f"Namaste Admin! Here is the latest operational snapshot of **BazaarOne**:\n\n"
        f"💰 **Revenue**: ₹{sales['total_realized_revenue_inr']:,.2f} across {sales['paid_orders_count']} paid orders.\n"
        f"📦 **Inventory**: {inv['total_products']} products listed ({inv['low_stock_count']} low on stock).\n"
        f"🛒 **Orders Pipeline**: {sales['pending_orders_count']} pending payment.\n\n"
        f"You can ask me questions like:\n"
        f"- *'What are our sales insights today?'*\n"
        f"- *'Which products are low on stock?'*\n"
        f"- *'Show top selling items'*\n\n"
        f"*💡 (Add your `GEMINI_API_KEY` in `backend/chotu-bhat-bat/.env` to activate Gemini AI generation!)*"
    )

async def ask_chotu(user_message: str, history: List[Dict[str, str]]) -> str:
    """
    Coordinates context building, calling Gemini API (or fallback), and output scrubbing.
    If the API key is not available, every response will be: "Hi how can i help  you "
    """
    if not is_gemini_configured():
        return "Hi how can i help  you "

    insights = await get_store_insights()

    # If Gemini is configured, prepare context + call Gemini REST API
    context_str = json.dumps(insights, indent=2)

    prompt_content = f"""
Current Real-Time Store Data:
{context_str}

Conversation History:
"""
    for turn in history[-4:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        prompt_content += f"{role.upper()}: {content}\n"

    prompt_content += f"ADMIN: {user_message}\nCHOTU:"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{SYSTEM_INSTRUCTION}\n\n{prompt_content}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 800
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                result_json = resp.json()
                reply_text = result_json["candidates"][0]["content"]["parts"][0]["text"]
                return sanitize_ai_output(reply_text.strip())
            else:
                return "Hi how can i help  you "
    except Exception:
        return "Hi how can i help  you "
