import { supabase } from "@/lib/supabase";

// Generate a barcode like FW-XXXXXX
function generateBarcode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FW-${timestamp}-${random}`;
}

export async function deleteProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deleting product:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function insertProduct(owner_id, category_id, values) {
  try {
    let imageUrl = values.currentImageUrl || null;

  // Try uploading image but don't fail if bucket doesn't exist
  if (values.image instanceof Blob) {
    try {
      const safeName = values.name
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "")
        .toLowerCase();
      const fileName = `${safeName}_${Date.now()}.webp`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(`products/${fileName}`, values.image);
      if (uploadError) {
        console.error("Image upload failed:", uploadError.message);
        return { success: false, error: "Image upload failed: " + uploadError.message };
      } else {
        const { data } = supabase.storage
          .from("item-images")
          .getPublicUrl(`products/${fileName}`);
        imageUrl = data.publicUrl;
      }
    } catch (err) {
      console.error("Image upload error:", err.message);
      return { success: false, error: "Image upload error: " + err.message };
    }
  }

  // Ensure variants exist, default to a fallback if legacy formatting is used
  const variantsToInsert = (values.variants && values.variants.length > 0) 
    ? values.variants 
    : [{ size: values.size || null, quantity: values.quantity }];

  const insertPayload = variantsToInsert.map(variant => ({
      name: values.name,
      description: values.description || null,
      stock_quantity: variant.quantity,
      price: values.price,
      size: variant.size || null,
      color: values.color || null,
      barcode: values.barcode?.trim() || null, // Will use Postgres trigger if null
      image_url: imageUrl,
      owner_id: owner_id,
      category_id: category_id,
  }));

  const { data, error } = await supabase
    .from("products")
    .insert(insertPayload)
    .select();
    
    if (error) {
      console.error("Error inserting product:", error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error in insertProduct:", err);
    return { success: false, error: err.message || "An unexpected error occurred while adding the product" };
  }
}

export async function updateProduct(id, values) {
  try {
    let imageUrl = values.currentImageUrl;

  if (values.image instanceof Blob) {
    const safeName = values.name
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "")
      .toLowerCase();
    const fileName = `${safeName}_${Date.now()}.webp`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(`products/${fileName}`, values.image);
    if (uploadError) {
      console.error("Storage Error:", uploadError.message);
      return { success: false, error: "Image upload failed: " + uploadError.message };
    }
    const { data } = supabase.storage
      .from("item-images")
      .getPublicUrl(`products/${fileName}`);
    imageUrl = data.publicUrl;
  }

  const updateData = {
    name: values.name,
    stock_quantity: values.quantity,
    description: values.description,
    price: values.price,
    size: values.size || null,
    color: values.color || null,
    image_url: imageUrl,
  };

  // Only update barcode if provided
  if (values.barcode !== undefined) {
    updateData.barcode = values.barcode?.trim() || null;
  }

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Database Error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
  } catch (err) {
    console.error("Unexpected error in updateProduct:", err);
    return { success: false, error: err.message || "An unexpected error occurred while updating the product." };
  }
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
