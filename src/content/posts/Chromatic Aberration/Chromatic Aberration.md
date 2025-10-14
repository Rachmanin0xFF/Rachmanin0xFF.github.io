---
title: The Chromatic Aberration Rant
layout: post.hbs
date: 2020-03-17
tags: color, physics, art, graphics
iconpath: Chromatic Abberation.png
---
Which do you prefer? This:

<img src="mona.png" class="postim" alt="the mona lisa">

or this:

<img src="mona_abbr.png" class="postim" alt="the mona lisa with chromatic aberration">

The second photo has an effect applied to it called "chromatic aberration," a visual post-process characterized by its distinctive colorful "fringing" on sharp edges. This hue-shifting, eye-melting distortion has been growing into its role as a member of the mainstream digital artists' toolkit ever since 'glitch art' and the 'low-fi vaporwave aesthetic' became popular. What started as a small trend in an esoteric art form is now being used extensively by artists, videogames, and multinational corporations. But what is it, exactly, and where does its appeal originate?

<div class="imblock">
<img src="chroma_in_the_wild.png" class="postim" alt="examples of chromatic aberration: spider verse, tiktok logo, Outer Worlds, art">
Pictured (from top-left, clockwise): A screenshot from the film *Into the Spider-Verse* (2018), The logo for the video-sharing social network TikTok, a screenshot from the game *Outer Worlds* (2019), detail on artwork by the notoriously popular illustrator Ilya Kuvshinov.
</div>
<br><br>

# Physical Origins

While notes on the history of chromatic aberration as an artistic effect is scarce, there is plenty of information on it in a physical context. As the scientific-sounding name might suggest, chromatic aberration is a well-documented optical peculiarity that we have all experienced on some level.

<img src="chroma_in_the_nature.png" class="postim" alt="a rainbow, a prism">

Chromatic aberration's origins come from *dispersion*, a phenomenon where a lens refracts different colors of light at different angles. This optical curiosity happens in water droplets, on the back of CDs, or in puddles of oil. Lenses make rainbows -- even camera lenses.

<img src="chroma_in_the_camera.png" class="postim" alt="examples of photos with chromatic aberration">

Chromatic aberration is a nuisance to photographers. Nearly all writing regarding the effect are technical pieces concerned with how to reduce or 'correct' it in photographs. As light passes through a camera lens, dispersion radially distorts the different colors present in the light, creating those characteristic "fringes" on the edges of photos -- usually to the detriment of the photo's quality and clarity.

<img src="cmoa.gif" class="postim" alt="lens focusing light, light getting dispersed based on wavelength">

Modern cameras attempt to negate chromatic aberration in a variety of ways: Different types of glass, unique lens configurations, or digital correction. None of these methods are perfect, but they 'fix' it enough to make it imperceptible in photographs.

Side note: The lenses in our eyes also experience chromatic aberration (and pretty significantly, too!) However, our optic nerves do a fantastic job of filtering it out of our vision, so you'll probably never notice it.
# Criticism
So why are artists and designers applying this ["failure of a lens"](https://en.wikipedia.org/wiki/Chromatic_aberration) to their work? This question has been [asked](https://old.reddit.com/r/pcgaming/comments/dxor1i/why_is_chromatic_aberration_a_thing_in_games/) [before](https://old.reddit.com/r/truegaming/comments/3d0suk/why_did_chromatic_aberration_become_so_prevalent/), usually by annoyed gamers tired of the industry's obsession with fancy postprocesses. And there is some truth to these complaints: excessive chromatic aberration looks *bad* -- headache-inducing bad.

<div class="imblock">
<img src="chroma_in_the outer_worlds.png" class="postim" alt="the game The Outer Worlds with and without chromatic aberration">
Another screenshot from *The Outer Worlds* (2019) with and without chromatic aberration (and DOF)
</div>

Artists of all trades like to jump on 'trendy' effects and filters, [as others have pointed out](https://old.reddit.com/r/truegaming/comments/3d0suk/why_did_chromatic_aberration_become_so_prevalent/ct0w56p/). A small section of my family photos are obscured by obnoxious iPhone filters -- new, popular technology is fun to use and abuse.

<div class="imblock">
<img src="fable.jpg" class="postim" alt="obnoxious glowing effect (bloom) in the game Fable: The Lost Chapters">
A screenshot from Fable: The Lost Chapters. Remember when all games glowed this much?
</div>

But there's more to the effect than "because we could". Like lens flare or DOF, chromatic aberration can look good when applied tastefully, and in moderation. Here are a couple examples:

<div class="imblock">
<img src="alex-flores.jpg" class="postim" alt="chromatic aberration in some crazy muscle dude by Alex Flores">
"God Fist Lee Sin" by Riot Games Senior Artist Alex Flores (2017) -- Notice the fringing in the upper-left corner.
</div>

<div class="imblock">
<img src="spider-verse-CA-2.png" class="postim" alt="chromatic aberration in the movie Into the Spider-Verse">
*Into the Spider-Verse* (2018) used stylized chromatic aberration as a substitute for depth of field.
</div>

# Artistic Function
Chromatic aberration's most common use is to signify an object is "out-of-focus" without actually blurring it. The effect physically displaces color channels while maintaining their details, resulting in a less-destructive version of "depth of field," another physical quirk of cameras.

<img src="de_sum_desc.png" class="postim" alt="examples of different depth of field effects">

The other way to use chromatic aberration is a little more involved. Take a look at this poster for *Avengers: Endgame* (2019):

<img src="avengers.jpg" class="postim" alt="poster for movie avengers: endgame featuring rim lighting">

Notice how the edges of every character glow with a white outline? This is a technique in photography called backlighting, or rim lighting, where the subject(s) are illuminated from behind. Backlighting introduces sharp outlines to a photograph, helping to clarify silhouettes and add some extra "pop" to a photo.
	Chromatic aberration also targets the edges of its subjects, except it highlights with color instead of light.

<img src="edge-HL-chromab.png" class="postim" alt="a circle with and without chromatic aberration">
	
Chromatic aberration is similar to backlighting with two colored lamps.

The downside is that you lose a level of control: more than just the silhouette becomes highlighted, and the effect starts eating away at details that should be preserved. To compensate, many artists selectively remove or add chromatic aberration to regions of their piece, or will instead paint in chromatic aberration-like effects manually.

<div class="imblock">
	<img src="lea-pinto.jpg" class="postim" alt="a painting by lea pinto">
	Tasteful application of chromatic aberration in Léa Pinto's *Back to Sunny Days* (2020)
</div>

Additionally, artists will sometimes tweak the colors of the aberration to better fit the palette of their work -- there's no reason to make an artistic choice appear physically accurate.

# Implementation

Chromatic aberration is extremely easy to apply in popular drawing programs like Procreate and Artstudio Pro. The ease of access to the effect is probably a contributor to its overuse in the modern digital art scene.

<img src="procreate chromatic ab.png" class="postim" alt="procreate chromatic aberration menu option">

These programs emulate the effect by splitting the source image into its red, green, and blue channels. These channels are shifted in physical space, then added back together.

<img src="how-it-work.png" class="postim" alt="smiley face getting split into RGB then back into image with chromatic aberration">

In Photoshop, Gimp, and most other photo-editing applications, this can be accomplished by making three copies of the image, filtering out everything but red/green/blue in those copies, shifting the red/blue channels to the left/right, then setting the blend modes of the top two layers to "Addition".

Now for the rant.
# Physical Accuracy
The above implementation of CA (chromatic aberration) is simple, easy, and straightforward, but it isn't correct. Now, as a disclaimer, there is almost *never* a reason to care about the physical accuracy of optical effects recreated for artistic reasons. However, this is a rant. This article will get technical starting here.

For starters, linearly shifting the RGB channels left and right doesn't make sense. In a real lens, there are two types of CA, and neither is properly represented by a simple uniform displacement of color channels. The first type, lateral/transverse CA, results in zoom-blurred look where blues are stretched to the outside of the photo, and reds are squished towards the inside.

<img src="LT-CA.png" class="postim" alt="lateral transverse chromatic aberration">

This isn't too hard to emulate: scale the RGB copies of the source image or apply a barrel distortion to them instead of shifting them left and right. Both Procreate and Artstudio Pro actually do offer this type of aberration in addition to the simple linear technique described earlier.

The second type, longitudinal or axial distortion, is one that I haven't yet seen applied in art, probably due to its increased complexity and less-appealing effects.

<img src="LA-CA.png" class="postim" alt="longitudinal axial chromatic aberration">

Axial CA is tougher to correct digitally, so most camera lenses are engineered to minimize it. It occurs when one color (usually green, because of its luminosity) is in focus, but the others (red and blue) aren't. This results in the red and blue channels appearing blurred, creating the notorious  "purple fringing" effect. This type of aberration can be emulated by simply blurring the red and blue channels of the photo. This variant of CA hasn't made its way into videogames yet, partially because blurring is far more computationally expensive than shifting around color channels.

Additionally, the separation between (red and green) and (green and blue) shouldn't be equal. Red, green, and blue have frequencies of 612nm, 549nm, and 464nm in sRGB with respect to the D65 white point, a decent approximation of most monitors. The blue here is ~1.35 times further from green than red is. This, when combined with the nonlinearity of lens focus error curves (and other factors), is why "purple fringing" isn't "magenta fringing".

Okay, so if we want physically accurate CA, we just use these strategies together, right?
# Even More Physical Accuracy
Up until now, we've only been worrying about light in terms of RGB color channels. Unfortunately, in the real world, we have light sources other than lasers, and wavelengths other than red, green, and blue. To visualize things, so far we've been dealing with this:

<img src="RE-NM.png" class="postim" alt="fake emission spectra with only pure RGB light">

When the reality is closer to this:

<img src="2800k.jpg" class="postim" alt="emission spectra of 2800k light">

Our three-channel model is obviously a gross oversimplification of the reality of the situation. The real world isn't lit by LEDs with Dirac-delta spectral power distributions. Ideally, instead of splitting our images into red, green, and blue channels, we would split them into an arbitrary number of bins for different frequencies, then distort each bin appropriately. There's a catch, though: Image formats *can't* be decomposed into their spectral components.

There is no magical formula to convert an RGB color into a power spectrum. For every color displayed on a monitor, there are an infinite number of possible spectra that when displayed, would be completely indistinguishable from the color on your screen. The situation is comparable to having to play a song after only hearing three notes of it. I think the easiest solution would be to interpolate between some set of RGB basis distributions, then normalize the result. But even then, there are additional issues.

To start, sRGB isn't a linear color space -- in order to operate on colors represented in it, it's necessary to de-gamma the colors before adding colors to one another (this is a good practice anyway).

Next, you have lens profiles to worry about.

<img src="focus-error.png" class="postim" alt="focus error of different lens types">

As mentioned in passing earlier, lenses don't diffract light linearly. In addition to spatial distortions, different types of lenses fail to focus light in different ways. This is another infinite function landscape to deal with. If you're going this far, it would probably also make sense to think about photodetectors' sensitivity curves, which vary between cameras. And while you're at it, maybe do all the computation in terms of power spectra so you don't have to worry about issues with color spaces.

Or, you know, don't worry about any of this and just use Procreate's filter until the next cool visual effect appears.
