import { getOutputDimensions, mediaRules, type MediaKind } from "@shared/mediaRules";

export async function prepareImage(file: File, kind: MediaKind): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Le fichier sélectionné n’est pas une image.");
  const bitmap = await createImageBitmap(file);
  const output = getOutputDimensions(kind, bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de préparer l’image.");

  if (kind === "profile") {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.round((bitmap.width - side) / 2);
    const sy = Math.round((bitmap.height - side) / 2);
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, output.width, output.height);
  } else {
    context.drawImage(bitmap, 0, 0, output.width, output.height);
  }
  bitmap.close();

  const maxBytes = mediaRules[kind].maxBytes;
  for (const quality of [0.75, 0.65, 0.55, 0.45, 0.35]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.size <= maxBytes) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  }
  throw new Error(`L’image ne peut pas être compressée sous ${Math.round(maxBytes / 1024)} ko. Choisissez une image plus simple.`);
}
