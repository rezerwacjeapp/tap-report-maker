import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, ImagePlus } from "lucide-react";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export function PhotoGallery({ photos, onChange, max = 6 }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (photos.length >= max) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = (h / w) * maxDim; w = maxDim; }
            else { w = (w / h) * maxDim; h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          const resized = canvas.toDataURL("image/jpeg", 0.7);
          onChange([...photos, resized]);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const remove = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Camera input — opens camera on mobile */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={addPhoto} />
      {/* File input — opens gallery/files picker */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={addPhoto} multiple />

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div key={i} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted">
            <img src={photo} alt={`Zdjęcie ${i + 1}`} className="h-full w-full object-cover" />
            <button
              onClick={() => remove(i)}
              className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Camera className="h-6 w-6" />
            <span className="text-[10px] font-medium">Zdjęcie</span>
          </button>
        )}
      </div>
      {photos.length < max && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => cameraRef.current?.click()}>
            <Camera className="h-4 w-4 mr-1.5" /> Zrób zdjęcie
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4 mr-1.5" /> Z galerii
          </Button>
        </div>
      )}
      {photos.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">{photos.length}/{max} zdjęć</p>
      )}
    </div>
  );
}
