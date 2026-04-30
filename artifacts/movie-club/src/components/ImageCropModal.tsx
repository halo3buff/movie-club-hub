import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedBlob: Blob, originalFile: File) => Promise<void>;
  title: string;
  maxSize?: number;
  uploading?: boolean;
  error?: string | null;
  circularPreview?: boolean;
}

export function ImageCropModal({
  open,
  onOpenChange,
  onCropComplete,
  title,
  maxSize = 512,
  uploading = false,
  error: externalError,
  circularPreview = false,
}: ImageCropModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Invalid file type. Use PNG, JPG, GIF, or WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum 2MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const getCroppedImage = async (): Promise<Blob> => {
    if (!imgRef.current || !crop) {
      throw new Error("No image or crop");
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (crop.x / 100) * image.width * scaleX,
      y: (crop.y / 100) * image.height * scaleY,
      width: (crop.width / 100) * image.width * scaleX,
      height: (crop.height / 100) * image.height * scaleY,
    };

    const size = Math.min(maxSize, Math.max(pixelCrop.width, pixelCrop.height));
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      size,
      size
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        selectedFile?.type || "image/png",
        0.9
      );
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    try {
      const croppedBlob = await getCroppedImage();
      await onCropComplete(croppedBlob, selectedFile);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to crop image");
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCrop(undefined);
    setError(null);
    onOpenChange(false);
  };

  const displayError = externalError || error;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-black uppercase">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-12 h-12 text-white/50 mb-2" />
              <span className="text-white/70">Click to select image</span>
              <span className="text-white/50 text-sm mt-1">
                PNG, JPG, GIF, or WEBP (max 2MB)
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setCrop(undefined);
                  }}
                  className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  aspect={1}
                  circularCrop={circularPreview}
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Preview"
                    onLoad={onImageLoad}
                    className="max-h-64 mx-auto"
                  />
                </ReactCrop>
              </div>
            </div>
          )}

          {displayError && (
            <p className="text-red-400 text-sm font-medium">{displayError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border-4 border-white/30 text-white font-bold hover:border-white/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 px-4 py-3 bg-primary border-4 border-secondary text-secondary font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {uploading ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
