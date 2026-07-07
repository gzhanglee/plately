const modes = {
  flat: {
    label: "Overhead",
    targetX: 0.5,
    targetY: 0.5,
    tip: "Go top-down and keep the rim just inside the circle."
  },
  angle: {
    label: "45 deg",
    targetX: 0.48,
    targetY: 0.6,
    tip: "Step back, use 2x if you can, and let the front edge fill the lower guide."
  },
  straight: {
    label: "Straight-on",
    targetX: 0.5,
    targetY: 0.58,
    tip: "Shoot level with the food and keep the table line calm."
  },
  macro: {
    label: "Macro",
    targetX: 0.5,
    targetY: 0.5,
    tip: "Fill the square with the best texture and tap the crispest edge."
  },
  drink: {
    label: "Drink",
    targetX: 0.38,
    targetY: 0.48,
    tip: "Put the glass in the tall guide and leave breathing room on one side."
  },
  spread: {
    label: "Table",
    targetX: 0.5,
    targetY: 0.52,
    tip: "Let the main dish own the middle zone and keep side plates at the edges."
  }
};

const dishes = {
  plate: {
    mode: "angle",
    angle: "45 deg",
    reason: "Shows sauce, height, and the table story.",
    tip: "Use 45 deg and let one side of the plate catch the light."
  },
  bowl: {
    mode: "angle",
    angle: "45 deg",
    reason: "Keeps depth visible inside the bowl.",
    tip: "Use 45 deg so the rim frames the food without hiding the center."
  },
  stack: {
    mode: "straight",
    angle: "Straight-on",
    reason: "Best for layers, height, and pours.",
    tip: "Go straight-on and keep the tallest edge slightly above center."
  },
  board: {
    mode: "flat",
    angle: "Overhead",
    reason: "Turns shapes and repeats into the composition.",
    tip: "Go overhead and arrange the board so shapes lead around the frame."
  },
  drink: {
    mode: "drink",
    angle: "Straight or 45 deg",
    reason: "Leaves room for glass height and shine.",
    tip: "Place the glass in the tall guide, then rotate it until the rim catches light."
  },
  texture: {
    mode: "macro",
    angle: "Macro",
    reason: "Makes steam, crisp edges, and gloss the subject.",
    tip: "Move close and make the most textured edge the hero."
  },
  table: {
    mode: "spread",
    angle: "Overhead",
    reason: "Keeps the meal readable as a full scene.",
    tip: "Keep the main dish in the center zone and let side plates frame it."
  }
};

const guides = {
  clean: {
    tip: "Keep the hero dish clear, then remove anything that distracts from it."
  },
  lines: {
    tip: "Use a utensil, table edge, or garnish line to point toward the best bite."
  },
  layers: {
    tip: "Build foreground, hero, and background so the dish feels deeper."
  },
  frame: {
    tip: "Let the plate, fork, glass, or napkin frame the ingredient people should notice."
  },
  pattern: {
    tip: "Repeat circles, slices, or small plates so the eye keeps moving."
  },
  space: {
    tip: "Leave one clean area of table for a calmer, more editorial crop."
  }
};

const state = {
  stream: null,
  facingMode: "environment",
  mode: "angle",
  dish: "plate",
  guide: "clean",
  lastTip: "",
  lastScore: null,
  lastReading: null,
  lastScores: null,
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
  anglePick: document.querySelector("#anglePick"),
  angleReason: document.querySelector("#angleReason"),
  lightDirection: document.querySelector("#lightDirection"),
  lightNote: document.querySelector("#lightNote"),
  lightCompass: document.querySelector("#lightCompass"),
  dishStrip: document.querySelector("#dishStrip"),
  modeStrip: document.querySelector("#modeStrip"),
  guideStrip: document.querySelector("#guideStrip"),
  horizonMeter: document.querySelector("#horizonMeter span"),
  reviewSheet: document.querySelector("#reviewSheet"),
  closeReview: document.querySelector("#closeReview"),
  closeReviewButton: document.querySelector("#closeReviewButton"),
  reviewImage: document.querySelector("#reviewImage"),
  reviewScore: document.querySelector("#reviewScore"),
  reviewTip: document.querySelector("#reviewTip"),
  reviewEdits: document.querySelector("#reviewEdits"),
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
  updateAngleCard();
  setTip(modes[mode].tip);
}

function setDish(dish) {
  const preset = dishes[dish];
  if (!preset) return;
  state.dish = dish;
  for (const button of els.dishStrip.querySelectorAll(".choice-button")) {
    button.classList.toggle("is-active", button.dataset.dish === dish);
  }
  setMode(preset.mode);
  updateAngleCard();
  setTip(preset.tip);
}

function setGuide(guide) {
  if (!guides[guide]) return;
  state.guide = guide;
  els.stage.dataset.guide = guide;
  for (const button of els.guideStrip.querySelectorAll(".choice-button")) {
    button.classList.toggle("is-active", button.dataset.guide === guide);
  }
  setTip(guides[guide].tip);
}

function updateAngleCard() {
  const preset = dishes[state.dish];
  const mode = modes[state.mode];
  if (!preset || !mode) return;
  const isRecommended = preset.mode === state.mode;
  els.anglePick.textContent = isRecommended ? preset.angle : mode.label;
  els.angleReason.textContent = isRecommended
    ? preset.reason
    : `${preset.angle} is the usual pick for this dish.`;
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showCameraMessage("This browser cannot open the camera. You can still explore the overlays here.");
    setTip("Open this app in a modern browser with camera access for the live coach.");
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
  let leftSum = 0;
  let rightSum = 0;
  let topSum = 0;
  let bottomSum = 0;
  let leftCount = 0;
  let rightCount = 0;
  let topCount = 0;
  let bottomCount = 0;

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

    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x < width * 0.42) {
      leftSum += luma;
      leftCount += 1;
    } else if (x > width * 0.58) {
      rightSum += luma;
      rightCount += 1;
    }
    if (y < height * 0.42) {
      topSum += luma;
      topCount += 1;
    } else if (y > height * 0.58) {
      bottomSum += luma;
      bottomCount += 1;
    }
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
    clipDarkPct,
    leftAvg: leftSum / Math.max(1, leftCount),
    rightAvg: rightSum / Math.max(1, rightCount),
    topAvg: topSum / Math.max(1, topCount),
    bottomAvg: bottomSum / Math.max(1, bottomCount)
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
  state.lastReading = reading;
  state.lastScores = {
    lightScore,
    sharpScore,
    colorScore,
    composeScore,
    contrastScore,
    score
  };
  els.scoreValue.textContent = String(score);
  els.lightMetric.textContent = String(lightScore);
  els.sharpMetric.textContent = String(sharpScore);
  els.colorMetric.textContent = String(colorScore);

  els.stage.style.setProperty("--focus-x", `${round(reading.focusX * 100)}%`);
  els.stage.style.setProperty("--focus-y", `${round(reading.focusY * 100)}%`);
  updateHorizon();
  updateLightCard(reading);

  const tip = chooseTip(reading, state.lastScores);
  setTip(tip);
}

function updateLightCard(reading) {
  const profile = describeLight(reading);
  els.lightDirection.textContent = profile.label;
  els.lightNote.textContent = profile.note;
  els.lightCompass.dataset.direction = profile.direction;
}

function describeLight(reading) {
  if (reading.clipBrightPct > 0.08) {
    return {
      label: "Glare",
      note: "Turn the plate until shine shows texture instead of a white patch.",
      direction: "glare"
    };
  }
  if (reading.avg < 95) {
    return {
      label: "Too dim",
      note: "Move closer to a window or brighter table edge.",
      direction: "dim"
    };
  }
  if (reading.avg > 178) {
    return {
      label: "Too bright",
      note: "Back away from hard light so highlights keep detail.",
      direction: "bright"
    };
  }

  const sideDelta = reading.leftAvg - reading.rightAvg;
  const verticalDelta = reading.topAvg - reading.bottomAvg;
  if (Math.abs(sideDelta) > 16) {
    return sideDelta > 0
      ? {
          label: "Left side",
          note: "Good side light. Rotate glossy food slightly toward it.",
          direction: "left"
        }
      : {
          label: "Right side",
          note: "Good side light. Keep shadows soft, not muddy.",
          direction: "right"
        };
  }
  if (Math.abs(verticalDelta) > 18) {
    return verticalDelta > 0
      ? {
          label: "Top heavy",
          note: "Angle the plate for shape; overhead light can flatten food.",
          direction: "top"
        }
      : {
          label: "Low light",
          note: "Lift the phone or plate so the main dish catches more light.",
          direction: "bottom"
        };
  }

  return {
    label: "Soft even",
    note: "Nice for clean flat lays. Add a darker surface if the food feels flat.",
    direction: "even"
  };
}

function chooseTip(reading, scores) {
  const preset = dishes[state.dish];
  if (preset && preset.mode !== state.mode && scores.composeScore < 72) {
    return `Try ${preset.angle.toLowerCase()} for this dish; it will read more naturally.`;
  }
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
  if (state.guide !== "clean" && scores.score > 66) {
    return guides[state.guide].tip;
  }
  if (state.mode === "angle" && scores.score > 74) {
    return "This angle is working. Take two shots, then try one slightly lower.";
  }
  if (state.mode === "straight" && scores.score > 74) {
    return "The height reads well. Take one clean shot, then add a hand or utensil for life.";
  }
  if (state.mode === "macro" && scores.score > 74) {
    return "Texture is landing. Shoot now before steam or gloss fades.";
  }
  return preset?.tip || modes[state.mode].tip;
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
  renderReviewEdits();
  els.reviewSheet.hidden = false;
}

function renderReviewEdits() {
  const edits = getReviewEdits();
  els.reviewEdits.replaceChildren();
  for (const edit of edits) {
    const item = document.createElement("li");
    item.textContent = edit;
    els.reviewEdits.append(item);
  }
}

function getReviewEdits() {
  const reading = state.lastReading;
  const scores = state.lastScores;
  const edits = [];

  if (!reading || !scores) {
    return [
      "Crop tighter around the main plate.",
      "Lift contrast so the food separates from the table.",
      "Try one alternate angle before sharing."
    ];
  }

  if (reading.clipBrightPct > 0.06) {
    edits.push("Lower highlights to bring detail back into glossy areas.");
  } else if (scores.lightScore < 55 && reading.avg < 110) {
    edits.push("Raise exposure slightly, then add contrast back to the food.");
  } else if (scores.lightScore < 55 && reading.avg > 166) {
    edits.push("Lower exposure a touch so sauces and pale plates keep texture.");
  }

  if (scores.colorScore < 60 && reading.redBlueRatio > 1.45) {
    edits.push("Cool white balance until whites look clean, not orange.");
  } else if (scores.colorScore < 60 && reading.redBlueRatio < 0.88) {
    edits.push("Warm white balance slightly so the food does not feel cold.");
  }

  if (scores.contrastScore < 50) {
    edits.push("Add a little contrast or black point for more shape.");
  }
  if (scores.composeScore < 58) {
    edits.push("Crop so the hero dish sits closer to the active guide.");
  }
  if (scores.sharpScore < 44) {
    edits.push("Retake with a steadier hand and tap the crispest edge.");
  }
  if (state.guide === "space") {
    edits.push("Keep the empty table area clean for a calmer social crop.");
  } else if (state.guide === "pattern") {
    edits.push("Square the crop if repeated shapes are the strongest part.");
  }

  while (edits.length < 3) {
    const fallback = [
      "Try a square crop and compare it with the full frame.",
      "Lift texture or clarity lightly on the food, not the background.",
      "Make one warmer and one cooler version before choosing."
    ][edits.length];
    edits.push(fallback);
  }

  return edits.slice(0, 3);
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
  els.dishStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dish]");
    if (button) setDish(button.dataset.dish);
  });
  els.guideStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-guide]");
    if (button) setGuide(button.dataset.guide);
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
setDish("plate");
setGuide("clean");
registerServiceWorker();
