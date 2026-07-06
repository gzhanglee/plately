const modes = {
  flat: {
    targetX: 0.5,
    targetY: 0.5,
    tip: "Go top-down and keep the rim just inside the circle."
  },
  angle: {
    targetX: 0.48,
    targetY: 0.6,
    tip: "Step back, use 2x if you can, and let the front edge fill the lower guide."
  },
  macro: {
    targetX: 0.5,
    targetY: 0.5,
    tip: "Fill the square with the best texture and tap the crispest edge."
  },
  drink: {
    targetX: 0.38,
    targetY: 0.48,
    tip: "Put the glass in the tall guide and leave breathing room on one side."
  },
  spread: {
    targetX: 0.5,
    targetY: 0.52,
    tip: "Let the main dish own the middle zone and keep side plates at the edges."
  }
};

const state = {
  stream: null,
  facingMode: "environment",
  mode: "flat",
  lastTip: "",
  lastScore: null,
  lastBlob: null,
  orientation: {
    beta: null,
    gamma: null
  }
};

const els = {
  body: document.body,
  stage: document.querySelector("#cameraStage"),
  video: document.querySelector("#cameraPreview"),
  canvas: document.querySelector("#analysisCanvas"),
  start: document.querySelector("#startCamera"),
  permissionPanel: document.querySelector("#permissionPanel"),
  permissionText: document.querySelector("#permissionText"),
  switchCamera: document.querySelector("#switchCamera"),
  capture: document.querySelector("#captureShot"),
  coachTip: document.querySelector("#coachTip"),
  scoreValue: document.querySelector("#scoreValue"),
  lightMetric: document.querySelector("#lightMetric"),
  sharpMetric: document.querySelector("#sharpMetric"),
  colorMetric: document.querySelector("#colorMetric"),
  modeStrip: document.querySelector("#modeStrip"),
  horizonMeter: document.querySelector("#horizonMeter span"),
  reviewSheet: document.querySelector("#reviewSheet"),
  closeReview: document.querySelector("#closeReview"),
  closeReviewButton: document.querySelector("#closeReviewButton"),
  reviewImage: document.querySelector("#reviewImage"),
  reviewScore: document.querySelector("#reviewScore"),
  reviewTip: document.querySelector("#reviewTip"),
  downloadShot: document.querySelector("#downloadShot"),
  shareShot: document.querySelector("#shareShot")
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(clamp(value, 0, 100));

function setTip(tip) {
  if (tip === state.lastTip) return;
  state.lastTip = tip;
  els.coachTip.textContent = tip;
}

function setMode(mode) {
  if (!modes[mode]) return;
  state.mode = mode;
  els.stage.dataset.mode = mode;
  for (const button of els.modeStrip.querySelectorAll(".mode-button")) {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  }
  setTip(modes[mode].tip);
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showCameraMessage("This browser cannot open the camera. You can still explore the overlays here.");
    setTip("Open this app in Chrome on your Pixel for the live camera coach.");
    return;
  }

  if (!window.isSecureContext) {
    showCameraMessage("Camera access needs HTTPS or localhost. Use the local URL on this computer, or deploy the app before opening it on your Pixel.");
    setTip("For phone testing, publish this as HTTPS or wrap it as a native app.");
    return;
  }

  stopCamera();

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: state.facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    els.video.srcObject = state.stream;
    await els.video.play();
    els.body.classList.add("camera-ready");
    setTip("Hold on the plate for a second while I read the light.");
    window.setTimeout(analyzeLoop, 250);
  } catch (error) {
    showCameraMessage("Camera permission was not granted, or no camera was found. The app is still showing the guide preview.");
    setTip("Allow camera access, then start again.");
  }
}

function stopCamera() {
  if (!state.stream) return;
  for (const track of state.stream.getTracks()) {
    track.stop();
  }
  state.stream = null;
  els.body.classList.remove("camera-ready");
}

function showCameraMessage(message) {
  els.permissionPanel.hidden = false;
  els.permissionText.textContent = message;
}

function analyzeLoop() {
  if (!state.stream || !els.video.videoWidth) return;
  const reading = readFrame();
  if (reading) updateCoach(reading);
  window.setTimeout(analyzeLoop, 520);
}

function readFrame() {
  const width = 120;
  const height = 90;
  const ctx = els.canvas.getContext("2d", { willReadFrequently: true });
  els.canvas.width = width;
  els.canvas.height = height;
  ctx.drawImage(els.video, 0, 0, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);
  const lumas = new Float32Array(width * height);
  let lumaSum = 0;
  let satSum = 0;
  let redSum = 0;
  let blueSum = 0;
  let clippedBright = 0;
  let clippedDark = 0;

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const sat = max === 0 ? 0 : (max - min) / max;

    lumas[pixel] = luma;
    lumaSum += luma;
    satSum += sat;
    redSum += r;
    blueSum += b;
    if (max > 244) clippedBright += 1;
    if (luma < 18) clippedDark += 1;
  }

  const pixels = width * height;
  const avg = lumaSum / pixels;
  const avgSat = satSum / pixels;
  let variance = 0;
  let sharpness = 0;
  let weightTotal = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      const luma = lumas[pixel];
      const delta = luma - avg;
      variance += delta * delta;

      if (x > 0) sharpness += Math.abs(luma - lumas[pixel - 1]);
      if (y > 0) sharpness += Math.abs(luma - lumas[pixel - width]);

      const weight = Math.abs(delta) * 0.22 + Math.max(0, luma - 80) * 0.08;
      weightTotal += weight;
      weightedX += x * weight;
      weightedY += y * weight;
    }
  }

  const contrast = Math.sqrt(variance / pixels);
  const focusX = weightTotal ? weightedX / weightTotal / width : 0.5;
  const focusY = weightTotal ? weightedY / weightTotal / height : 0.5;
  const redBlueRatio = redSum / Math.max(1, blueSum);
  const clipBrightPct = clippedBright / pixels;
  const clipDarkPct = clippedDark / pixels;
  const sharp = sharpness / (pixels * 2);

  return {
    avg,
    avgSat,
    contrast,
    sharp,
    focusX,
    focusY,
    redBlueRatio,
    clipBrightPct,
    clipDarkPct
  };
}

function updateCoach(reading) {
  const mode = modes[state.mode];
  const lightScore = round(100 - Math.abs(reading.avg - 132) * 0.72 - reading.clipBrightPct * 260 - reading.clipDarkPct * 160);
  const sharpScore = round((reading.sharp - 4) * 11);
  const colorScore = round(100 - Math.abs(reading.redBlueRatio - 1.18) * 70 + reading.avgSat * 10);
  const distance = Math.hypot(reading.focusX - mode.targetX, reading.focusY - mode.targetY);
  const composeScore = round(100 - distance * 170);
  const contrastScore = round(reading.contrast * 2.1);
  const score = round(lightScore * 0.34 + sharpScore * 0.22 + colorScore * 0.16 + composeScore * 0.2 + contrastScore * 0.08);

  state.lastScore = score;
  els.scoreValue.textContent = String(score);
  els.lightMetric.textContent = String(lightScore);
  els.sharpMetric.textContent = String(sharpScore);
  els.colorMetric.textContent = String(colorScore);

  els.stage.style.setProperty("--focus-x", `${round(reading.focusX * 100)}%`);
  els.stage.style.setProperty("--focus-y", `${round(reading.focusY * 100)}%`);
  updateHorizon();

  const tip = chooseTip(reading, {
    lightScore,
    sharpScore,
    colorScore,
    composeScore,
    contrastScore,
    score
  });
  setTip(tip);
}

function chooseTip(reading, scores) {
  if (reading.clipBrightPct > 0.08) {
    return "Turn the plate slightly away from the glare, then expose for the brightest sauce.";
  }
  if (scores.lightScore < 48 && reading.avg < 95) {
    return "Move closer to a window or brighter table edge before shooting.";
  }
  if (scores.lightScore < 50 && reading.avg > 178) {
    return "Pull back from the light source so the highlights keep texture.";
  }
  if (scores.sharpScore < 42) {
    return "Hold still and tap the crispest edge of the dish.";
  }
  if (scores.composeScore < 55) {
    return compositionTip(reading);
  }
  if (scores.colorScore < 58 && reading.redBlueRatio > 1.55) {
    return "Cool the scene a little by moving away from warm overhead light.";
  }
  if (scores.contrastScore < 48) {
    return "Add side light or a darker background so the food has shape.";
  }
  if (state.mode === "angle" && scores.score > 74) {
    return "This angle is working. Take two shots, then try one slightly lower.";
  }
  if (state.mode === "macro" && scores.score > 74) {
    return "Texture is landing. Shoot now before steam or gloss fades.";
  }
  return modes[state.mode].tip;
}

function compositionTip(reading) {
  const mode = modes[state.mode];
  const dx = reading.focusX - mode.targetX;
  const dy = reading.focusY - mode.targetY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "Nudge the phone right so the dish moves into the guide." : "Nudge the phone left so the dish moves into the guide.";
  }
  return dy > 0 ? "Raise the phone a touch so the dish sits higher in the guide." : "Lower the phone a touch so the dish sits lower in the guide.";
}

function updateHorizon() {
  const gamma = state.orientation.gamma;
  if (gamma === null || Number.isNaN(gamma)) return;
  const offset = clamp(gamma * 1.2, -34, 34);
  els.horizonMeter.style.transform = `translateX(calc(-50% + ${offset}px))`;
}

function drawDemoShot(canvas) {
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#38413e");
  gradient.addColorStop(1, "#151819");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(600, 680);
  ctx.rotate(-0.12);
  ctx.fillStyle = "#eee5d4";
  ctx.beginPath();
  ctx.ellipse(0, 0, 390, 390, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d94f3d";
  ctx.beginPath();
  ctx.ellipse(-44, 46, 190, 150, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1b84b";
  ctx.beginPath();
  ctx.arc(80, -60, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f8f6b";
  ctx.beginPath();
  ctx.ellipse(-100, -92, 72, 28, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(115, 128, 82, 30, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

async function captureShot() {
  const canvas = document.createElement("canvas");
  const hasVideo = state.stream && els.video.videoWidth;

  if (hasVideo) {
    canvas.width = els.video.videoWidth;
    canvas.height = els.video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(els.video, 0, 0, canvas.width, canvas.height);
  } else {
    drawDemoShot(canvas);
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  state.lastBlob = blob;
  const url = URL.createObjectURL(blob);

  els.reviewImage.src = url;
  els.downloadShot.href = url;
  els.downloadShot.download = `plateful-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg`;
  els.reviewScore.textContent = state.lastScore ? `${state.lastScore} score` : "Demo shot";
  els.reviewTip.textContent = state.lastTip || "Clean photo captured without guides.";
  els.reviewSheet.hidden = false;
}

async function shareShot() {
  if (!state.lastBlob) return;
  const file = new File([state.lastBlob], "plateful-shot.jpg", { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Plateful shot"
    });
    return;
  }
  els.reviewTip.textContent = "Sharing is not available here, but the download is ready.";
}

function closeReviewSheet() {
  els.reviewSheet.hidden = true;
}

function bindEvents() {
  els.start.addEventListener("click", startCamera);
  els.switchCamera.addEventListener("click", async () => {
    state.facingMode = state.facingMode === "environment" ? "user" : "environment";
    await startCamera();
  });
  els.capture.addEventListener("click", captureShot);
  els.modeStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (button) setMode(button.dataset.mode);
  });
  els.closeReview.addEventListener("click", closeReviewSheet);
  els.closeReviewButton.addEventListener("click", closeReviewSheet);
  els.shareShot.addEventListener("click", shareShot);

  window.addEventListener("deviceorientation", (event) => {
    state.orientation.beta = event.beta;
    state.orientation.gamma = event.gamma;
    updateHorizon();
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    // The app works without offline caching.
  }
}

bindEvents();
setMode("flat");
registerServiceWorker();
