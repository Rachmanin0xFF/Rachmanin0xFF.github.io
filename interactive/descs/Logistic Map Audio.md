---
title: Logistic Map Audio
description: This is about page
layout: interpage.hbs
interpath: Logistic Map Audio
private: true
date: 2022-05-17
---

Click with the mouse to interact!

## Background
The [logistic map](https://en.wikipedia.org/wiki/Logistic_map) is one of the "simplest" maps that gives rise to chaotic behavior. It is defined as the series:
  \\[x_{n+1}=rx_n(1-x_n) \\]
For \\( 1&lt;r&lt;3 \\), \\(x\\) converges to \\( \frac{r-1}{r} \\), but for higher \\( r \\), \\(x\\) begins to oscillate between values, and eventually its behavior becomes chaotic. This is best visualized with a [bifurcation diagram](https://en.wikipedia.org/wiki/Bifurcation_diagram) (as shown in the visualization).

## Listening to the Map

This applet applies the logistic map to a random value repeatedly, and translates the result into an audio waveform (using a sample rate of 4096Hz). Only values of \\(r\\) between 3 and 4 are allowed (lower values lead to waveforms that are just DC offsets). An FFT of the signal is shown in the bottom pane. The applet was made using <code>AudioWorkletNode</code> and <code>p5.js</code>.