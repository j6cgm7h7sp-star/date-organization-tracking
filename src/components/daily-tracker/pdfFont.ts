import jsPDF from "jspdf";

const FONT_REGULAR_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/static/Roboto-Regular.ttf";
const FONT_BOLD_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/static/Roboto-Bold.ttf";

let cachedRegular: string | null = null;
let cachedBold: string | null = null;

async function fetchFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk))
    );
  }
  return btoa(binary);
}

export async function registerCyrillicFont(doc: jsPDF): Promise<string> {
  if (!cachedRegular) {
    cachedRegular = await fetchFontAsBase64(FONT_REGULAR_URL);
  }
  if (!cachedBold) {
    cachedBold = await fetchFontAsBase64(FONT_BOLD_URL);
  }
  doc.addFileToVFS("Roboto-Regular.ttf", cachedRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", cachedBold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
  return "Roboto";
}
