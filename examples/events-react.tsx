// Example: core events in a React app. Call only after the action succeeded.
import { hardalTrack, hardalIdentify } from "./hardal-ready";

type Item = {
  item_id: string; item_name: string; item_brand: string; item_category: string;
  price: number; quantity: number;
};

const toValue = (items: Item[]) =>
  Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;

export async function onSignUp(email: string, password: string) {
  const user = await api.signUp(email, password);       // your own API
  hardalTrack("sign_up", { method: "Email" });
  hardalIdentify(user.id);                              // only sent if consent is granted
}

export async function onLogin(provider: "Email" | "Google") {
  const user = await api.login(provider);
  hardalTrack("login", { method: provider });
  hardalIdentify(user.id);
}

export async function onLeadSubmit(form: FormData) {
  const lead = await api.createLead(form);
  hardalTrack("generate_lead", { lead_id: lead.id, lead_source: "contact_form" });
}

export function onProductView(item: Item, currency = "USD") {
  hardalTrack("view_item", { currency, value: toValue([item]), items: [item] });
}

export function onAddToCart(item: Item, currency = "USD") {
  hardalTrack("add_to_cart", { currency, value: toValue([item]), items: [item] });
}

export function onBeginCheckout(items: Item[], currency = "USD") {
  hardalTrack("begin_checkout", { currency, value: toValue(items), items });
}

// On the order confirmation page. Skip if the backend already sends a server-confirmed purchase.
export function onOrderConfirmed(order: { id: string; total: number; tax: number; shipping: number; currency: string; items: Item[] }) {
  const key = `hrd_purchase_${order.id}`;
  if (sessionStorage.getItem(key)) return;              // guard against reloads
  sessionStorage.setItem(key, "1");
  hardalTrack("purchase", {
    transaction_id: order.id,
    value: order.total,                                 // excludes tax and shipping
    currency: order.currency,
    tax: order.tax,
    shipping: order.shipping,
    items: order.items,
  });
}

declare const api: any; // placeholder for the project's own API client
