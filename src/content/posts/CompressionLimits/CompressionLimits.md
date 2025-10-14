---
title: Compression Limits and Understanding
layout: post.hbs
date: 2023-12-04
tags: cs, information, compression
iconpath: universe.png
---
If you search "data compression theoretical limit" you'll be referred to [Shannon's Source Coding Theorem](https://en.wikipedia.org/wiki/Shannon%27s_source_coding_theorem), and maybe [Kolmogorov complexity](https://en.wikipedia.org/wiki/Kolmogorov_complexity) if you look a little deeper.

Compression algorithms are founded on the belief that, somehow, your data is actually *less* data in a puffy jacket. I'm about to follow this line of reasoning until I crash, so hang on tight.
### Squishing Pictures
I like [raster graphics](https://en.wikipedia.org/wiki/Raster_graphics); let's look at image compression.

State-of-the-art (SOTA) image compression techniques are moving away from wavelet formats like JPEG XL and HEIF, and instead towards [CNN (Convolutional Neural Network) / GAN (Generative Adversarial Network) autoencoders](https://arxiv.org/abs/1611.01704). Recently, even large language models have been [crushing pixels](https://arxiv.org/abs/2309.10668). The point is: when it comes to compression, SOTA is becoming synonymous with neural machine learning. Actually, this is true for compression in general — even award-winning archivers like [PAQ](https://en.wikipedia.org/wiki/PAQ) are starting to [use neural nets](https://mattmahoney.net/dc/paq.html#neural).

<div class="imblock">
<img src="gancomp.png" class="postim"></img>
An illustrative comparison of image compression algorithms (GAN in the top center). Courtesy of <a href="https://arxiv.org/abs/1804.02958">"Generative Adversarial Networks for Extreme Learned Image Compression" by Agustsson et al. (2019).</a>
</div>

Indulge me for a minute. Suppose we compress a bitmap with a shallow convolutional autoencoder. Its latent space will probably have features corresponding to textures (e.g. "vertical stripes"), low-frequency components ("big dark blob here"), and so on.

As we deepen the network, tighten the latent space, and start throwing on more components, the features our compressor sees become increasingly abstract: it might 'know' what grass looks like. Maybe it's able to predict reflections. Maybe it develops a representation of Obama's face so it can store "Obama" rather than a huge vector containing his facial features.

As we continue to improve the model, it learns more and more about the world of images, and, consequently, our world. As it pares down its latent space, maybe it excludes 'physically impossible' scenes, and develops some intuition about gravity and objects. But the gains in compression dwindle, and the computation cost has already become absurd. Still, what if we ride the pareto frontier to its end? What if we had infinite compute and training data, and we knew what to do with it? How much could we compress our photos?
### Deterministic Übercompression
Generally, the better your compressor understands its input data, the higher its compression ratio. It follows that a compressor with a **complete simulation of the entire universe** would have a *really good* compression ratio.

Here's how such a machine could (de)compress .bmp files:
* **Compression:** The machine simulates the universe and begins counting each .bmp file that appears in order (relative to some reference frame, I suppose). Once the .bmp file matches the input .bmp, it terminates the simulation and saves the number.
* **Decompression:** The machine simulates the universe until it reaches the Nth .bmp file, then outputs that.

Okay, it doesn't seem like we could build this. There's probably not even a way to simulate the universe from first principles without feeding the machine an unfathomable amount of irreducible information, and if we're giving it all that, it's not exactly *compression*. But if there was a way to deterministically extrapolate everything from the [AC's final statement (Asimov)](https://users.ece.cmu.edu/~gamvrosi/thelastq.html), then the übercompressor *could* work.

*Note: You could argue that the übercompressor doesn't actually need to store anything — if it can simulate everything, it knows when someone will query it, and what item they're asking for. The important part about the machine is really how it interacts with the rest of the universe, but I'll halt this line of reasoning before I encounter a self-referential error.*

<div class="imblock">
<img src="universe_label2.png" class="postim"></img>
</div>

I like this mini-thought experiment because it shows that, at some level, compression is just *indexing*, and questions about maximum compression ratios boil down to the ontological question of 'how large is your equivalence class of objects': if it's of size \\( N \\), then you can squish your data into \\( \lceil\log_2(N)\rceil \\) bits.

Better compression algorithms realize smaller equivalence classes by folding away symmetries in data — deciphering the grammar of the input bits. In real-world data, this grammar is often *really, really complicated*: for example, the 'rules' that photos follow are just projections of the 'rules' of reality, which are obviously very messy, and obscured by an [impenetrable wall of noise](https://en.wikipedia.org/wiki/Uncertainty_principle). This means that if you want to do compression well, you'll probably have to do statistics. No surprise there!
### Takeaways
* Compression \\( = \\) finding redundancies \\( \approx \\) identifying abstractions \\( \approx \\) understanding/intelligence
* Reality is messy, and Kolmogorov complexity is an uncomputable measure, so there will always be work to do in compression. This is why there's an [open €500,000 prize](http://prize.hutter1.net/) to compress the contents of Wikipedia.