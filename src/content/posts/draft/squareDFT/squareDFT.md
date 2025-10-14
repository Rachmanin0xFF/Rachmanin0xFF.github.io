---
title: A Square FFT
layout: post.hbs
date: 2023-05-08
tags: cs, math, signals
iconpath: squareDFT.png
hidden: false
draft: false
---

## Introduction

I recently indulged in the "pleasure" of writing my own implementation of the [Cooley-Tukey radix-2 DIT fast Fourier transform (FFT)](https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#The_radix-2_DIT_case) for AVR microcontrollers. Despite the immeasurable fun I had scratching my head over bit-twiddling and fixed-point multiplication bugs, I wasn't writing the library for its own sake. The final project for my intro EE course was in basic signal processing:

<div class="imblock">
<img src="emtproject.png" class="postim"></img>
The cute little circuit I designed for my "Electronic Measurement Techniques" class. 
</div>

Our grade was dependent on how quickly and accurately we could identify different frequencies in an input signal. I looked around at available Arduino FFT libraries and quickly decided I wanted to try making my own. In the process, I stumbled across a silly, inaccurate, surprisingly effective alternative to the traditional FFT. I'll provide a quick refresher on Fourier transforms, then jump into other strategies.

### Background

The fast Fourier transform (FFT) is among the most important and widely-used algorithms ever created. The process is so universally effective that it is even applicable to [*multiplication*](https://en.wikipedia.org/wiki/Sch%C3%B6nhage%E2%80%93Strassen_algorithm). Ultimately, it is just a divide-and-conquer method for calculating the **discrete Fourier transform (DFT)**. The DFT is much easier to understand and has a wonderful visual interpretation. Consequently, there are many online videos and articles explaining it.

IMO, the best of these was created five years ago by the exceptional math YouTuber Grant Sanderson (a.k.a. [3Blue1Brown](https://www.youtube.com/@3blue1brown)), who published a [wonderful video](https://www.youtube.com/watch?v=spUNpyF58BY) on the Fourier Transform. I won't repeat his explanation in detail (watch the video!), but a Fourier transform works via "spinning" your input signal around in a circle. If the frequency of the spinning matches a frequency in the signal, the resulting pattern will be lopsided, and the amount of lopsided-ness represents the intensity of that frequency in the signal.

When working symbolically, Fourier transforms are relatively easy to compute; we define the Fourier transform of a signal \\(f(x)\\) as follows (I will neglect normalization coefficients in this article):

\\[ F(s):=\int_{-\infty}^\infty f(x) e^{-2\pi i s x} dx \\]

This is a lovely equation (infinite limits make for easy integrals), but in practice, it fails: what if we want to take the Fourier Transform of a discrete time series, like an audio signal? We can't let our limits go to infinity, and our continuous integral needs to be replaced with something more appropriate for computers. Enter the **discrete Fourier transform** (DFT). For a series \\(f=f_0, f_1, f_2, \ldots, f_{N-1}\\):

\\[ F(k):=\sum_{j=0}^{N-1}f_j e^{-2\pi i \frac{kj}{N}} \\]

The logic behind this transform is identical to its continuous analog, but now we can actually write a program to compute it. If it helps, you can think of the DFT as a kind of Riemann sum approximation of the full Fourier transform.

Unfortunately, calculating the DFT with a naive sum is very slow. Specifically, computing \\(K\\) DFT bins from \\(N\\) input samples is of complexity \\(O(KN)\\), or \\(O(N^2)\\) if \\(K=N\\). The FFT brings this down to \\(O(N \log N)\\) by using the fact that *merging* two DFTs is only \\(O(N)\\).

## Speed

The real operation cost of any FFT comes from the calculation of the phase factors [(twiddle factors)](https://en.wikipedia.org/wiki/Twiddle_factor). These essentially amount to computing \\(e^{i\theta}\\), or \\(\sin\theta\\) and \\(\cos\theta\\) for some fixed set of values. Typically, these operations are either precalculated or interpolated from a lookup table (LUT). Combine this with some well-placed bit shifting, and we are now faced with a new bottleneck: the cost of multiplying the twiddle factors by the signal.

Admittedly, I was writing in C, not ASM, so there were certainly other, more direct avenues for optimization before trying to shave off a few clock cycles lost to multiplication. But I was curious: what if I could avoid multiplication altogether?

Remember how I mentioned that a Fourier transform spins a signal around in a circle?

<div class="imblock">
<img src="circle.gif" class="postim"></img>
</div>

What if instead, we spin it around in a *square*?

<div class="imblock">
<img src="box.gif" class="postim"></img>
Okay, this isn't really a square, it's eight points in a square-like pattern. To make a true square shape, you would need to replace your sinusoids with truncated/clamped triangle waves. For lack of a better name, I'll still call it a "square" in this article.
</div>

This sounds kind of stupid, but the advantage is that (when properly implemented) it can be quite fast. Multiplying by this sort of wave actually doesn't have to involve an IMUL operation at all; you only need to do one of three things for each axis:

1. Set the number to zero (multiply by 0)
2. Negate the number (multiply by -1)
3. Leave the number unchanged (multiply by 1)

Determining *where* along the signal these things need to happen can slow things down, but the operations themselves are all very fast. Note that these waves are not quite square waves: their range also includes zero.

## Distortion

Crudely approximating \\(\sin()\\) and \\(\cos()\\) like this inevitably leads to some artifacts in the output spectrum. Where the DFT of a pure sine wave would show a single spike at the correct frequency, the "square" approximation contains (sub)harmonic artifacts:

<div class="imblock">
<img src="squarefftspec.png" class="postim"></img>
</div>

Let's a lot of these graphs and squish them into a picture to get an idea of the artifact intensity w.r.t. input frequency.

<div class="imblock">
<img src="fig1.png" class="postim"></img>
The input signals for these spectra include random phase offsets, moderate sub-bin frequency variations, and background white noise (at 5% signal strength) -- I figured I'd make it a fair fight. Colors use a log scale.
</div>

Definitely worse, but not too bad! It's difficult to see in the log scale, but the strongest artifacts in the square DFT are still under 25% of the true peak diagonal. The performance is usually good enough to identify a few sinusoidal frequencies of similar magnitudes (which was, incidentally, exactly what my EE project required).

Also, just for kicks, here's another version using a triangle wave:

<div class="imblock">
<img src="triangle.png" class="postim"></img>
This amounts to wrapping your signal around the complex plane in a diamond shape.
</div>

## Interpretation

The wonderful thing about Fourier analysis that it isn't specific to sines and cosines. The \\(e^{i\theta}\\) basis is used for convenience mathematics and physics, but Fourier decomposition never requires it. In fact, given *any* complete set of basis functions \\( \{g_1, g_2, g_3, \ldots\} \\) we can always find coefficients such that any arbitrary function in Hilbert space \\( f(x) \\) can be represented as as:

\\[ f(x) = \sum_j^\infty c_j g_j(x)\\]

If our basis functions are orthogonal (no \\(g_j\\) can be written as the sum of products of other \\(g\\)s) and normal (the integral of \\(|g_j|^2=1\\)) then we can find these coefficients using the same integral we used for our Fourier transform (the **inner product** of \\(f\\) and \\(g_j\\)):

\\[ c_j = \int_{-\infty}^{\infty} f(x) g_j(x) dx = \langle f, g_j \rangle \\]

When \\(g_0(x)=\sin(x), g_1(x)=\sin(2x), g_3(x)=\sin(3x),\ldots\\), we call our sum a Fourier (sine) series. When \\(g_j(x)\\) are small digital blips, we call it a [Haar wavelet transform](https://en.wikipedia.org/wiki/Haar_wavelet). Each different choice of our \\(\{g_j\}\\), our **basis**, has its own unique applications and use cases.

The "square" sinusoids I used here are just another basis in Hilbert space. The "artifacts" that appeared in my signals were there because the DFT wasn't decomposing my signal into sinusoids, it was decomposing it into a basis of pseudo-square waves. The real advantage of using the sine/cosine/circle basis is that the amplitude of a signal is independent of its phase angle, but this is not necessarily guaranteed for other bases (squares are not radially symmetric).

## Conclusion

It's easy to think of FFT libraries as magical black boxes that spit out spectra and phase information. Most of the time, this is perfectly acceptable. But occasionally, limited hardware, speed requirements, or some very specific problem will necessitate the use of a different basis (often [wavelets](https://en.wikipedia.org/wiki/Discrete_wavelet_transform) or a [DCT](https://en.wikipedia.org/wiki/Discrete_cosine_transform)). Sometimes, it's hip to be square! :]