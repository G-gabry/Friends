import { supabase } from "@/lib/supabase";

export async function insertCustomer(values) {
  const { data, error } = await supabase
    .from("customers")
    .insert([
      {
        name: values.name,
        phone: values.phone,
        address: values.address || null,
        notes: values.notes || null,
      },
    ])
    .select();

  if (error) {
    console.error("Error inserting customer:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function updateCustomer(id, values) {
  const { data, error } = await supabase
    .from("customers")
    .update({
      name: values.name,
      phone: values.phone,
      address: values.address || null,
      notes: values.notes || null,
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating customer:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function deleteCustomer(id) {
  const { data, error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deleting customer:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}
