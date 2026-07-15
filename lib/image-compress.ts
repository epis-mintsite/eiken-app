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
  // JPEG/PNG/WebP かつ1MB以下ならそのまま送信可
  // （HEIC等はAI処理が非対応のため、サイズに関わらずJPEGへ変換する）
  const passthroughTypes = ["image/jpeg", "image/png", "image/webp"];
  if (file.size <= 1024 * 1024 && passthroughTypes.includes(file.type)) {
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
      const isHeic =
        /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      reject(
        new Error(
          isHeic
            ? "この環境ではHEIC形式を読み込めませんでした。iPhoneの設定＞カメラ＞フォーマットを「互換性優先」にするか、JPGに変換してからアップロードしてください。"
            : "画像の読み込みに失敗しました。別の画像でお試しください。"
        )
      );
    };

    img.src = url;
  });
}
