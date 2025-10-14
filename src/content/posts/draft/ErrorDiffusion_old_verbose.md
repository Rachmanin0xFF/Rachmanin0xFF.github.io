---
title: Resampling I - The Lost Art of Error Diffusion
layout: post.hbs
date: 2023-08-01
tags: math, graphics, images, cs
iconpath: default.png
---

<div class="imblock">
<img src="input.png" class="postim"></img>
</div>

This is a digital photo of a synthetic clothesline against a mostly-clear sky. Each pixel inhabits an 8-bit monochromatic color space; i.e., each pixel is represented by a *byte*, some integer \\(\in [0, 255]\\). In most display environments, this is enough precision to fool our eyes into believing that the colors in the image are continuous: I can't easily see any sort of quantization (not spatially nor in terms of value) when I display the image on my monitor.

For irrelevant reasons, say I need to display this image on another monitor. Unfortunately, this new monitor's pixels only have two states: on and off. Naively, I say, "Alright, I'll only turn on a pixel if it's brightness is greater than 100."

<div class="imblock">
<img src="input_naive.png" class="postim"></img>
</div>

Oh, no. The original photo was bad, but this is allmost indiscernible. The wood's texture has been completely lost, and from out of nowhere, a noisy line splits the sky into light and dark. Distraught, I try something drastic: I add some random noise to the photo.

<div class="imblock">
<img src="input_noisy.png" class="postim"></img>
</div>

Now, I apply the exact same cutoff at a brightness of 100:

<div class="imblock">
<img src="input_random.png" class="postim"></img>
</div>

Suddenly, the noisy line vanishes, we can begin to see the texture of the wood, and our one-bit monitor has a photo that somewhat resembles the original. What happened here? Why did this work? And can we do better?

# Dither

Paradoxically, *adding* noise to a signal can often increase its fidelity after quantization (or decimation, bit reduction, compression — whatever you want to call it). Noise added for this purpose is called **dither**.

<div class="imblock">
<img src="dither_signals.png" class="postim"></img>
The noise in the last waveform is called dither.
</div>

Dither is commonly used in digital audio, digital image processing, and many other fields (radar, seismology, etc.). But not all dither is created equal. The version I used above — white noise dithering — is one of the worst. Curiously, the "goodness" of a dither is directly tied to its frequency spectrum, which we can obtain from an image via a 2D Fourier transform.

# Noise Spectra

Let's look at the [frequency-space representations](https://commons.wikimedia.org/wiki/File:2D_Fourier_Transform_and_Base_Images.png) (sometimes called a periodogram) of our clothesline photo and its two quantized versions:

<div class="imblock">
<img src="structure_preservation.png" class="postim"></img>
Pixels closer to the center of the periodogram correspond to lower frequencies; brighter pixels indicate higher amplitudes of these frequencies in the source image. The bright lines running through the periodogram represent long, sharp edges in the source photo. The periodograms in this article only display log-scaled complex modulous; phase information is discarded.
</div>

Atr a glance, the naively-quantized spectrum (center) more closely resembles the source image spectrum than its noisy counterpart: the "diffraction spikes" extend much further, and the picture appears clearer. But *near the center* of the periodogram (right), we see that our naive quantization has added an extra horizontal spike to our periodogram and altered the intensities of its diagonal spikes. Meanwhile, the noisy quantization's spectrum looks like the source image's near its center, but it retains none of the high frequencies.

The first takeaway is that noise specifically reduces *low-frequency* quantization error. The second is that our eyes *don't care* about high-frequency information. Sure, we appreciate sharp images, but the bulk of "useful" information in most photos is in its broad, low-frequency structure. A *gedankenexperiment* to illustrate my point: does downscaling a photo by a facotr 2 in each direction reduce its human-appreciable information content by a factor 4? For most of the images we see on our screens, absolutely not! In many ways, this is unsurprising: when approximating a function via Fourier series, the 1st and 2nd order decrease the error far more than the 101st and 102nd. This is because most functions (and sights) we encounter in the physical world are restrained by continuity, making high-amplitude, high-frequency noise rare (hooray for entropy).

Sorry, that was a little abstract. I'll summarize my point with a diagram:

<div class="imblock">
<img src="importance.png" class="postim"></img>
</div>

Actually, the area outside the center of the periodogram is so unimportant to our eyes that we can just fill it with noise:

<div class="imblock">
<img src="lowpass_spectrum.png" class="postim"></img>
</div>

If we try to reconstruct the image from this data, we get a low-passed version of our photo:

<div class="imblock">
<img src="lowpass.png" class="postim"></img>
</div>

Although we removed ~90% of its frequency-space information, the photo still looks pretty much like it used to.

# Blue Noise

We know that noise (dither) helps preserve low-frequency detail after quantization, but at the same time, white noise has a flat spectrum, and thus a low-frequency component that muddles an image when it's applied. What if, instead, there were another type of noise we could add *without* any low-frequency component? Enter **blue noise**:

