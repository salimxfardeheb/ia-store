import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { orderId, customerEmail, productName, customerName, customerPhone, orderDate } =
    await req.json();

  const apiKey  = process.env.FLOWMERCE_API_KEY;
  const baseUrl = process.env.FLOWMERCE_BASE_URL;

  if (!apiKey)  return NextResponse.json({ error: "Flowmerce non configuré" },          { status: 503 });
  if (!baseUrl) return NextResponse.json({ error: "FLOWMERCE_BASE_URL non configurée" }, { status: 503 });

  let sessionRes: Response;
  try {
    sessionRes = await fetch(`${baseUrl}/api/checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        orderId:       orderId       ?? "",
        customerEmail: customerEmail ?? "",
        productName:   productName   ?? "",
        customerName:  customerName  ?? "",
        customerPhone: customerPhone ?? "",
        orderDate:     orderDate     ?? "",
        shopName:      "IA Store",
      }),
    });
  } catch {
    return NextResponse.json({ error: "Impossible de joindre Flowmerce" }, { status: 502 });
  }

  if (!sessionRes.ok) {
    const body = await sessionRes.text().catch(() => "");
    return NextResponse.json({ error: `Flowmerce: ${sessionRes.status} ${body}` }, { status: 502 });
  }

  const { url } = await sessionRes.json();
  return NextResponse.json({ url });
}
