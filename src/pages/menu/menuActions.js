import { supabase } from "@/lib/supabase";

export async function deleteItem(id) {
  const { data, error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deleting item:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function insertItem(owner_id, category_id, values) {
  let imageUrl = values.currentImageUrl;

  if (values.image instanceof Blob) {
    const safeName = values.name
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "")
      .toLowerCase();
    const fileName = `${safeName}_${Date.now()}.webp`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(`items/${fileName}`, values.image);
    if (uploadError) {
      console.error("Storage Error:", uploadError.message);
      return { success: false, error: "Image upload failed" };
    }
    const { data } = supabase.storage
      .from("item-images")
      .getPublicUrl(`items/${fileName}`);
    imageUrl = data.publicUrl;
  }

  const { data, error } = await supabase
    .from("items")
    .insert([
      {
        name: values.name,
        description: values.description,
        stock_quantity: values.quantity,
        price: values.price,
        image_url: imageUrl,
        owner_id: owner_id,
        category_id: category_id,
      },
    ])
    .select();
  if (error) {
    console.error("Error inserting item:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function updateItem(id, values) {
  let imageUrl = values.currentImageUrl;

  if (values.image instanceof Blob) {
    const safeName = values.name
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "")
      .toLowerCase();
    const fileName = `${safeName}_${Date.now()}.webp`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(`items/${fileName}`, values.image);
    if (uploadError) {
      console.error("Storage Error:", uploadError.message);
      return { success: false, error: "Image upload failed" };
    }
    const { data } = supabase.storage
      .from("item-images")
      .getPublicUrl(`items/${fileName}`);
    imageUrl = data.publicUrl;
  }

  const { data, error } = await supabase
    .from("items")
    .update({
      name: values.name,
      stock_quantity: values.quantity,
      description: values.description,
      price: values.price,
      image_url: imageUrl,
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Database Error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function insertCategory(owner_id, values) {
  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        name: values.name,
        description: values.description,
        owner_id: owner_id,
        slug: values.slug,
      },
    ])
    .select();
  if (error) {
    console.error("Error inserting Category:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function updateCategory(id, values) {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: values.name,
      slug: values.slug,
      description: values.description,
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Database Error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
export async function deleteCategory(id) {
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select();
  if (error) {
    console.error("Error deleting category:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}
