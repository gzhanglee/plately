import Script from "next/script";

export default function Home() {
  return (
    <>
      <main className="app-shell">
        <section
          className="camera-stage"
          id="cameraStage"
          data-mode="flat"
          aria-label="Camera preview"
        >
          <video
            id="cameraPreview"
            className="camera-preview"
            autoPlay
            muted
            playsInline
          />
          <canvas
            id="analysisCanvas"
            className="analysis-canvas"
            width="120"
            height="90"
          />

          <div className="demo-table" aria-hidden="true">
            <div className="demo-plate">
              <span className="demo-yolk" />
              <span className="demo-leaf leaf-one" />
              <span className="demo-leaf leaf-two" />
            </div>
            <div className="demo-cutlery" />
          </div>

          <header className="top-bar">
            <div>
              <p className="eyebrow">Plateful</p>
              <h1>Camera coach</h1>
            </div>
            <div className="top-actions" aria-label="Camera controls">
              <button
                className="icon-button"
                id="switchCamera"
                type="button"
                aria-label="Switch camera"
                title="Switch camera"
              >
                <span className="icon flip-icon" aria-hidden="true" />
              </button>
              <button
                className="score-pill"
                id="scorePill"
                type="button"
                aria-label="Current shot score"
              >
                <span id="scoreValue">--</span>
                <span>score</span>
              </button>
            </div>
          </header>

          <div className="shot-overlay" id="shotOverlay" aria-hidden="true">
            <div className="thirds-grid" />
            <div className="plate-ring" />
            <div className="angle-rail" />
            <div className="macro-window" />
            <div className="drink-column" />
            <div className="spread-zones">
              <span />
              <span />
              <span />
            </div>
            <div className="focus-marker" id="focusMarker" />
            <div className="horizon-meter" id="horizonMeter">
              <span />
            </div>
          </div>

          <div className="permission-panel" id="permissionPanel">
            <div className="camera-glyph" aria-hidden="true" />
            <p className="panel-kicker">Live preview</p>
            <h2>Point at your plate.</h2>
            <p id="permissionText">
              The coach will read the light and frame, then suggest one small
              adjustment.
            </p>
            <button className="primary-button" id="startCamera" type="button">
              Start camera
            </button>
          </div>

          <button
            className="shutter-button"
            id="captureShot"
            type="button"
            aria-label="Capture shot"
          >
            <span />
          </button>
        </section>

        <section className="coach-panel" aria-label="Food photography coach">
          <div className="coach-line">
            <p className="coach-label">Now</p>
            <p id="coachTip">Choose a shot style and start the camera.</p>
          </div>

          <div className="metric-row" aria-label="Shot readings">
            <div className="metric">
              <span id="lightMetric">--</span>
              <p>light</p>
            </div>
            <div className="metric">
              <span id="sharpMetric">--</span>
              <p>sharp</p>
            </div>
            <div className="metric">
              <span id="colorMetric">--</span>
              <p>color</p>
            </div>
          </div>

          <div className="mode-strip" id="modeStrip" aria-label="Shot styles">
            <button
              className="mode-button is-active"
              type="button"
              data-mode="flat"
            >
              <span className="mode-icon flat-icon" aria-hidden="true" />
              <span>Flat lay</span>
            </button>
            <button className="mode-button" type="button" data-mode="angle">
              <span className="mode-icon angle-icon" aria-hidden="true" />
              <span>45 deg</span>
            </button>
            <button className="mode-button" type="button" data-mode="macro">
              <span className="mode-icon macro-icon" aria-hidden="true" />
              <span>Macro</span>
            </button>
            <button className="mode-button" type="button" data-mode="drink">
              <span className="mode-icon drink-icon" aria-hidden="true" />
              <span>Drink</span>
            </button>
            <button className="mode-button" type="button" data-mode="spread">
              <span className="mode-icon spread-icon" aria-hidden="true" />
              <span>Table</span>
            </button>
          </div>
        </section>

        <section
          className="review-sheet"
          id="reviewSheet"
          hidden
          aria-label="Captured shot review"
        >
          <div className="review-backdrop" id="closeReview" />
          <div className="review-card">
            <div className="review-header">
              <div>
                <p className="eyebrow">Captured</p>
                <h2 id="reviewScore">Shot saved</h2>
              </div>
              <button
                className="icon-button"
                id="closeReviewButton"
                type="button"
                aria-label="Close review"
                title="Close review"
              >
                <span className="icon close-icon" aria-hidden="true" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img id="reviewImage" alt="Captured food shot" />
            <p id="reviewTip" className="review-tip">
              Clean photo captured without guides.
            </p>
            <div className="review-actions">
              <a
                className="secondary-button"
                id="downloadShot"
                href="#"
                download="plateful-shot.jpg"
              >
                Download
              </a>
              <button className="primary-button" id="shareShot" type="button">
                Share
              </button>
            </div>
          </div>
        </section>
      </main>

      <Script src="/app.js" type="module" strategy="afterInteractive" />
    </>
  );
}
