---
layout: post-scholar
title: "Zero-Ablation Overstates Register Function in Vision Transformers"
date: 2026-03-04
categories: [blog]
tags: [vision-transformers, interpretability, DINOv3, self-supervised-learning]
excerpt: "Zeroing register tokens suggests they're indispensable — but replacing them with noise, dataset means, or even registers from wrong images preserves every task. The zero vector is the problem, not the registers."
extra_css:
  - /assets/css/howtocv.css
---

<div class="howtocv-links">
  <a href="https://github.com/felipe-parodi/howtocv" class="howtocv-link-btn"><i class="fab fa-github"></i> Code</a>
  <a href="#" class="howtocv-link-btn"><i class="fas fa-file-pdf"></i> Paper PDF</a>
  <a href="#citation" class="howtocv-link-btn"><i class="fas fa-quote-left"></i> Cite</a>
</div>

When neural networks process images, they need to organize a lot of information — and some of the most capable models have quietly developed extra "scratch space" to do it. Modern vision transformers like DINOv2 and DINOv3 include an unusual architectural feature: **register tokens** — extra learned tokens added alongside the image tokens that participate in the network's computations but don't correspond to any image region. Originally introduced to [suppress attention artifacts](https://arxiv.org/abs/2309.16588), these tokens turn out to play a far more active role than their name suggests.

**Zero-ablation** — replacing token activations with zero vectors — is the standard tool for probing what these tokens do. When you zero registers, everything collapses: classification drops 36.6pp, segmentation drops 30.9pp. This looks like registers are functionally indispensable. But we show this conclusion is too strong.

In this post, I walk through how we discovered that zero-ablation **overstates register function**. Three replacement controls — substituting dataset-mean activations, Gaussian noise, or even registers from completely different images — all preserve every task within 1pp. The dramatic drops from zeroing aren't because registers carry critical information; they're because the zero vector is **out-of-distribution** relative to what the network expects, causing cascading disruption through all subsequent layers. This parallels a [classic lesson from neuroscience](https://doi.org/10.1371/journal.pcbi.1005268): lesioning a microprocessor component and observing a deficit doesn't mean that component computes Donkey Kong.

What IS real: registers **buffer dense features from CLS dependence** (zeroing CLS collapses segmentation by 37pp without registers but <1pp with them), and they **compress patch geometry** (effective rank drops from 13.5 to 4.0). But their specific per-image content? Fungible.

---

## The DINO Family and the Register Problem

### Self-supervised ViTs in 60 seconds

Most neural networks learn from labeled data — millions of images tagged with "cat" or "dog." The DINO family takes a different approach called **self-distillation**: the model trains by trying to match a slowly-updated copy of itself, without any labels at all. The result is a model whose internal representations capture strong semantic and spatial structure, often rivaling supervised models.

A standard ViT (Vision Transformer) processes an image by splitting it into non-overlapping patches (typically 14×14 pixels), converting each patch into a vector, and prepending a special learnable **CLS token**. All tokens — CLS plus patches — interact through **self-attention** (each token can "look at" every other token to decide what matters) across multiple transformer layers. At the output, the CLS token serves as a global image summary (useful for classification), while patch tokens retain spatial information (useful for segmentation and finding correspondences between images). This division of labor — one global token, many spatial tokens — is important for what follows.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/approach.svg" alt="Experimental approach: ViT architecture with CLS and register tokens, showing zero-CLS and zero-registers ablation conditions" style="max-width: 700px; background: white; border-radius: 4px; padding: 0.5rem;">
  <figcaption><strong>Figure 1.</strong> Our experimental approach. A ViT processes an image as CLS + register + patch tokens. We selectively zero CLS or register token outputs at the final layer and measure impact on global tasks (classification, retrieval) and dense tasks (correspondence, segmentation).</figcaption>
</figure>

What do these patch features actually look like? The gallery below projects each model's patch features into 3 PCA components (mapped to RGB). Notice how different models organize spatial information differently:

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

### The artifact problem

[Darcet et al. (2024)](https://arxiv.org/abs/2309.16588) discovered that DINO and DINOv2 produce **high-norm artifact tokens** in low-information image regions — patches corresponding to sky, water, or uniform backgrounds would develop anomalously large activation norms that distorted downstream feature maps. Their solution: append 4 learnable **register tokens** to the input sequence. These registers participate in the network's computations but are discarded at inference, absorbing the artifact computation and leaving patch tokens clean. This worked — but it raised a question.

DINOv2 was then retrained with registers (DINOv2+reg), and the artifacts disappeared. But a question remained: **what exactly are these registers doing?** Are they merely absorbing garbage computation, or are they playing a more active role in the network's information processing?

The patch norm heatmaps below visualize these artifacts directly. High-norm patches (bright regions) indicate where the model concentrates computation. Compare DINOv2 (artifacts visible in uniform regions) with DINOv2+reg and DINOv3 (cleaner after registers):

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

### DINOv3 and Gram anchoring

DINOv3 ([Siméoni et al., 2025](https://arxiv.org/abs/2508.10104)) adds a new training objective called **Gram anchoring** — it encourages patch tokens to preserve their pairwise spatial relationships (which patches are similar to which). The intuition: if a model maintains consistent spatial structure during training, it should produce better features for tasks like segmentation and correspondence that depend on spatial layout.

DINOv3 also includes register tokens. But here's the key question our paper investigates: **how do registers interact with Gram anchoring?** Does the combination simply add benefits, or does it qualitatively change how the network organizes information across token types?

---

## The Experiment: Token-Zeroing Ablations

### The logic of ablation

Our approach: at every transformer layer, we **replace** specific token types with different values and measure the downstream impact. The key insight is comparing *what* you replace with:

- **Zero-ablation**: Sets tokens to the zero vector. The standard approach — but the zero vector is something the network has *never seen* during training, making it an out-of-distribution input.
- **Mean substitution**: Replaces with the average activation at that layer (calibrated on 5,000 images). Stays on-manifold but removes image-specific content.
- **Noise substitution**: Replaces with Gaussian noise matched in per-layer mean and variance. Right statistics, no learned structure.
- **Cross-image shuffling**: Swaps register activations across images in the batch (fresh permutation at each layer). Real register values from real images — just the *wrong* images.

If models depend on register **content**, all replacements should degrade performance. If they depend only on register **presence**, plausible replacements should suffice.

We evaluate on four tasks spanning global and dense prediction:

| Task | Type | Metric | What it measures |
|------|------|--------|------------------|
| **G1**: Linear probe | Global | Top-1 accuracy | Can a simple classifier read object identity from the CLS token? |
| **G2**: kNN retrieval | Global | Recall@1 | Can the model find the most similar image in a database? |
| **D1**: Correspondence | Dense | Accuracy | Can patch features match the same object part across two images? |
| **D2**: Segmentation | Dense | mIoU (overlap score) | Can patch features assign correct semantic labels to each pixel? |

### Interactive: Ablation heatmap explorer

The heatmap below shows all ablation results. Each cell encodes the accuracy (or delta from full model) for one model × ablation × task combination. Hover for exact values.

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

### Gram anchoring reshapes patch geometry

Beyond task accuracy, we wanted to understand *how* each training objective organizes information differently. **Effective rank** measures how many independent directions the features actually use (out of the hundreds available in the vector space) — higher means the model spreads information across more dimensions, lower means it concentrates into fewer.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig2_combined.svg" alt="Combined heatmap, effective rank, and eigenspectrum analysis" style="max-width: 800px;">
  <figcaption><strong>Figure 2.</strong> (a) Task × ablation delta heatmap. (b) Effective rank of patch features — DINOv3's Gram anchoring compresses patch geometry (erank 4.0 vs 8.7 for DINOv2+reg). (c) Eigenspectrum (variance captured by each principal component) in log scale — DINOv3 concentrates information into fewer dimensions.</figcaption>
</figure>

DINOv2 has an effective rank of 13.5, DINOv2+reg drops to 8.7, and DINOv3 compresses further to just 4.0. This means Gram anchoring concentrates patch information into far fewer dimensions — yet this compressed representation actually *improves* dense prediction performance. The takeaway: fewer dimensions doesn't mean less information. DINOv3's patches are more structured and organized, not impoverished.

---

## The Asymmetric Dissociation

The heatmap shows a clear pattern — an **asymmetric dissociation** between CLS and register tokens. In neuroscience, a double dissociation means two systems are each necessary for different functions: damaging one impairs function A but not B, and damaging the other impairs B but not A. Our pattern is *asymmetric* rather than a clean double dissociation: CLS zeroing selectively spares dense tasks (when registers are present), but register zeroing impairs *both* global and dense tasks. This one-sided selectivity reveals that registers play a broader structural role:

### CLS zeroing: dense tasks are buffered

In DINOv2 (no registers), zeroing CLS is bad across all tasks: classification drops from 73.2% to 0.1%, and even correspondence falls from 72.0% to 56.1%. The CLS token is the network's central hub.

But in DINOv2+reg and DINOv3, something different happens. CLS zeroing still kills classification (expected — the probe reads from CLS). But **dense tasks are almost completely unaffected**:

- DINOv2+reg correspondence: 69.1% → 68.3% (−0.8pp)
- DINOv3 segmentation: 78.5% → 78.5% (0.0pp change)

The registers have **absorbed the CLS token's role** in supporting dense features. Patch tokens no longer depend on CLS for spatial computation.

### Register zeroing: everything collapses

Conversely, zeroing registers causes large drops, especially for DINOv3:

- DINOv3 classification: 62.0% → 25.4% (**−36.6pp**)
- DINOv3 segmentation: 78.5% → 47.6% (**−30.9pp**)
- DINOv3 correspondence: 78.9% → 57.8% (**−21.1pp**)

Taken at face value, this is an asymmetric dissociation: CLS zeroing selectively spares dense tasks, while register zeroing impairs *everything*. But as we'll see below, the register side of this dissociation is overstated — **the dramatic drops come from injecting out-of-distribution zero vectors, not from losing critical register content.**

You can see the ablation effects directly in patch PCA features below. Compare "Full Model" with "Zero CLS" (often barely changes) and "Zero Registers" (feature structure collapses):

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

### Register content is fungible

The zeroing results raise a key question: is it the *specific information* stored in registers that matters, or just their *structural presence*? We tested this with three replacement controls alongside zeroing.

The result: **all three plausible replacements preserve performance across every task** — classification, correspondence, and segmentation — within ~1pp of the unmodified baseline:

| Condition | CLS (v2+R / v3) | Corr. (v2+R / v3) | Seg. (v2+R / v3) |
|-----------|------------------|--------------------|-------------------|
| Full | 67.3 / 62.0 | 69.1 / 78.9 | 71.3 / 78.5 |
| Zero registers | 48.4 / 25.4 | 64.3 / 57.8 | 61.7 / 47.6 |
| Mean-sub | 67.0 / 62.1 | 68.8 / 78.8 | 71.6 / 78.6 |
| Noise-sub | 67.0 / 62.0 | 68.7 / 78.7 | 71.5 / 78.6 |
| Shuffle | 67.8 / 62.0 | 68.5 / 78.6 | 71.2 / 78.6 |

Only zeroing causes catastrophic drops. The shuffle result is especially striking: by layer 11, registers have been shaped by 12 layers of attention with a specific image's patches. Yet swapping in registers conditioned on *completely different images* doesn't hurt any task. The network spent all that compute conditioning registers on the image, and none of that per-image conditioning matters.

**But CLS is different.** Mean-substituting CLS yields 0.1% classification — same as zeroing. CLS content is genuinely image-specific. The fungibility is specific to registers.

This connects to a broader lesson. [Jiang et al. (2025)](https://arxiv.org/abs/2501.11457) showed that even *untrained* register tokens suffice for artifact removal. We extend this: even in models *trained with* registers, the per-image content is unnecessary for all standard downstream tasks.

### Why zeroing is misleading: the OOD explanation

To understand *why* only zeroing causes damage, we measured **Jensen–Shannon divergence** between full and ablated attention patterns at every layer. JS divergence measures how different two probability distributions are — in this case, how much the attention pattern changes under each intervention.

Register zeroing causes **cascading divergence that amplifies across layers**: in DINOv3, JS divergence starts at 0.00 at layer 0 and grows to 0.18 by layer 11. Mean-substitution preserves attention patterns almost perfectly — JS stays below 0.005 at every layer. That's a **~250× gap**. The zero vector sits far outside the manifold of activations the network learned to process. When attention heads encounter it, they compute corrupted outputs that feed corrupted inputs to the next layer, compounding through all 12 layers.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig_attention_rewiring.svg" alt="Attention scaffold under ablation: JS divergence across layers and attention redistribution" style="max-width: 700px;">
  <figcaption><strong>Figure 3.</strong> Why zeroing is misleading. (a) JS divergence vs. layer: register zeroing (solid) causes cascading divergence — the OOD zero vector compounds through layers; mean-substitution (dashed) preserves attention patterns. Lighter lines show ViT-B scale. (b) CLS attention redistribution at the last layer when registers are zeroed — DINOv3's CLS attention shifts to patches (+19.9pp) while DINOv2+reg shifts toward CLS self-attention.</figcaption>
</figure>

Per-register analysis shows removing R2 (DINOv2+reg) or R3 (DINOv3) causes the greatest attention disruption (JS = 0.062 and 0.076 respectively). But note: zeroing individual registers is *also* an OOD intervention, so these results measure sensitivity to distributional shift rather than functional dependence on register content.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/correspondence/qualitative.svg" alt="Qualitative correspondence under different ablation conditions" style="max-width: 700px;">
  <figcaption><strong>Figure 4.</strong> Qualitative correspondence results. Top: full model with correct matches (green). Middle: zero CLS — matches preserved. Bottom: zero registers — spatial matching collapses. Green = correct, red = incorrect.</figcaption>
</figure>

---

## What Do Individual Registers Do?

We probed each register individually and found a **specialist-generalist split** that reverses between architectures. **Important caveat:** the substitution controls show that this decodable content is not *functionally necessary* — class information is present in individual registers, but models don't require it for any measured task. These patterns characterize representational structure, not functional dependence.

### DINOv2+reg: R2 is the specialist

In DINOv2+reg, register R2 stands apart. Its nearest-neighbor patches are dominated by **dark, low-information regions** — borders, shadows, uniform backgrounds. Its cosine similarity (a measure of how aligned two vectors are, from 0 = unrelated to 1 = identical direction) to other registers is just 0.11, far below the 0.87–0.90 range among R1/R3/R4. When R2 is individually zeroed, classification drops −4.9pp; zeroing any other single register has minimal effect (< 0.2pp).

R2 is a **low-level specialist**: it handles the original artifact-absorption role. R1, R3, and R4 are **semantic generalists** — their nearest-neighbor patches include object parts, textures, and scene elements, and they carry comparable classification information (61–64% each).

### DINOv3: the inversion

DINOv3 flips this pattern. R3 becomes the **semantic specialist** — its probe accuracy reaches 50.5%, far above R1 (4.1%) and R2 (15.2%). Conversely, R1, R2, and R4 match to **low-level patches**: ground textures (R4, cos=0.77), dark backgrounds (R1), and homogeneous regions (R2).

This is a qualitative reorganization, not just a quantitative shift. Gram anchoring changes how the network distributes computation across its register tokens.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig3_registers_combined.svg" alt="Per-register classification accuracy and cosine similarity matrices" style="max-width: 800px;">
  <figcaption><strong>Figure 5.</strong> (a) Per-register classification accuracy. DINOv2+reg R2 is a low-accuracy outlier; DINOv3 R3 is the lone semantic specialist. (b–c) Pairwise cosine similarity between register representations — DINOv2+reg R2 is dissimilar to all others (cos 0.11), while DINOv3 shows a different clustering pattern.</figcaption>
</figure>

<div id="gallery-container" class="howtocv-interactive">
  <h3 class="howtocv-section-title">Interactive: Register nearest-neighbor gallery</h3>
  <p>Select a model and register to see which image patches are most similar to each register token's learned representation.</p>
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
    <img src="/assets/images/howtocv/register_nn_static.png" alt="Register nearest-neighbor vocabulary for DINOv2+reg and DINOv3" style="max-width: 100%;">
  </noscript>
</div>

**How to read this gallery:** Higher cosine similarity means a patch more closely matches the register's learned representation. In DINOv2+reg, try R2 — all 5 nearest neighbors are dark, low-information patches (cos ~0.20), confirming its role as an artifact absorber. R1/R3/R4 show more diverse, semantically meaningful patches at higher similarity (~0.47). In DINOv3, R4 stands out with strong matches to green vegetation textures (cos ~0.77) — a clear texture specialist. R1/R2/R3 all weakly match earthy ground patches (cos ~0.2), suggesting they don't specialize on any specific visual pattern. But don't confuse visual similarity with semantic content: DINOv3's R3 carries the most classification information (50.5% probe accuracy) despite not resembling any specific patch type. It encodes abstract semantics, not visual templates.

---

## When Do Registers Become Important?

So registers matter — but *when* do they become important during the network's processing? A transformer processes information through 12 sequential layers, and each layer can change what tokens attend to and what information they carry. We traced two signals across all 12 layers: **attention routing** (how much attention mass flows to registers) and **semantic content** (how much classification information each register carries). These two signals turn out to be dissociated.

### CLS attention distribution

Before looking at per-layer dynamics, here's the high-level picture: how does CLS distribute its attention across token types?

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig4_attention.svg" alt="CLS attention distribution across models" style="max-width: 700px;">
  <figcaption><strong>Figure 6.</strong> (a) CLS attention to registers vs patches. DINOv3 routes 29.1% of CLS attention to registers vs 17.9% for DINOv2+reg. (b) Per-register breakdown: DINOv2+reg concentrates on R2 (16.1%); DINOv3 concentrates on R1 (21.1%).</figcaption>
</figure>

Explore the actual CLS and register attention maps across different images. Toggle between CLS attention (where the CLS token looks) and register attention (where registers collectively attend):

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

### Attention flow across layers

To visualize this, we computed the average attention weights across 200 images, breaking down each layer's attention into 9 flows: every token type (CLS, registers, patches) attending to every other token type.

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
    <img src="/assets/images/howtocv/attention_flow_static.png" alt="Attention flow analysis across layers" style="max-width: 100%;">
  </noscript>
</div>

Key observations:
- **DINOv2 (no registers)**: CLS receives 20–36% of patch attention throughout, serving as the sole global aggregation point.
- **DINOv2+reg**: Registers receive up to 17.9% of CLS attention, concentrated in R2 (16.1%). Registers are subordinate to CLS.
- **DINOv3**: Register attention builds **gradually** from mid-layers, reaching 28.7% of total patch attention by layer 11. R1 alone captures 21.1%. Registers become a major computational pathway.

### Layer-wise probing: when does semantic content emerge?

To measure when registers actually acquire meaningful content, we trained simple classifiers (linear probes) on each register's output at 7 intermediate layers. If a register carries class information at a given layer, the probe should achieve above-chance accuracy.

<div id="probe-container" class="howtocv-interactive">
  <h3 class="howtocv-section-title">Interactive: Layer-wise register probing</h3>
  <p>Drag the slider to see classification accuracy at each layer. Note the sharp jump at layers 10–11 and the transient R1 peak in DINOv3.</p>
  <div id="probe-chart"></div>
  <noscript>
    <img src="/assets/images/howtocv/layer_probe_static.png" alt="Layer-wise probing results for register tokens" style="max-width: 100%;">
  </noscript>
</div>

### Layer-wise task performance

The layer sweep adds another view: how does *task* performance (not just register probing) evolve across layers?

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig5_layer_sweep.svg" alt="Layer-wise classification and correspondence performance" style="max-width: 700px;">
  <figcaption><strong>Figure 7.</strong> (a) CLS classification accuracy across layers — all models are near-random until layer 8, then rise steeply. (b) Patch correspondence peaks at mid-layers (6–8) then declines for DINOv2 variants, while DINOv3 maintains the best late-layer correspondence thanks to Gram anchoring.</figcaption>
</figure>

### The temporal dissociation

The attention and probing data show a disconnect between *where the network looks* and *what it knows*:

1. **Attention routing builds gradually**: Patches start attending to registers from mid-layers onward, ramping smoothly.
2. **Semantic content emerges abruptly**: All tokens carry near-random classification accuracy through layer 8 (< 6% for DINOv2+reg, < 14% for DINOv3). Then at layers 10–11, accuracy jumps sharply — CLS jumps to 67.3%/61.9%, and specific registers follow.

These two signals are **temporally dissociated**: the attention routing infrastructure is built several layers before any semantic content appears. Registers are being used as computation targets before they carry meaningful information.

The per-register dynamics are telling:

- **DINOv3 R1**: Peaks at layer 10 (10.7% accuracy) then **drops** to 4.1% at layer 11 — despite receiving the most attention (21.1%). R1 appears to be a **transient computation buffer** — it temporarily holds and processes information before passing it along, rather than accumulating a final answer.
- **DINOv3 R3**: Progressively accumulates from 28.9% (layer 10) to 50.5% (layer 11) — a **semantic accumulator**.
- **DINOv2+reg R1/R3/R4**: All acquire and retain classification information (61–64% at layer 11) — **semantic endpoints**.

This suggests registers serve dynamic computational roles that change across layers, not fixed storage functions.

---

## Cumulative vs. Individual Register Effects

When we zero registers one at a time, the effects are modest — but they reveal which registers matter most for which tasks.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig6_register_lesion.svg" alt="Per-register lesion effects on classification and correspondence" style="max-width: 700px;">
  <figcaption><strong>Figure 8.</strong> Per-register lesion effects. (a) CLS classification: DINOv2+reg R2 is the only individual register whose removal substantially hurts (−4.9pp). DINOv3 effects are distributed. (b) Correspondence: similar pattern — no single DINOv3 register is critical alone.</figcaption>
</figure>

But zeroing all four together produces a collapse far exceeding the sum of individual effects:

- **DINOv2+reg**: Sum of individual G1 deltas = −5.2pp, collective = −18.9pp
- **DINOv3**: Sum of individual = −7.0pp, collective = −36.6pp

This **non-additive interaction** — the collective effect far exceeds the sum of individual effects — is consistent with zeroing being a disproportionately destructive intervention that compounds across token positions. The OOD disruption from zeroing one register is modest; zeroing all four creates a much larger distributional shift that cascades through subsequent layers.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/cumulative_lesion.svg" alt="Cumulative register lesion effects" style="max-width: 600px;">
  <figcaption><strong>Figure 9.</strong> Cumulative register lesion: zeroing registers one at a time. Individual effects are small, but collective zeroing (rightmost) far exceeds their sum, revealing non-additive interactions.</figcaption>
</figure>

---

## Does This Scale? Controls and Validation

### ViT-S vs ViT-B

We replicated all key experiments with ViT-B backbones. The ablation patterns are consistent across scales.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig7_scale_comparison.svg" alt="ViT-S vs ViT-B scale comparison" style="max-width: 700px;">
  <figcaption><strong>Figure 10.</strong> Scale comparison. Solid = ViT-S, dashed = ViT-B. (a) Classification: register zeroing drops are larger for DINOv3 at both scales. (b) Segmentation: DINOv3 shows the largest register-zeroing drop at both scales. The asymmetric dissociation pattern is scale-invariant.</figcaption>
</figure>

### Is register zeroing special?

A natural concern: maybe zeroing *any* set of 4 tokens would be equally disruptive? We controlled for this by zeroing 4 randomly selected patch tokens instead of registers. The result: ≤1pp drop — confirming that the register-zeroing effect is specific to registers, not a generic consequence of zeroing any tokens. But as shown above, this specificity reflects the registers' distinct activation distribution (making zeros more OOD for registers than for patches), not necessarily their unique functional content.

<figure class="howtocv-figure">
  <img src="/assets/images/howtocv/fig9_random_patch_control.svg" alt="Random patch zeroing negative control" style="max-width: 600px;">
  <figcaption><strong>Figure 11.</strong> Negative control: zeroing 4 random patch tokens has negligible effect compared to zeroing 4 register tokens. The register effects are specific to the registers, not a general consequence of removing tokens from the sequence.</figcaption>
</figure>

---

## Practical Takeaways

1. **Don't trust zero-ablation alone.** Zeroing injects OOD inputs that cascade disruption, overstating functional dependence. Always pair with replacement controls — cross-image shuffling is the strongest test (preserves real activation structure while breaking content), mean-substitution is simplest to implement.

2. **Register slots matter; register content doesn't** (for standard frozen-feature tasks). The network has reorganized its computation to expect activations in those slots. Any plausible activation works — dataset means, noise, wrong-image registers.

3. **CLS content genuinely matters.** Mean-substituting CLS also kills classification (0.1%). The fungibility is specific to registers, not a general property of the controls being weak.

4. **Registers buffer dense features from CLS dependence.** This is a real architectural effect confirmed by the CLS-zeroing asymmetry (37pp segmentation drop without registers vs <1pp with them) — and doesn't rely on zero-ablation of registers.

5. **Scale-consistent.** All findings replicate across ViT-S and ViT-B backbones.

6. **Open question:** Our fungibility result covers standard frozen-feature evaluations. Tasks requiring fine-grained register content (few-shot adaptation, generation) remain untested.

---

## Citation {#citation}

```bibtex
@inproceedings{parodi2026cls,
  title={Zero-Ablation Overstates Register Function
         in {DINO} Vision Transformers},
  author={Parodi, Felipe and Matelsky, Jordan K. and Segado, Melanie},
  booktitle={CVPR HOW Workshop},
  year={2026}
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
