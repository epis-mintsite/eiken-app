/**
 * クライアントサイドで画像をリサイズ・圧縮する。
 * Vercelの4.5MBリクエストサイズ制限に対応するため、
 * 画像の長辺を maxDimension に縮小し、JPEG品質を下げて返す。
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.8
): Promise<File> {
  // 既に1MB以下なら圧縮不要
  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // 長辺が maxDimension を超える場合のみリサイズ
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("画像の圧縮に失敗しました"));
            return;
          }
          const compressed = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = url;
  });
}
