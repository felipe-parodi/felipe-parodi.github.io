/**
 * Attention flow visualization.
 * Interactive stacked bar chart showing how attention mass distributes
 * across source→target pairs at each layer, with a layer slider and
 * model selector.
 */
(function () {
  'use strict';

  const CONTAINER = 'attention-chart';
  const SLIDER_ID = 'attention-layer-slider';
  const LABEL_ID = 'attention-layer-label';
  const PLAY_ID = 'attention-play-btn';
  const MODEL_SELECT_ID = 'attention-model-select';

  const FLOW_COLORS = {
    cls_to_cls: '#2c3e50',
    cls_to_regs: '#9b59b6',
    cls_to_patches: '#7f8c8d',
    regs_to_cls: '#e74c3c',
    regs_to_regs: '#e91e63',
    regs_to_patches: '#f06292',
    patches_to_cls: '#3498db',
    patches_to_regs: '#ff9800',
    patches_to_patches: '#8bc34a',
  };

  const FLOW_LABELS = {
    cls_to_cls: 'CLS→CLS',
    cls_to_regs: 'CLS→Regs',
    cls_to_patches: 'CLS→Patches',
    regs_to_cls: 'Regs→CLS',
    regs_to_regs: 'Regs→Regs',
    regs_to_patches: 'Regs→Patches',
    patches_to_cls: 'Patches→CLS',
    patches_to_regs: 'Patches→Regs',
    patches_to_patches: 'Patches→Patches',
  };

  // Group flows by source for stacked bars
  const SOURCES = ['CLS', 'Registers', 'Patches'];
  const SOURCE_FLOWS = {
    CLS: ['cls_to_cls', 'cls_to_regs', 'cls_to_patches'],
    Registers: ['regs_to_cls', 'regs_to_regs', 'regs_to_patches'],
    Patches: ['patches_to_cls', 'patches_to_regs', 'patches_to_patches'],
  };

  let rawData = null;
  let currentModel = 'dinov2_reg';
  let playInterval = null;

  async function loadData() {
    const resp = await fetch('/assets/data/howtocv/attention_flow.json');
    rawData = await resp.json();
    renderLayer(0);
  }

  function getLayerData(model, layer) {
    const key = `layer_${String(layer).padStart(2, '0')}`;
    return rawData[model]?.layers?.[key] || {};
  }

  function renderLayer(layer) {
    const layerData = getLayerData(currentModel, layer);
    const traces = [];

    SOURCES.forEach((source) => {
      const flows = SOURCE_FLOWS[source];
      flows.forEach((flow) => {
        const val = layerData[`${flow}_mean`] || 0;
        traces.push({
          x: [source],
          y: [val * 100],
          name: FLOW_LABELS[flow],
          type: 'bar',
          marker: { color: FLOW_COLORS[flow] },
          hovertemplate:
            `<b>${FLOW_LABELS[flow]}</b><br>` +
            `${(val * 100).toFixed(1)}%<extra></extra>`,
        });
      });
    });

    const modelLabel = {
      dinov2_no_reg: 'DINOv2',
      dinov2_reg: 'DINOv2+reg',
      dinov3_vits16: 'DINOv3',
    }[currentModel];

    const layout = {
      barmode: 'stack',
      title: {
        text: `${modelLabel} — Layer ${layer}`,
        font: { size: 16 },
      },
      xaxis: {
        title: 'Source Token Type',
        tickfont: { size: 13 },
      },
      yaxis: {
        title: 'Attention Mass (%)',
        range: [0, 105],
        tickfont: { size: 11 },
      },
      legend: {
        orientation: 'v',
        x: 1.02,
        y: 1,
        font: { size: 10 },
      },
      margin: { t: 50, b: 60, l: 60, r: 150 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 400,
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(CONTAINER, traces, layout, config);
  }

  function setupControls() {
    const slider = document.getElementById(SLIDER_ID);
    const label = document.getElementById(LABEL_ID);
    const playBtn = document.getElementById(PLAY_ID);
    const modelBtns = document.querySelectorAll(`#${MODEL_SELECT_ID} .howtocv-btn`);

    if (slider) {
      slider.addEventListener('input', () => {
        const layer = parseInt(slider.value, 10);
        label.textContent = layer;
        renderLayer(layer);
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (playInterval) {
          clearInterval(playInterval);
          playInterval = null;
          playBtn.innerHTML = '&#9654; Play';
          return;
        }
        playBtn.innerHTML = '&#9724; Stop';
        let layer = 0;
        slider.value = 0;
        label.textContent = 0;
        renderLayer(0);

        playInterval = setInterval(() => {
          layer++;
          if (layer > 11) {
            clearInterval(playInterval);
            playInterval = null;
            playBtn.innerHTML = '&#9654; Play';
            return;
          }
          slider.value = layer;
          label.textContent = layer;
          renderLayer(layer);
        }, 600);
      });
    }

    modelBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modelBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentModel = btn.dataset.model;
        const layer = parseInt(slider.value, 10);
        renderLayer(layer);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupControls();
    loadData();
  });
})();
