/**
 * Register nearest-neighbor gallery.
 * Shows top-5 nearest-neighbor patches for each register token.
 * Displays cropped patch images (112x112 nearest-neighbor upscaled)
 * loaded from crop_url in the JSON data.
 */
(function () {
  'use strict';

  const GRID_ID = 'gallery-grid';
  const MODEL_SELECT_ID = 'gallery-model-select';
  const REG_SELECT_ID = 'gallery-reg-select';

  const MODEL_LABELS = {
    dinov2_reg: 'DINOv2+reg',
    dinov3_vits16: 'DINOv3',
  };

  let rawData = null;
  let currentModel = 'dinov2_reg';
  let currentReg = 'r1';

  async function loadData() {
    const resp = await fetch('/assets/data/howtocv/register_nn_vocab.json');
    rawData = await resp.json();
    renderGallery();
  }

  function renderGallery() {
    const grid = document.getElementById(GRID_ID);
    if (!grid || !rawData) return;

    const modelData = rawData[currentModel];
    if (!modelData || !modelData.registers[currentReg]) {
      grid.innerHTML = '<p>No data available for this combination.</p>';
      return;
    }

    const patches = modelData.registers[currentReg];
    const topK = patches.slice(0, 5);

    grid.innerHTML = topK.map((patch, i) => {
      const patchLoc = `row ${patch.patch_row}, col ${patch.patch_col}`;
      const cropSrc = patch.crop_url ? `/${patch.crop_url}` : '';

      return `
        <div class="gallery-item">
          <img src="${cropSrc}"
               alt="NN patch rank ${i + 1} (${patchLoc})"
               style="width:100%;aspect-ratio:1;border-radius:4px;margin-bottom:0.5rem;
                      image-rendering:pixelated;object-fit:cover;"
               loading="lazy" />
          <div class="sim-score">cos = ${(patch.similarity).toFixed(3)}</div>
          <div class="patch-info">Rank #${i + 1} · ${patchLoc}</div>
        </div>
      `;
    }).join('');
  }

  function setupControls() {
    const modelBtns = document.querySelectorAll(`#${MODEL_SELECT_ID} .howtocv-btn`);
    const regBtns = document.querySelectorAll(`#${REG_SELECT_ID} .howtocv-btn`);

    modelBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modelBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentModel = btn.dataset.model;
        renderGallery();
      });
    });

    regBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        regBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentReg = btn.dataset.reg;
        renderGallery();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupControls();
    loadData();
  });
})();
