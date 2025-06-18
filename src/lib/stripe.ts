import Stripe from "stripe";

if (!process.env.STRIPE_API_KEY) {
  throw new Error("STRIPE_API_KEY is not defined in environment variables. Please add it to your .env file.");
}

export const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: "2025-05-28.basil",
  typescript: true,
});
