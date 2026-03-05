/**
 * Ablation heatmap explorer.
 * Renders a Plotly heatmap of model × (ablation, task) with hover tooltips
 * and a toggle between raw accuracy and delta-from-full.
 */
(function () {
  'use strict';

  const CONTAINER = 'heatmap-chart';
  const TOGGLE_ID = 'heatmap-delta-toggle';

  const MODEL_LABELS = {
    dinov2_no_reg: 'DINOv2',
    dinov2_reg: 'DINOv2+reg',
    dinov3_vits16: 'DINOv3',
  };

  const TASK_LABELS = {
    g1: 'Classification (G1)',
    g2: 'Retrieval (G2)',
    d1: 'Correspondence (D1)',
    d2: 'Segmentation (D2)',
  };

  const ABLATION_LABELS = {
    full: 'Full',
    zero_cls: 'Zero CLS',
    zero_registers: 'Zero Registers',
  };

  const TASKS = ['g1', 'g2', 'd1', 'd2'];
  const MODELS = ['dinov2_no_reg', 'dinov2_reg', 'dinov3_vits16'];
  const ABLATIONS = ['full', 'zero_cls', 'zero_registers'];

  let rawData = null;

  async function loadData() {
    const resp = await fetch('/assets/data/howtocv/heatmap_data.json');
    rawData = await resp.json();
    render(false);
  }

  function buildMatrix(showDelta) {
    // Rows = models, Columns = (ablation, task) pairs
    const yLabels = MODELS.map(m => MODEL_LABELS[m]);
    const xLabels = [];
    const z = [];
    const hoverTexts = [];

    for (const model of MODELS) {
      const row = [];
      const hoverRow = [];
      const modelData = rawData.models[model];

      for (const abl of ABLATIONS) {
        if (!modelData[abl]) continue;

        for (const task of TASKS) {
          const val = modelData[abl][task];
          if (val === undefined) continue;

          const fullVal = modelData.full[task];
          const displayVal = showDelta ? val - fullVal : val;

          if (z.length === 0) {
            xLabels.push(`${ABLATION_LABELS[abl]}<br>${TASK_LABELS[task]}`);
          }

          row.push(displayVal);

          const deltaStr = (val - fullVal) >= 0
            ? `+${((val - fullVal) * 100).toFixed(1)}pp`
            : `${((val - fullVal) * 100).toFixed(1)}pp`;
          hoverRow.push(
            `<b>${MODEL_LABELS[model]}</b><br>` +
            `${ABLATION_LABELS[abl]} / ${TASK_LABELS[task]}<br>` +
            `Accuracy: ${(val * 100).toFixed(1)}%<br>` +
            `Delta: ${deltaStr}`
          );
        }
      }
      z.push(row);
      hoverTexts.push(hoverRow);
    }

    return { xLabels, yLabels, z, hoverTexts };
  }

  function render(showDelta) {
    const { xLabels, yLabels, z, hoverTexts } = buildMatrix(showDelta);

    const colorscale = showDelta
      ? [
          [0, '#d73027'],
          [0.5, '#ffffbf'],
          [1, '#1a9850'],
        ]
      : [
          [0, '#f7fbff'],
          [0.5, '#6baed6'],
          [1, '#08306b'],
        ];

    const zmin = showDelta ? -0.4 : 0;
    const zmax = showDelta ? 0.05 : 1;

    const textValues = z.map(row =>
      row.map(v => showDelta
        ? `${(v * 100) >= 0 ? '+' : ''}${(v * 100).toFixed(1)}`
        : `${(v * 100).toFixed(1)}%`
      )
    );

    const trace = {
      type: 'heatmap',
      z: z,
      x: xLabels,
      y: yLabels,
      text: textValues,
      texttemplate: '%{text}',
      textfont: { size: 11 },
      hovertext: hoverTexts,
      hoverinfo: 'text',
      colorscale: colorscale,
      zmin: zmin,
      zmax: zmax,
      colorbar: {
        title: showDelta ? 'Delta' : 'Accuracy',
        tickformat: showDelta ? '+.0%' : '.0%',
      },
    };

    const layout = {
      margin: { t: 30, b: 120, l: 100, r: 60 },
      xaxis: {
        tickangle: -45,
        tickfont: { size: 10 },
      },
      yaxis: {
        tickfont: { size: 12 },
        autorange: 'reversed',
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(CONTAINER, [trace], layout, config);
  }

  // Toggle handler
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById(TOGGLE_ID);
    if (toggle) {
      toggle.addEventListener('change', () => {
        if (rawData) render(toggle.checked);
      });
    }
    loadData();
  });
})();
