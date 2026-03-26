import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",  // ✅ stable version
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("BODY:", body)

    const { plan, charity_id, charity_percentage } = body

    const priceId =
      plan === "yearly"
        ? process.env.STRIPE_YEARLY_PRICE_ID
        : process.env.STRIPE_MONTHLY_PRICE_ID

    console.log("PRICE ID:", priceId)

    if (!priceId) {
      throw new Error("Missing Stripe price ID")
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/charity?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("❌ STRIPE ERROR:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}