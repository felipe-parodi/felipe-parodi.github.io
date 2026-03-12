---
layout: post-scholar
title: "Awesome Computational Primatology: a community resource"
date: 2024-03-11
categories: [blog]
tags: [computational-primatology, deep-learning, computer-vision, primate-behavior, open-science]
excerpt: "A curated, open resource cataloging 97+ papers at the intersection of deep learning and primate research — from early face recognition to cross-species behavior understanding."
extra_css:
  - /assets/css/howtocv.css
---

<div class="howtocv-links">
  <a href="https://kordinglab.com/awesome-computational-primatology/" class="howtocv-link-btn"><i class="fas fa-globe"></i> Website</a>
  <a href="https://github.com/KordingLab/awesome-computational-primatology" class="howtocv-link-btn"><i class="fab fa-github"></i> GitHub</a>
  <a href="https://huggingface.co/datasets/fparodi/awesome-computational-primatology" class="howtocv-link-btn">&#129303; HuggingFace</a>
</div>

Understanding how primates move, communicate, and interact in their natural environments is one of the problems I care about most in biology. Since around 2011, researchers have built systems that detect primate faces, reconstruct 3D body pose from dozens of synchronized cameras, classify complex social behaviors, decode vocalizations, and generate realistic 3D avatars. The work now spans 14 topic areas, dozens of species from lemurs to great apes, and methods ranging from detection and pose estimation to facial action coding, hand tracking, species identification, and reinforcement learning.

<figure>
  <img src="/assets/images/awesome-comp-primatology/loos-ernst-2013-chimp-faces.png" alt="Automated chimpanzee face detection showing detected faces and eyes marked in green across two field datasets">
  <figcaption>Among the earliest automated chimpanzee face detection systems, with detected faces and eyes marked in green across zoo and field datasets. From <a href="https://doi.org/10.1186/1687-5281-2013-49">Loos & Ernst, EURASIP J. Image Video Process. 2013</a>, CC-BY 2.0.</figcaption>
</figure>

To help the community navigate this growing literature, we built [**Awesome Computational Primatology**](https://kordinglab.com/awesome-computational-primatology/) ([GitHub](https://github.com/KordingLab/awesome-computational-primatology), [HF](https://huggingface.co/datasets/fparodi/awesome-computational-primatology)) — a curated, open registry of 97+ papers at this intersection, with an [AI-powered chat assistant](https://kordinglab.com/awesome-computational-primatology/) for querying the corpus in natural language.

<figure>
  <img src="/assets/images/awesome-comp-primatology/openmonkeystudio-2020-3d-pose.png" alt="OpenMonkeyStudio multi-camera 3D macaque pose estimation system" style="max-width: 400px;">
  <figcaption>OpenMonkeyStudio reconstructs 13 body landmarks in 3D from 62 synchronized cameras, enabling markerless motion capture in freely moving macaques. From <a href="https://doi.org/10.1038/s41467-020-18441-5">Bala et al., Nat. Commun. 2020</a>, CC-BY 4.0.</figcaption>
</figure>

<figure>
  <img src="/assets/images/awesome-comp-primatology/chimact-2023-behavior.png" alt="ChimpACT dataset showing annotated chimpanzee video frames with pose and behavior labels">
  <figcaption>ChimpACT provides 160,500 annotated frames for joint detection, tracking, pose estimation, and behavior recognition in chimpanzees. From <a href="https://doi.org/10.48550/arXiv.2310.16447">Ma et al., NeurIPS 2023</a>.</figcaption>
</figure>

But the diversity of approaches also shows how far we have to go. No single method, dataset, or species captures the full complexity of primate behavior — and too many models and datasets stay siloed or invisible to researchers working on related problems. That is why resources like this matter: connecting work across species, modalities, and methods so we can see where the gaps are and where open tools already exist. If you work at this intersection — or want to — we would love your contributions. Add a paper, open-source a model, share a dataset. Solving behavior understanding in primates is not something any one lab will crack alone; it will take a community building bridges across all of these approaches, and I believe this generation of researchers is up for it.

<figure>
  <img src="/assets/images/awesome-comp-primatology/primateface-2025-dataset.png" alt="PrimateFace dataset showing annotated face images with 68 facial landmarks across six primate superfamilies">
  <figcaption>PrimateFace provides 260K+ annotated face images with 68 facial landmarks across six primate superfamilies, from lemurs to humans. From <a href="https://doi.org/10.1101/2025.08.12.669927">Parodi et al., bioRxiv 2025</a>, CC-BY 4.0.</figcaption>
</figure>
