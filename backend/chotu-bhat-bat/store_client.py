import httpx
from typing import Dict, Any, List
from config import MAIN_SERVICE_URL
from guardrails import sanitize_data_payload

async def get_raw_store_data() -> Dict[str, Any]:
    """
    Fetches catalog items and all orders from main-service.
    """
    items: List[Dict[str, Any]] = []
    orders: List[Dict[str, Any]] = []
    categories: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{MAIN_SERVICE_URL}/api/catalog/items")
            if r.status_code == 200:
                data = r.json()
                items = data.get("content", data) if isinstance(data, dict) else data
        except Exception:
            items = []

        try:
            r = await client.get(f"{MAIN_SERVICE_URL}/api/catalog/categories")
            if r.status_code == 200:
                categories = r.json()
        except Exception:
            categories = []

        try:
            r = await client.get(f"{MAIN_SERVICE_URL}/api/orders/all")
            if r.status_code == 200:
                orders = r.json()
        except Exception:
            orders = []

    # Clean any sensitive fields
    items = sanitize_data_payload(items)
    orders = sanitize_data_payload(orders)
    categories = sanitize_data_payload(categories)

    return {
        "items": items,
        "orders": orders,
        "categories": categories
    }

async def get_store_insights() -> Dict[str, Any]:
    """
    Computes comprehensive sales and inventory metrics.
    """
    data = await get_raw_store_data()
    items = data["items"]
    orders = data["orders"]
    categories = data["categories"]

    # 1. Inventory Analysis
    total_items = len(items)
    low_stock = [i for i in items if (i.get("stockQuantity") or 0) <= 20 and (i.get("stockQuantity") or 0) > 0]
    out_of_stock = [i for i in items if (i.get("stockQuantity") or 0) <= 0]
    total_inventory_units = sum(i.get("stockQuantity", 0) for i in items)
    total_inventory_valuation = sum(float(i.get("price", 0)) * (i.get("stockQuantity") or 0) for i in items)

    # 2. Sales & Orders Analysis
    total_orders = len(orders)
    paid_orders = [o for o in orders if o.get("status") == "PAID"]
    pending_orders = [o for o in orders if o.get("status") == "PENDING_PAYMENT"]
    failed_orders = [o for o in orders if o.get("status") == "FAILED"]

    total_revenue = sum(float(o.get("totalAmount", 0)) for o in paid_orders)
    pending_revenue = sum(float(o.get("totalAmount", 0)) for o in pending_orders)

    # Top selling items
    item_sales_count: Dict[str, int] = {}
    for o in paid_orders:
        for line in o.get("items", []):
            name = line.get("itemName") or f"Item #{line.get('itemId')}"
            qty = line.get("quantity") or 1
            item_sales_count[name] = item_sales_count.get(name, 0) + qty

    top_sellers = sorted(item_sales_count.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "inventory": {
            "total_products": total_items,
            "total_units_in_stock": total_inventory_units,
            "total_inventory_value_inr": round(total_inventory_valuation, 2),
            "out_of_stock_count": len(out_of_stock),
            "out_of_stock_items": [i.get("name") for i in out_of_stock],
            "low_stock_count": len(low_stock),
            "low_stock_items": [{"name": i.get("name"), "stock": i.get("stockQuantity")} for i in low_stock],
            "categories_count": len(categories)
        },
        "sales": {
            "total_orders": total_orders,
            "paid_orders_count": len(paid_orders),
            "total_realized_revenue_inr": round(total_revenue, 2),
            "pending_orders_count": len(pending_orders),
            "pending_revenue_inr": round(pending_revenue, 2),
            "failed_orders_count": len(failed_orders),
            "top_selling_items": [{"item": k, "units_sold": v} for k, v in top_sellers]
        },
        "recent_orders": [
            {
                "order_number": o.get("orderNumber"),
                "status": o.get("status"),
                "amount": o.get("totalAmount"),
                "customer": (o.get("user") or {}).get("fullName", "Guest"),
                "date": o.get("createdAt")
            }
            for o in orders[-5:]
        ] if orders else []
    }
