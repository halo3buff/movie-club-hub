import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropModal } from "@/components/ImageCropModal";
import { useGetAvatarUploadUrl, useUpdateAvatar, getGetMeQueryKey } from "@workspace/api-client-react";

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  username: string;
}

export function ProfilePictureUpload({ currentAvatarUrl, username }: ProfilePictureUploadProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync: getUploadUrl } = useGetAvatarUploadUrl();
  const { mutateAsync: updateAvatar } = useUpdateAvatar();

  const handleCropComplete = async (croppedBlob: Blob, originalFile: File) => {
    setUploading(true);
    setError(null);

    try {
      const { uploadUrl, publicUrl } = await getUploadUrl({
        data: {
          filename: `avatar.${originalFile.type.split("/")[1]}`,
          contentType: originalFile.type,
        },
      });

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": originalFile.type },
        body: croppedBlob,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      await updateAvatar({
        data: { avatarUrl: publicUrl },
      });

      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-4 border-secondary">
          <AvatarImage src={currentAvatarUrl ?? undefined} alt={username} />
          <AvatarFallback className="text-2xl font-bold bg-primary text-secondary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => setModalOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="w-8 h-8 text-white" />
        </button>
      </div>
      <div>
        <p className="font-bold text-lg">{username}</p>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm text-primary hover:underline"
        >
          Change profile picture
        </button>
      </div>

      <ImageCropModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCropComplete={handleCropComplete}
        title="Upload Profile Picture"
        maxSize={256}
        uploading={uploading}
        error={error}
        circularPreview={true}
      />
    </div>
  );
}
