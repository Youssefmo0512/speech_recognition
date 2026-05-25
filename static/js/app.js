const audioInput = document.querySelector("#audioInput");
const browseButton = document.querySelector("#browseButton");
const recordButton = document.querySelector("#recordButton");
const submitButton = document.querySelector("#submitButton");
const dropZone = document.querySelector("#dropZone");
const fileLabel = document.querySelector("#fileLabel");
const transcript = document.querySelector("#transcript");
const segments = document.querySelector("#segments");
const progress = document.querySelector("#progress");
const modelSize = document.querySelector("#modelSize");
const language = document.querySelector("#language");
const copyButton = document.querySelector("#copyButton");
const downloadButton = document.querySelector("#downloadButton");
const detectedLanguage = document.querySelector("#detectedLanguage");
const confidence = document.querySelector("#confidence");
const duration = document.querySelector("#duration");

const API_URL = window.TRANSCRIBE_API_URL || "/api/transcribe";

let selectedFile = null;
let recorder = null;
let recordedChunks = [];
let latestText = "";

const setBusy = (isBusy) => {
  submitButton.disabled = isBusy || !selectedFile;
  browseButton.disabled = isBusy;
  recordButton.disabled = isBusy && !recorder;
  modelSize.disabled = isBusy;
  language.disabled = isBusy;
  progress.hidden = !isBusy;
  submitButton.querySelector("span").textContent = isBusy ? "جاري التفريغ" : "ابدأ التفريغ";
};

const setFile = (file) => {
  selectedFile = file;
  fileLabel.textContent = file ? file.name : "أو اختر ملفًا من جهازك بصيغ WAV, MP3, M4A, WEBM";
  submitButton.disabled = !file;
};

const formatSeconds = (value) => {
  if (!Number.isFinite(value)) return "--";
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const renderResult = (result) => {
  latestText = result.text || "";
  transcript.textContent = latestText || "لم يتم العثور على كلام واضح داخل الملف.";
  transcript.dir = /[\u0600-\u06ff]/.test(latestText) ? "rtl" : "ltr";

  detectedLanguage.textContent = result.language || "--";
  confidence.textContent = result.language_probability
    ? `${Math.round(result.language_probability * 100)}%`
    : "--";
  duration.textContent = formatSeconds(result.duration);

  segments.innerHTML = "";
  (result.segments || []).forEach((segment) => {
    const row = document.createElement("div");
    row.className = "segment";
    row.innerHTML = `
      <time>${formatSeconds(segment.start)} - ${formatSeconds(segment.end)}</time>
      <p dir="auto"></p>
    `;
    row.querySelector("p").textContent = segment.text;
    segments.appendChild(row);
  });

  copyButton.disabled = !latestText;
  downloadButton.disabled = !latestText;
};

const transcribe = async () => {
  if (!selectedFile) return;

  setBusy(true);
  transcript.textContent = "يتم الآن تحليل الملف وتحميل النموذج عند الحاجة...";
  segments.innerHTML = "";

  const formData = new FormData();
  formData.append("audio", selectedFile);
  formData.append("model_size", modelSize.value);
  formData.append("language", language.value);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "حدث خطأ أثناء التفريغ.");
    renderResult(payload);
  } catch (error) {
    const isGithubPages = location.hostname.endsWith("github.io");
    transcript.textContent = isGithubPages
      ? "الواجهة تعمل من GitHub Pages، لكن التفريغ يحتاج تشغيل خادم Python أو نشر الباك إند على خدمة مثل Render أو Railway."
      : error.message;
    transcript.dir = "rtl";
  } finally {
    setBusy(false);
  }
};

browseButton.addEventListener("click", () => audioInput.click());
audioInput.addEventListener("change", () => setFile(audioInput.files[0]));
submitButton.addEventListener("click", transcribe);

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
});

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) setFile(file);
});

recordButton.addEventListener("click", async () => {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
    recordButton.querySelector("span").textContent = "تسجيل مباشر";
    recordButton.querySelector("i").setAttribute("data-lucide", "mic");
    lucide.createIcons();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    recorder = new MediaRecorder(stream);
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      setFile(new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" }));
    });
    recorder.start();
    recordButton.querySelector("span").textContent = "إيقاف التسجيل";
    recordButton.querySelector("i").setAttribute("data-lucide", "square");
    lucide.createIcons();
  } catch {
    transcript.textContent = "لم يتم السماح باستخدام الميكروفون.";
    transcript.dir = "rtl";
  }
});

copyButton.addEventListener("click", async () => {
  if (latestText) await navigator.clipboard.writeText(latestText);
});

downloadButton.addEventListener("click", () => {
  if (!latestText) return;
  const blob = new Blob([latestText], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transcript.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

window.addEventListener("load", () => {
  lucide.createIcons();
});
