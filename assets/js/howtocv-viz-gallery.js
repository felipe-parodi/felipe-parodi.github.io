/**
 * Interactive visualization gallery for the blog primer and ablation sections.
 * Supports 4 visualization types:
 *   1. PCA patch features
 *   2. Patch norm heatmaps
 *   3. Attention map overlays (CLS + register)
 *   4. Ablation PCA (full / zero_cls / zero_registers)
 */
(function () {
  'use strict';

  // Detect if running from Jekyll (absolute paths) or local preview (relative)
  const isJekyll = window.location.pathname.indexOf('/20') !== -1;  // Jekyll posts have /2026-...
  const BASE = isJekyll
    ? '/assets/images/howtocv/interactive_viz'
    : 'assets/images/howtocv/interactive_viz';

  const MODELS = ['dinov2_no_reg', 'dinov2_reg', 'dinov3_vits16'];
  const MODEL_LABELS = {
    dinov2_no_reg: 'DINOv2',
    dinov2_reg: 'DINOv2+reg',
    dinov3_vits16: 'DINOv3',
  };
  const IMAGES = ['img0', 'img1', 'img2', 'img3', 'img4'];
  const IMAGE_LABELS = ['Fish', 'Bird', 'Dog', 'Building', 'Food'];

  // ─── PCA Gallery (primer section) ───
  function setupPcaGallery() {
    const container = document.getElementById('pca-gallery');
    if (!container) return;

    const state = { image: 'img0' };

    function render() {
      const grid = container.querySelector('.viz-grid');
      grid.innerHTML = MODELS.map(m =>
        `<div class="viz-cell">
          <div class="viz-label">${MODEL_LABELS[m]}</div>
          <img src="${BASE}/pca/${m}_${state.image}.png"
               alt="PCA features ${MODEL_LABELS[m]}"
               loading="lazy">
        </div>`
      ).join('');
    }

    // Image selector
    container.querySelectorAll('.viz-img-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.viz-img-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.image = btn.dataset.img;
        render();
      });
    });

    render();
  }

  // ─── Norm Gallery (artifact section) ───
  function setupNormGallery() {
    const container = document.getElementById('norm-gallery');
    if (!container) return;

    const state = { image: 'img0' };

    function render() {
      const grid = container.querySelector('.viz-grid');
      grid.innerHTML = MODELS.map(m =>
        `<div class="viz-cell">
          <div class="viz-label">${MODEL_LABELS[m]}</div>
          <img src="${BASE}/norms/${m}_${state.image}.png"
               alt="Patch norms ${MODEL_LABELS[m]}"
               loading="lazy">
        </div>`
      ).join('');
    }

    container.querySelectorAll('.viz-img-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.viz-img-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.image = btn.dataset.img;
        render();
      });
    });

    render();
  }

  // ─── Attention Gallery ───
  function setupAttnGallery() {
    const container = document.getElementById('attn-gallery');
    if (!container) return;

    const state = { image: 'img0', mode: 'cls' };

    function render() {
      const grid = container.querySelector('.viz-grid');
      grid.innerHTML = MODELS.map(m => {
        const suffix = state.mode === 'regs' && m === 'dinov2_no_reg'
          ? 'cls'  // DINOv2 has no registers, fall back to CLS
          : state.mode;
        const note = state.mode === 'regs' && m === 'dinov2_no_reg'
          ? ' <span class="viz-note">(no registers)</span>'
          : '';
        return `<div class="viz-cell">
          <div class="viz-label">${MODEL_LABELS[m]}${note}</div>
          <img src="${BASE}/attention/${m}_${state.image}_${suffix}.png"
               alt="Attention ${suffix} ${MODEL_LABELS[m]}"
               loading="lazy">
        </div>`;
      }).join('');
    }

    container.querySelectorAll('.viz-img-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.viz-img-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.image = btn.dataset.img;
        render();
      });
    });

    container.querySelectorAll('.viz-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
        render();
      });
    });

    render();
  }

  // ─── Ablation PCA Gallery ───
  function setupAblationGallery() {
    const container = document.getElementById('ablation-gallery');
    if (!container) return;

    const state = { image: 'img0', model: 'dinov3_vits16' };
    const ABLATIONS = ['full', 'zero_cls', 'zero_registers'];
    const ABL_LABELS = {
      full: 'Full Model',
      zero_cls: 'Zero CLS',
      zero_registers: 'Zero Registers',
    };

    function render() {
      const grid = container.querySelector('.viz-grid');
      const abls = state.model === 'dinov2_no_reg'
        ? ['full', 'zero_cls']
        : ABLATIONS;

      grid.innerHTML = abls.map(a =>
        `<div class="viz-cell">
          <div class="viz-label">${ABL_LABELS[a]}</div>
          <img src="${BASE}/ablation_pca/${state.model}_${state.image}_${a}.png"
               alt="Ablation PCA ${ABL_LABELS[a]}"
               loading="lazy">
        </div>`
      ).join('');
    }

    container.querySelectorAll('.viz-img-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.viz-img-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.image = btn.dataset.img;
        render();
      });
    });

    container.querySelectorAll('.viz-model-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.viz-model-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.model = btn.dataset.model;
        render();
      });
    });

    render();
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    setupPcaGallery();
    setupNormGallery();
    setupAttnGallery();
    setupAblationGallery();
  });
})();
