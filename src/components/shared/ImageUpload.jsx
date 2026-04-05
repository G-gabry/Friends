import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

export function ImageUpload({ value, onChange }) {
  const [preview, setPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (value instanceof Blob) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }
    if (typeof value === "string") {
      setPreview(value);
    }
  }, [value]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: "image/webp",
      };

      try {
        setIsCompressing(true);
        const compressedFile = await imageCompression(file, options);

        onChange(compressedFile);
      } catch (error) {
        console.error("Compression Error:", error);
        onChange(file);
      } finally {
        setIsCompressing(false);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: isCompressing,
  });

  return (
    <div className="w-full mx-auto mt-2">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all
          ${isDragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary/50"}
          ${isCompressing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />

        {isCompressing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {preview ? (
          <div className="relative h-32 w-full group">
            <img
              src={preview}
              className="w-full h-full object-cover rounded-lg border"
              alt="preview"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              type="button"
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-xs text-slate-600">
              {isDragActive
                ? "Drop here"
                : "Drag & drop or click (Auto-compress enabled)"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
