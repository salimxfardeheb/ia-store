import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { orderId, customerEmail, productName, customerName, customerPhone, orderDate } =
    await req.json();

  const apiKey = process.env.FLOWMERCE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Flowmerce non configuré" }, { status: 503 });

  const params = new URLSearchParams({
    customer_email:     customerEmail     ?? "",
    order_id:           orderId           ?? "",
    product_name:       productName       ?? "",
    customer_name:      customerName      ?? "",
    customer_telephone: customerPhone     ?? "",
    order_date:         orderDate         ?? "",
    shop_name:          "IA Store",
  });

  return NextResponse.json({ url: `http://localhost:3000/return/${apiKey}?${params}` });
}
