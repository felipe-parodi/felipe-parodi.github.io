---
layout: post-scholar
title: "Zero-Ablation Overstates Register Function in Vision Transformers"
date: 2026-03-04
categories: [blog]
tags: [vision-transformers, interpretability, DINOv3, self-supervised-learning]
excerpt: "Zeroing register tokens suggests they are indispensable – but replacing them with noise, dataset means, or even registers from wrong images preserves every task. The zero vector is the problem, not the registers."
extra_css:
  - /assets/css/howtocv.css
---

<div class="howtocv-links">
  <a href="https://github.com/felipe-parodi/howtocv" class="howtocv-link-btn"><i class="fab fa-github"></i> Code</a>
  <a href="#" class="howtocv-link-btn"><i class="fas fa-file-pdf"></i> Paper PDF</a>
  <a href="#citation" class="howtocv-link-btn"><i class="fas fa-quote-left"></i> Cite</a>
</div>

Jonas and Kording ([2017](https://doi.org/10.1371/journal.pcbi.1005268)) applied standard neuroscience analysis techniques to a microprocessor, lesioning individual transistors and measuring which were "necessary" for running Donkey Kong. The results were confident, publishable – and entirely misleading. Lesioning a component and observing what breaks reveals that the component was *involved in the circuit*, not that it *computed* the thing that broke.

We encountered an analogous problem with vision transformers.

**Zero-ablation** – replacing token activations with zero vectors – is the standard tool for probing token function in a ViT. When we zeroed register tokens in DINOv2+registers and DINOv3, classification dropped 36.6 pp and segmentation dropped 30.9 pp. Registers appeared functionally indispensable. Yet when we replaced registers with dataset-mean activations, Gaussian noise, or even registers from *completely different images*, every task was preserved within 1 pp of baseline. The specific content of registers is dispensable; only their presence matters.

Registers do play a real structural role: they buffer dense features from CLS dependence (zeroing CLS collapses segmentation by 37 pp without registers but <1 pp with them), and they compress patch geometry (effective rank 13.5 → 4.0). Their per-image content, however, is interchangeable. Zero-ablation overstated the story because zero vectors are out-of-distribution – the network never encountered them during training, and injecting them cascades disruption through every subsequent layer.

The remainder of this post describes each experiment and its implications.

---

## Background: ViTs, CLS, and Registers

A Vision Transformer (ViT) divides an image into non-overlapping patches (typically 14×14 pixels), converts each patch into a vector, and prepends a learnable **CLS token**. All tokens interact through **self-attention** across multiple layers, where each token can attend to every other token to aggregate information. At the output, CLS serves as a global image summary (used for classification), while patch tokens retain spatial information (used for segmentation and correspondence). This global–spatial distinction underlies the experiments below.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/approach.svg" alt="Experimental approach: ViT architecture with CLS and register tokens, showing ablation conditions" style="max-width: 100%; width: 700px; background: white; border-radius: 4px; padding: 0.5rem;">
  <figcaption><strong>Figure 1.</strong> Our setup. A ViT processes an image as CLS + register + patch tokens. We replace CLS or register outputs with zeros, dataset means, noise, or cross-image shuffled values, then measure impact on global tasks (classification, retrieval) and dense tasks (correspondence, segmentation).</figcaption>
</figure>

Patch features are rich and spatially structured. Below, they are projected into three PCA components (mapped to RGB):

<div id="pca-gallery" class="viz-gallery">
  <h4>Interactive: PCA patch features</h4>
  <div class="viz-controls">
    <span class="label">Image:</span>
    <button class="viz-img-btn active" data-img="img0">Fish</button>
    <button class="viz-img-btn" data-img="img1">Bird</button>
    <button class="viz-img-btn" data-img="img2">Dog</button>
    <button class="viz-img-btn" data-img="img3">Building</button>
    <button class="viz-img-btn" data-img="img4">Food</button>
  </div>
  <div class="viz-grid"></div>
</div>

### The artifact problem and register tokens

[Darcet et al. (2024)](https://arxiv.org/abs/2309.16588) found that large self-supervised ViTs produce **high-norm artifact tokens** in low-information regions – patches over sky, water, or uniform backgrounds develop anomalously large activations that distort downstream feature maps. Their fix: append 4 learnable **register tokens** to the input. Registers participate in attention but are discarded at inference, absorbing the artifact computation and leaving patch tokens clean.

DINOv3 ([Simeoni et al., 2025](https://arxiv.org/abs/2508.10104)) builds on this with **Gram anchoring** – a training objective that encourages patches to preserve their pairwise spatial relationships. The combination of registers and Gram anchoring produces the current state-of-the-art for dense features. We set out to determine what functional role registers play in this configuration.

The norm heatmaps below illustrate the artifact problem: bright regions indicate high-norm patches. Compare DINOv2 (artifacts in uniform regions) with register-equipped models:

<div id="norm-gallery" class="viz-gallery">
  <h4>Interactive: Patch norm heatmaps</h4>
  <div class="viz-controls">
    <span class="label">Image:</span>
    <button class="viz-img-btn active" data-img="img0">Fish</button>
    <button class="viz-img-btn" data-img="img1">Bird</button>
    <button class="viz-img-btn" data-img="img2">Dog</button>
    <button class="viz-img-btn" data-img="img3">Building</button>
    <button class="viz-img-btn" data-img="img4">Food</button>
  </div>
  <div class="viz-grid"></div>
</div>

---

## Zero-Ablation Results

We zeroed CLS or register tokens at every transformer layer and measured the downstream impact on four tasks:

| Task | Type | Metric | What it measures |
|------|------|--------|------------------|
| **Classification** | Global | Top-1 accuracy | Can a linear classifier read object identity from CLS? |
| **kNN retrieval** | Global | Recall@1 | Can CLS find the most similar image? |
| **Correspondence** | Dense | Accuracy | Can patches match the same object part across images? |
| **Segmentation** | Dense | mIoU | Can patches assign correct semantic labels? |

The interactive heatmap below summarizes the full ablation results. Toggle between raw accuracy and delta-from-baseline:

<div id="heatmap-container" class="howtocv-interactive">
  <div class="howtocv-controls">
    <label class="howtocv-toggle">
      <input type="checkbox" id="heatmap-delta-toggle">
      <span>Show as delta from full model</span>
    </label>
  </div>
  <div id="heatmap-chart"></div>
  <noscript>
    <p class="howtocv-fallback">Interactive chart requires JavaScript. Summary: zeroing CLS devastates DINOv2 across all tasks but barely affects DINOv2+reg and DINOv3 on dense tasks. Zeroing registers devastates DINOv3 across the board.</p>
  </noscript>
</div>

### CLS zeroing: dense tasks are buffered

In DINOv2 (no registers), zeroing CLS is catastrophic across all tasks: classification drops from 73.2% to 0.1%, correspondence falls 15.9 pp, segmentation falls 37.1 pp.

With registers present, the pattern is markedly different. CLS zeroing still eliminates classification (the linear probe reads from CLS, so this is expected), but dense tasks are largely unaffected:

- DINOv2+reg correspondence: 69.1% → 68.3% (−0.8 pp)
- DINOv3 segmentation: 78.5% → 78.5% (0.0 pp)

Registers have absorbed the role CLS previously played for spatial features. Patch representations no longer depend on CLS.

### Register zeroing: everything collapses

Zeroing registers produces large drops, especially in DINOv3:

- Classification: 62.0% → 25.4% (−36.6 pp)
- Segmentation: 78.5% → 47.6% (−30.9 pp)
- Correspondence: 78.9% → 57.8% (−21.1 pp)

Taken at face value, registers appear to carry critical information that the network depends on. This interpretation, however, does not hold up.

You can see the ablation effects directly in patch PCA features. Compare "Full" with "Zero CLS" (barely changes) and "Zero Registers" (collapses):

<div id="ablation-gallery" class="viz-gallery">
  <h4>Interactive: Ablation PCA features</h4>
  <div class="viz-controls">
    <span class="label">Model:</span>
    <button class="viz-model-btn" data-model="dinov2_no_reg">DINOv2</button>
    <button class="viz-model-btn" data-model="dinov2_reg">DINOv2+reg</button>
    <button class="viz-model-btn active" data-model="dinov3_vits16">DINOv3</button>
  </div>
  <div class="viz-controls">
    <span class="label">Image:</span>
    <button class="viz-img-btn active" data-img="img0">Fish</button>
    <button class="viz-img-btn" data-img="img1">Bird</button>
    <button class="viz-img-btn" data-img="img2">Dog</button>
    <button class="viz-img-btn" data-img="img3">Building</button>
    <button class="viz-img-btn" data-img="img4">Food</button>
  </div>
  <div class="viz-grid"></div>
</div>

---

## Register Content is Fungible

The problem is straightforward: a zero vector is something the network never encountered during training. Register tokens start as fixed learned embeddings, then are shaped by 12 layers of self-attention with the image's patches. By the final layer, they occupy a characteristic activation distribution – specific means, variances, and covariance structure. The zero vector sits far outside this distribution.

Zeroing registers therefore does not simply remove information – it injects an input that is far out-of-distribution relative to what the network learned to process. This corrupts the attention computation, which corrupts the next layer's input, which cascades through every remaining layer.

To test whether the drops reflect genuine content dependence or just distributional disruption, we ran three replacement controls:

- **Mean substitution**: Replace register outputs at each layer with the per-layer dataset-mean activation (calibrated on 5,000 images). Stays on-manifold, removes image-specific content.
- **Noise substitution**: Replace with Gaussian noise matched in per-dimension mean and variance. Right marginal statistics, no learned structure.
- **Cross-image shuffling**: Swap register activations across images in the batch, independently at each layer. These are *real* register values from *real* images – just the wrong images.

If models depend on register *content*, all three should degrade performance. If they depend only on register *presence*, plausible replacements should work fine.

All three preserve performance:

| Condition | CLS (v2+R / v3) | Corr. (v2+R / v3) | Seg. (v2+R / v3) |
|-----------|------------------|--------------------|-------------------|
| Full | 67.3 / 62.0 | 69.1 / 78.9 | 71.3 / 78.5 |
| Zero registers | 48.4 / 25.4 | 64.3 / 57.8 | 61.7 / 47.6 |
| Mean-sub | 67.0 / 62.1 | 68.8 / 78.8 | 71.6 / 78.6 |
| Noise-sub | 67.0 / 62.0 | 68.7 / 78.7 | 71.5 / 78.6 |
| Shuffle | 67.8 / 62.0 | 68.5 / 78.6 | 71.2 / 78.6 |

Only zeroing causes catastrophic drops. Every plausible replacement preserves every task within ~1pp.

The shuffle condition is the strongest test. By layer 11, registers have been shaped by 12 layers of attention with a specific image's patches – they have been conditioned on that image's content through the entire forward pass. Yet swapping in registers conditioned on *completely different images* does not degrade any task. Despite 12 layers of image-specific conditioning, the resulting register content is dispensable.

**CLS, by contrast, is not fungible.** Mean-substituting CLS yields 0.1% classification – the same as zeroing. CLS content is genuinely image-specific and functionally necessary. The fungibility is specific to registers.

[Jiang et al. (2025)](https://arxiv.org/abs/2501.11457) showed that even *untrained* register tokens suffice for artifact removal. We extend this finding: even in models *trained with* registers, the per-image content they develop through 12 layers of attention is unnecessary for all standard downstream tasks.

---

## Why Zeroing is Misleading

To see *why* only zeroing causes damage, we measured **Jensen-Shannon divergence** between full and ablated attention patterns at every layer.

Register zeroing causes cascading divergence that amplifies layer by layer: in DINOv3, JS divergence starts at 0.00 at layer 0 (identical input, no difference yet) and grows to 0.18 by layer 11. Mean-substitution stays below 0.005 at every layer. That's a ~250x gap.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig_attention_rewiring.svg" alt="JS divergence under ablation across layers" style="max-width: 100%; width: 700px;">
  <figcaption><strong>Figure 2.</strong> Why zeroing is misleading. (a) JS divergence vs. layer: register zeroing (solid) causes cascading divergence as the OOD zero vector compounds through layers; mean-substitution (dashed) preserves attention patterns. Lighter lines show ViT-B scale. (b) CLS attention redistribution when registers are zeroed.</figcaption>
</figure>

Per-patch cosine similarity confirms this pattern. Under plausible replacements, each patch's features have 0.95–0.999 cosine similarity to the unmodified condition – a genuine perturbation, but a small one. Under zeroing, cosine drops to ~0.6. The zero vector doesn't just remove register content; it breaks the entire downstream computation.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/correspondence/qualitative.svg" alt="Correspondence under ablation" style="max-width: 100%; width: 700px;">
  <figcaption><strong>Figure 3.</strong> Correspondence results. Top: full model (green = correct). Middle: zero CLS – matches preserved. Bottom: zero registers – spatial matching collapses.</figcaption>
</figure>

---

## What Holds Under Proper Controls

Not everything is an artifact of zeroing. Three findings hold up under proper controls.

### Registers buffer dense features from CLS

The CLS-zeroing asymmetry doesn't depend on register ablation, so it's a genuine architectural effect. Without registers, zeroing CLS collapses segmentation by 37.1pp. With registers, the drop is <1pp. Registers have absorbed the global computation that patches used to get from CLS, freeing them for spatial encoding. This is the clearest evidence that registers reshape information flow.

### Registers compress patch geometry

Under the full (unablated) condition, adding registers reduces the effective rank of the patch-to-patch Gram matrix from 13.5 (DINOv2) to 8.7 (DINOv2+reg) – a 36% compression. DINOv3 compresses further to 4.0.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig2_combined.svg" alt="Heatmap, effective rank, and eigenspectrum" style="max-width: 100%; width: 700px;">
  <figcaption><strong>Figure 4.</strong> (a) Task x ablation delta heatmap. (b) Effective rank: registers compress patch geometry; DINOv3 exhibits the most compression. (c) Eigenspectrum in log scale – DINOv3 concentrates variance into fewer directions. All ViT-S.</figcaption>
</figure>

DINOv3 simultaneously differs in patch size, positional encoding (RoPE), and distillation recipe, so we can't attribute the extra compression solely to Gram anchoring. But the trend is clear: register-equipped models produce lower-dimensional, more structured patch representations.

### Attention routing scales with register dependence

CLS directs 17.9% of its last-layer attention to registers in DINOv2+reg and 29.1% in DINOv3. This tracks the increasing register-zeroing sensitivity we observed. The interactive below traces attention flow across all 12 layers:

<div id="attention-container" class="howtocv-interactive">
  <h3 class="howtocv-section-title">Interactive: Attention flow across layers</h3>
  <p>Use the slider to see how attention mass redistributes across layers. Watch how patches progressively attend more to registers in DINOv3.</p>
  <div class="howtocv-controls">
    <div class="howtocv-btn-group" id="attention-model-select">
      <button class="howtocv-btn" data-model="dinov2_no_reg">DINOv2</button>
      <button class="howtocv-btn active" data-model="dinov2_reg">DINOv2+reg</button>
      <button class="howtocv-btn" data-model="dinov3_vits16">DINOv3</button>
    </div>
    <div class="howtocv-slider-row">
      <label for="attention-layer-slider">Layer:</label>
      <input type="range" id="attention-layer-slider" min="0" max="11" value="0" step="1">
      <span id="attention-layer-label">0</span>
      <button class="howtocv-btn howtocv-btn-sm" id="attention-play-btn">&#9654; Play</button>
    </div>
  </div>
  <div id="attention-chart"></div>
  <noscript>
    <img src="/assets/images/howtocv/attention_flow_static.png" alt="Attention flow across layers" style="max-width: 100%;">
  </noscript>
</div>

### All findings replicate at ViT-B scale

We ran the full experiment suite with ViT-B backbones. Ablation delta patterns are nearly identical: DINOv3-B loses −36.5pp classification under register zeroing (vs. −36.6 at ViT-S), and the CLS-buffering asymmetry holds.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig7_scale_comparison.svg" alt="ViT-S vs ViT-B scale comparison" style="max-width: 100%; width: 700px;">
  <figcaption><strong>Figure 5.</strong> Scale comparison. Solid = ViT-S, dashed = ViT-B. (a) Classification and (b) segmentation under ablation. The patterns are consistent across scales.</figcaption>
</figure>

---

<details>
<summary><strong>Register specialists (click to expand)</strong></summary>

**Caveat upfront:** The substitution controls show that the decodable content described here is not functionally necessary. Class information is present in individual registers, but models don't need it for any measured task. These patterns characterize representational structure, not functional dependence.

### DINOv2+reg: R2 is the specialist

Register R2 stands apart. Its nearest-neighbor patches are dominated by dark, low-information regions – borders, shadows, uniform backgrounds. Its cosine similarity to other registers is just 0.11, far below the 0.87–0.90 range among R1/R3/R4. When R2 alone is zeroed, classification drops −4.9pp; zeroing any other single register barely matters (<0.2pp). R2 handles artifact-absorption. R1, R3, and R4 are semantic generalists – their nearest-neighbor patches include object parts and textures, and they carry comparable classification information (61–64% each).

### DINOv3: the inversion

DINOv3 inverts this pattern. R3 becomes the semantic specialist – probe accuracy of 50.5%, far above R1 (4.1%) and R2 (15.2%). R1, R2, and R4 match to low-level patches: ground textures, dark backgrounds, homogeneous regions. Gram anchoring reorganized how the network distributes computation across registers.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig3_registers_combined.svg" alt="Per-register analysis" style="max-width: 100%; width: 700px;">
  <figcaption><strong>Figure 6.</strong> (a) Per-register classification accuracy. (b–c) Pairwise cosine similarity – DINOv2+reg R2 is structurally distinct. (d–e) Per-register lesion effects (note: zeroing is an OOD intervention).</figcaption>
</figure>

<div id="gallery-container" class="howtocv-interactive">
  <h3 class="howtocv-section-title">Interactive: Register nearest-neighbor gallery</h3>
  <p>Select a model and register to see which image patches are most similar to each register's learned representation.</p>
  <div class="howtocv-controls">
    <div class="howtocv-btn-group" id="gallery-model-select">
      <button class="howtocv-btn active" data-model="dinov2_reg">DINOv2+reg</button>
      <button class="howtocv-btn" data-model="dinov3_vits16">DINOv3</button>
    </div>
    <div class="howtocv-btn-group" id="gallery-reg-select">
      <button class="howtocv-btn active" data-reg="r1">R1</button>
      <button class="howtocv-btn" data-reg="r2">R2</button>
      <button class="howtocv-btn" data-reg="r3">R3</button>
      <button class="howtocv-btn" data-reg="r4">R4</button>
    </div>
  </div>
  <div id="gallery-grid"></div>
  <noscript>
    <img src="/assets/images/howtocv/register_nn_static.png" alt="Register nearest-neighbor vocabulary" style="max-width: 100%;">
  </noscript>
</div>

</details>

<details>
<summary><strong>Temporal dynamics: when do registers matter? (click to expand)</strong></summary>

### Attention routing precedes semantic content

We traced two signals across all 12 layers: attention mass flowing to registers and classification information in each register (via linear probes). These two signals are dissociated.

Patches start attending to registers from mid-layers onward, building gradually. But semantic content emerges abruptly at layers 10–11. All tokens carry near-random classification accuracy through layer 8 (<6% for DINOv2+reg, <14% for DINOv3). Then accuracy jumps sharply. The attention routing infrastructure gets built several layers before any semantic content appears.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig4_attention.svg" alt="CLS attention distribution" style="max-width: 100%; width: 700px;">
  <figcaption><strong>Figure 7.</strong> (a) CLS attention fraction per token type. DINOv2+reg: 17.9% to registers; DINOv3: 29.1%. (b) Per-register breakdown.</figcaption>
</figure>

<div id="probe-container" class="howtocv-interactive">
  <h3 class="howtocv-section-title">Interactive: Layer-wise register probing</h3>
  <p>Drag the slider to see classification accuracy at each layer. Note the sharp jump at layers 10–11.</p>
  <div id="probe-chart"></div>
  <noscript>
    <img src="/assets/images/howtocv/layer_probe_static.png" alt="Layer-wise probing results" style="max-width: 100%;">
  </noscript>
</div>

Per-register dynamics are interesting: DINOv3's R1 peaks at layer 10 then *drops* at layer 11, despite receiving the most attention. This suggests a transient computation buffer – it temporarily holds information before passing it along, rather than accumulating a final answer. R3 rises monotonically through layer 11, acting as a semantic accumulator.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig5_layer_sweep.svg" alt="Layer-wise task performance" style="max-width: 100%; width: 700px;">
  <figcaption><strong>Figure 8.</strong> (a) CLS classification across layers – near-random until layer 8, then rises steeply. (b) Correspondence peaks at mid-layers then declines, except DINOv3 which maintains 78.9% at layer 11.</figcaption>
</figure>

</details>

<details>
<summary><strong>Cumulative lesions and negative controls (click to expand)</strong></summary>

### Non-additive effects

Zeroing registers one at a time produces modest drops. But zeroing all four causes collapse far exceeding the sum of individual effects – DINOv2+reg: sum of individual deltas = −5.2pp, collective = −18.9pp; DINOv3: sum = −7.0pp, collective = −36.6pp. This is consistent with zeroing being a disproportionately destructive intervention that compounds across token positions – the OOD disruption from zeroing one register is modest, but zeroing all four creates a much larger distributional shift.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/cumulative_lesion.svg" alt="Cumulative register lesion" style="max-width: 100%; width: 600px;">
  <figcaption><strong>Figure 9.</strong> Cumulative register lesion: zeroing registers one at a time. Solid = actual, dashed = additive prediction. Both models show super-additive degradation.</figcaption>
</figure>

### Random patch negative control

A natural question is whether zeroing any four tokens produces comparable damage. Zeroing four random patch tokens causes ≤1 pp drop – confirming the register effect is specific. But this specificity reflects registers' distinct activation distribution (zeros are more OOD for registers than for patches), not necessarily unique functional content.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig9_random_patch_control.svg" alt="Random patch control" style="max-width: 100%; width: 600px;">
  <figcaption><strong>Figure 10.</strong> Negative control: zeroing 4 random patches has negligible effect vs. zeroing 4 registers.</figcaption>
</figure>

Here are the attention maps under different conditions:

<div id="attn-gallery" class="viz-gallery">
  <h4>Interactive: Attention map overlays</h4>
  <div class="viz-controls">
    <span class="label">Image:</span>
    <button class="viz-img-btn active" data-img="img0">Fish</button>
    <button class="viz-img-btn" data-img="img1">Bird</button>
    <button class="viz-img-btn" data-img="img2">Dog</button>
    <button class="viz-img-btn" data-img="img3">Building</button>
    <button class="viz-img-btn" data-img="img4">Food</button>
  </div>
  <div class="viz-controls">
    <span class="label">Mode:</span>
    <button class="viz-mode-btn active" data-mode="cls">CLS attention</button>
    <button class="viz-mode-btn" data-mode="regs">Register attention</button>
  </div>
  <div class="viz-grid"></div>
</div>

</details>

---

## Takeaways

1. **Don't trust zero-ablation alone.** Zeroing injects OOD inputs that cascade disruption, overstating functional dependence. Always pair it with replacement controls. Cross-image shuffling is the strongest test; mean-substitution is the simplest to implement.

2. **Register slots matter, register content doesn't** (for standard frozen-feature tasks). The network has reorganized its computation around those slots. Any plausible activation works – dataset means, noise, wrong-image registers.

3. **CLS content genuinely matters.** Mean-substituting CLS also kills classification (0.1%). The fungibility is specific to registers, not an artifact of the controls being weak.

4. **Registers buffer dense features from CLS dependence.** This is a real architectural effect confirmed by the CLS-zeroing asymmetry (37pp segmentation drop without registers vs <1pp with them) – and it doesn't depend on register ablation.

5. **Scale-consistent.** All findings replicate across ViT-S and ViT-B.

6. **Open question.** Our fungibility result covers standard frozen-feature evaluations – classification, correspondence, segmentation. Tasks requiring fine-grained register content (few-shot adaptation, generation) remain untested.

---

## Citation {#citation}

```bibtex
@article{parodi2026zero,
  title={Zero-Ablation Overstates Register Function
         in {DINO} Vision Transformers},
  author={Parodi, Felipe and Matelsky, Jordan K. and Segado, Melanie},
  year={2026},
  note={Manuscript}
}
```

<div class="howtocv-footer">
  <p>Built with PyTorch, HuggingFace Transformers, and DINOv3. Interactive visualizations powered by Plotly.js and D3.js.</p>
</div>

<!-- Load interactive scripts -->
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="/assets/js/howtocv-heatmap.js"></script>
<script src="/assets/js/howtocv-probes.js"></script>
<script src="/assets/js/howtocv-attention.js"></script>
<script src="/assets/js/howtocv-gallery.js"></script>
<script src="/assets/js/howtocv-viz-gallery.js"></script>
