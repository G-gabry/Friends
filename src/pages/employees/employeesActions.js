import { supabase } from "@/lib/supabase";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

function getAvatarPath(url) {
  return decodeURIComponent(url.split("/public/avatars/")[1]?.split("?")[0]);
}

function buildFileName(name) {
  return `${name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")}-${Date.now()}.webp`;
}

async function uploadAvatar(name, blob) {
  const fileName = buildFileName(name);
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, blob, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    return {
      url: null,
      error: `Image upload failed: ${uploadError.message}`,
    };
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}

async function deleteAvatar(imgUrl) {
  if (!imgUrl) return;

  const pathToFile = getAvatarPath(imgUrl);
  const { error } = await supabase.storage.from("avatars").remove([pathToFile]);

  if (error) {
    console.error("Error deleting avatar:", error.message);
  }
}

export async function insertEmployee(values) {
  try {
    let imageUrl = values.currentImageUrl;

    if (values.image instanceof Blob) {
      const { url, error } = await uploadAvatar(values.name, values.image);
      if (error) return { success: false, error };
      imageUrl = url;
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;

    console.log("DEBUG: Attempting DIRECT FETCH for create-employee...");

    const response = await fetch(`${baseUrl}/functions/v1/create-employee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
        avatar_url: imageUrl,
      }),
    });

    const authData = await response.json();
    const errorMessage = authData?.error || authData?.details || authData?.message || `HTTP Error ${response.status}`;

    if (!response.ok || authData?.error) {
      console.error("DEBUG: Direct Insert failed.", { status: response.status, authData });
      return { success: false, error: errorMessage };
    }

    return { success: true, data: authData };
  } catch (err) {
    console.error("Unexpected error in insertEmployee:", err);
    return { success: false, error: err.message || "An unexpected network or logic error occurred" };
  }
}

export async function deleteEmployee(userId, imgUrl) {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;

    console.log("DEBUG: Attempting DIRECT FETCH for delete-user...");
    console.log("DEBUG: Session Status:", token ? "Token Found" : "MISSING TOKEN");

    const response = await fetch(`${baseUrl}/functions/v1/delete-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ userId }),
    });

    const authData = await response.json();
    const errorMessage = authData?.error || authData?.details || authData?.message || `HTTP Error ${response.status}`;

    if (!response.ok || authData?.error) {
      console.error("DEBUG: Direct Delete failed.", { status: response.status, authData });
      return { success: false, error: errorMessage };
    }

    await deleteAvatar(imgUrl);
    return { success: true, data: authData };
  } catch (err) {
    console.error("Unexpected error in deleteEmployee:", err);
    return { success: false, error: err.message || "An unexpected network or logic error occurred" };
  }
}

export async function updateEmployee(values, userId, imgUrl) {
  if (!userId) {
    return { success: false, error: "User ID is not defined" };
  }

  try {
    let imageUrl = values.currentImageUrl;
    let newImageUploaded = false;

    if (values.image instanceof Blob) {
      const { url, error: uploadError } = await uploadAvatar(
        values.name,
        values.image,
      );
      if (uploadError) return { success: false, error: uploadError };
      imageUrl = url;
      newImageUploaded = true;
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;

    console.log("DEBUG: Attempting DIRECT FETCH for update-user...");

    const response = await fetch(`${baseUrl}/functions/v1/update-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        userId,
        email: values.email,
        password: values.password || undefined,
        name: values.name,
        role: values.role,
        avatar_url: imageUrl,
      }),
    });

    const authData = await response.json();
    const errorMessage = authData?.error || authData?.details || authData?.message || `HTTP Error ${response.status}`;

    if (!response.ok || authData?.error) {
      console.error("DEBUG: Direct Update failed.", { status: response.status, authData });
      if (newImageUploaded) await deleteAvatar(imageUrl);
      return { success: false, error: errorMessage };
    }

    if (newImageUploaded) await deleteAvatar(imgUrl);

    return { success: true, data: authData };
  } catch (err) {
    console.error("Unexpected error in updateEmployee:", err);
    return { success: false, error: err.message || "An unexpected network or logic error occurred" };
  }
}
