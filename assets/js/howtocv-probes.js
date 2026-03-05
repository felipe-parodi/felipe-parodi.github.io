/**
 * Layer-wise register probing chart.
 * Dual-panel Plotly line chart showing CLS + R1–R4 classification accuracy
 * across layers for DINOv2+reg and DINOv3.
 */
(function () {
  'use strict';

  const CONTAINER = 'probe-chart';

  const COLORS = {
    cls: '#2c3e50',
    r1: '#e74c3c',
    r2: '#3498db',
    r3: '#2ecc71',
    r4: '#f39c12',
  };

  const LABELS = {
    cls: 'CLS',
    r1: 'R1',
    r2: 'R2',
    r3: 'R3',
    r4: 'R4',
  };

  const MODEL_TITLES = {
    dinov2_reg: 'DINOv2+reg',
    dinov3_vits16: 'DINOv3',
  };

  async function loadAndRender() {
    const resp = await fetch('/assets/data/howtocv/register_layer_probe.json');
    const data = await resp.json();
    render(data);
  }

  function render(data) {
    const models = ['dinov2_reg', 'dinov3_vits16'];
    const features = ['cls', 'r1', 'r2', 'r3', 'r4'];
    const traces = [];

    models.forEach((model, mi) => {
      const modelData = data[model];
      const layers = modelData.layers;

      features.forEach((ft) => {
        const yVals = layers.map((l) => {
          const key = `layer_${String(l).padStart(2, '0')}`;
          return (modelData.probes[key][ft] || 0) * 100;
        });

        traces.push({
          x: layers,
          y: yVals,
          name: LABELS[ft],
          mode: 'lines+markers',
          line: {
            color: COLORS[ft],
            width: ft === 'cls' ? 3 : 2,
            dash: ft === 'cls' ? 'solid' : undefined,
          },
          marker: { size: ft === 'cls' ? 7 : 5 },
          xaxis: mi === 0 ? 'x' : 'x2',
          yaxis: mi === 0 ? 'y' : 'y2',
          legendgroup: ft,
          showlegend: mi === 0,
          hovertemplate:
            `<b>${LABELS[ft]}</b> (${MODEL_TITLES[model]})<br>` +
            'Layer %{x}<br>' +
            'Accuracy: %{y:.1f}%<extra></extra>',
        });
      });
    });

    // Annotations for key layers
    const annotations = [
      {
        x: 10,
        y: 51,
        xref: 'x2',
        yref: 'y2',
        text: 'R1 peaks then drops',
        showarrow: true,
        arrowhead: 2,
        ax: 40,
        ay: -30,
        font: { size: 10, color: '#e74c3c' },
      },
      {
        x: 11,
        y: 67.3,
        xref: 'x',
        yref: 'y',
        text: 'CLS 67.3%',
        showarrow: true,
        arrowhead: 2,
        ax: -40,
        ay: -20,
        font: { size: 10, color: '#2c3e50' },
      },
    ];

    const layout = {
      grid: { rows: 1, columns: 2, pattern: 'independent', xgap: 0.08 },
      xaxis: {
        title: 'Layer',
        dtick: 2,
        domain: [0, 0.46],
      },
      xaxis2: {
        title: 'Layer',
        dtick: 2,
        domain: [0.54, 1],
      },
      yaxis: {
        title: 'Top-1 Accuracy (%)',
        range: [0, 75],
      },
      yaxis2: {
        title: '',
        range: [0, 75],
      },
      annotations: [
        {
          text: '<b>DINOv2+reg</b>',
          xref: 'paper',
          yref: 'paper',
          x: 0.23,
          y: 1.08,
          showarrow: false,
          font: { size: 14 },
        },
        {
          text: '<b>DINOv3</b>',
          xref: 'paper',
          yref: 'paper',
          x: 0.77,
          y: 1.08,
          showarrow: false,
          font: { size: 14 },
        },
        ...annotations,
      ],
      legend: {
        orientation: 'h',
        y: -0.15,
        x: 0.5,
        xanchor: 'center',
      },
      margin: { t: 50, b: 80, l: 60, r: 30 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 380,
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(CONTAINER, traces, layout, config);
  }

  document.addEventListener('DOMContentLoaded', loadAndRender);
})();
