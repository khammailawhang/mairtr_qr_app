import { supabase } from "@/lib/supabase";

export async function getMenuItems() {
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, name, description, price, category, image_url, is_available, sort_order",
    )
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  return { data: data ?? [], error };
}
