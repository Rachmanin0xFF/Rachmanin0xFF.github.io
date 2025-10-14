---
title: PDEs - Listening to Drum Shapes
layout: post.hbs
date: 2024-06-05
tags: math, physics, linalg, cs
iconpath: shape_waves.png
---

## Drumheads

Like a string on a guitar, the head of a circular drum can vibrate in [a few (infinitely many) fundamental ways](https://en.wikipedia.org/wiki/Vibrations_of_a_circular_membrane). I say "fundamental" because any physical vibration on the drum can be expressed be a combination of these basic modes.

<div class="imblock">
<img src="circle.png" class="postim"></img>
The first 12 lowest-energy eigenmodes of a circular membrane, counting degenerate states.
</div>

Well-behaved shapes (circles, rectangles, etc.) have vibrational modes that can be described exactly with mathematical expressions. But for a shape like this, which I drew in MS Paint:

<div class="imblock">
<img src="shape.png" class="postim"></img>
</div>

we need to use computers. If you ask the internet how to do this, you [will find](https://mathematica.stackexchange.com/questions/56305/numerically-solving-helmholtz-equation-in-2d-for-arbitrary-shapes) some good information and tutorials involving the [finite element method (FEM)](https://en.wikipedia.org/wiki/Finite_element_method): the art of breaking your problem down into simple little triangular bits. This works very well, but it is a pain to do, enough so that hardly anyone ever writes their own implementation of it. FEA packages (FEniCS, MOOSE, NASTRAN, etc.) are often powerful, bulky libraries that work well and are much more than we need for this simple problem. Time to take a step back.

## Math Review

We're looking for solutions to the wave equation:

\\[ \nabla^2 u = \frac{1}{c^2}u_{tt} \\]

on a surface \\( \Omega \\) with the function constrained to zero on its boundary (\\( u(\partial \Omega, t) = 0 \\)). Because we're interested in time-independent solutions, we suppose that \\(u(x, y, t)\\) is seperable in time; i.e. that:

\\[ u(x, y, t)=U(x,y)T(t) \implies \frac{T''}{c^2 T} = \frac{\nabla^2 U}{U} = -\lambda^2\\]

\\(T(t)\\) is just a sinusoid, leaving us with the eigenvalue problem:

\\[ \nabla^2 U = -\lambda^2 U\\]

This is called the Helmholtz equation, and solving it amounts to finding the eigenvalues of the Laplacian operator (\\(\nabla^2\\)). This means that in order to find our resonant modes, we only need to:
1. Find a way to represent functions on our region as vectors.
1. Represent the Laplace operator (acting on our region) as a matrix.
2. Find the eigenvectors & eigenvalues of that matrix.

The eigenfunctions \\(\\{U_i\\}\\) will be the resonant mods, while the square roots of the eigenvalues \\(\\{\lambda_i\\}\\) will be proportional to their respective modes' oscillating frequencies.

## Digital Frontier

The math so far has been method-agnostic; we're still free to use the FEM at this point. But the blob I drew earlier suggests another option: it exists on a grid of pixels. We can choose to represent functions on the blob as vectors, where each entry corresponds to the function's value at a different pixel in the photo. This is the foundation of the finite difference (FD) method; a precursor to the FEM. While the FEM is, ultimately, faster and more accurate, the FD method is far easier to implement and debug.

First of all, we'll need maps that take us from pixels to vector indices and vice versa. I'll use Python:
<pre><code class="language-python">import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

# Get rid of any aliasing in the blob image
binary_image = np.array(Image.open('blob.png').convert('1'))

# This will contain the associated pixel coords for each vector entry
interior_index = []

# This will contain the vector entry index for each pixel (init to -1)
grid_index = -np.ones(binary_image.shape, dtype=np.int32)
ii = 0
for ix, iy in np.ndindex(binary_image.shape):
    # Only include a pixel in our vector if it's within the blob
    if binary_image[ix][iy]:
        interior_index.append((ix, iy))
        grid_index[ix, iy] = ii
        ii += 1
interior_index = np.array(interior_index)

# Look at what we did
grid_index = np.ma.masked_where(~binary_image, grid_index)
plt.imshow(grid_index)
cbar = plt.colorbar()
cbar.set_label("Index in vector")
plt.show()
</code></pre>

<div class="imblock">
<img src="indices.png" class="postim"></img>
</div>
Next, we need to figure out what the Laplace operator looks like when applied to one of these 28465-dimensional vectors.


Let's think intuitively. The Laplace operator \\(\nabla^2 U = U_{xx}+U_{yy}\\) is a measure of *curvature*. Locally, curvature is how much the average value of a point's neighbors differ from that point. So, to find the curvature at a specific pixel (and thus a specific vector entry), we subtract the average of the values at the pixel's neighbors from the pixel's own value:

\\[ \nabla^2 U(x, y) \approx \frac{1}{\epsilon^2}U(x,y) - \frac{1}{4\epsilon^2}\big[U(x+\epsilon, y)+U(x-\epsilon, y)+U(x,y+\epsilon)+U(x, y-\epsilon)\big] \\]

Where \\( \epsilon \\) is the spacing between adjacent pixels. Wonderfully, this per-pixel operation is linear, and nothing stops us from putting it in matrix form:
<pre><code class="language-python">epsilon = 1.0/100.0 # A pixel is 1/100th of a... unit? It's all arbitrary.

FD_matrix = np.zeros((interior_index.shape[0], interior_index.shape[0]))
for (ix, iy) in interior_index:
    this_i = grid_index[ix, iy]
    r_i = grid_index[ix+1, iy]
    l_i = grid_index[ix-1, iy]
    u_i = grid_index[ix, iy+1]
    d_i = grid_index[ix, iy-1]
    if r_i > 0:
        FD_matrix[this_i][r_i] -= 1
    if l_i > 0:
        FD_matrix[this_i][l_i] -= 1
    if u_i > 0:
        FD_matrix[this_i][u_i] -= 1
    if d_i > 0:
        FD_matrix[this_i][d_i] -= 1
    FD_matrix[this_i][this_i] += 4
FD_matrix *= 0.25/(epsilon*epsilon)
</code></pre>

This is a *sparse* matrix; less than 0.1% of its entries are nonzero. We'll find its eigenvectors using SciPy's <code>scipy.sparse.linalg.eigs</code> function. We're also primarily interested in the lower-energy modes (larger patterns), so we'll specify that by setting <code>which='SM'</code>.

<pre><code class="language-python">from scipy.sparse import csc_matrix
from scipy.sparse.linalg import eigs
# let's only get the first 12 to start
vals, vecs = eigs(csc_matrix(FD_matrix), k=12, which='SM')
</code></pre>

Running this takes about 20 seconds on my PC. Finally, we'll use our <code>interior_index</code> array to turn the eigenvectors back into images:

<pre><code class="language-python">plt.rcParams['figure.figsize'] = [10, 5]

f, axarr = plt.subplots(3,4)
ii = 0
for vec in vecs.T:
    output_image = np.zeros(binary_image.shape)
    i = 0
    for val in vec:
        (xi, yi) = interior_index[i]
        # The imaginary components should all be zero
        # This just prevents Python from throwing a warning
        output_image[xi][yi] = np.real(val)
        i += 1
    output_image = np.ma.masked_where(~binary_image, output_image)
    # Draw the modes to subplots
    axarr[ii//4][ii%4].imshow(output_image, cmap='Spectral')
    axarr[ii//4][ii%4].axis('off')
    ii += 1
plt.show()
</code></pre>

<div class="imblock">
<img src="twelvemodes.png" class="postim"></img>
</div>

Let's take a closer look at one of these:
<div class="imblock">
<img src="amode.png" class="postim"></img>
</div>

To test this method's accuracy, I gave it a 256x256 image of a circle and compares the resulting eigenvalues to the zeros of the relevant Bessel functions. For the first few harmonics, the margin of error was consistently less than 0.1%.

## Damping

The solutions we've found assume that our membrane is perfect; i.e. that it does not lose energy. This isn't good: even if it was physically possible, it would imply that we couldn't hear the drum (as it isn't emitting any energy in the form of sound). Thankfully, it isn't that difficult to introduce a damping term into the wave equation:

\\[ \frac{1}{c^2}u_{tt} = \nabla^2 u - \beta u_t \implies T'' + c^2\beta T' + \lambda^2 c^2 T = 0\\]

The resulting equation in \\(t\\) represents a damped harmonic oscillator, and the only real change is that our time-solutions get a shifted natural frequency and an exponential decay term:
\\[T_\lambda(t)\propto\exp\left(-\frac{\beta c^2}{2} t\right) \cos\left(\frac{c\sqrt{4\lambda^2 - c^2 \beta^2}}{2} t - \phi_\lambda \right) \\]

Where \\( \phi_\lambda \\) is some phase angle depending on our initial conditions. If we let \\( \alpha = c\beta/2 \\), the final equation cleans up nice:
\\[T_\lambda(t)\propto e^{-\alpha c t} \cos\left[\sqrt{\lambda^2 - \alpha^2}\\ c t - \phi_\lambda\right] \\]

## Striking the Shape

The Laplace operator is symmetric, so its eigenfunctions should be orthogonal. This means that determining the coefficients of some distortion (e.g. one made by a mallet) on our membrane is as simple as performing a series of inner products. Specifically, any state our membrane might take \\( f(x,y) \\) can be written using a Fourier expansion of the membrane's normalized basis modes \\(\\{ U_i\\}\\):

\\[ f(x,y)=\sum_k c_k\\ U_k(x, y),\\ \\ c_k=\int_\Omega U_k(x, y) f(x, y)\\ dx\\ dy \\]

If we let our mallet whack the membrane with a Dirac delta function, \\(f(x,y) = \delta(x-x_0,y-y_0)\\), we can avoid computing the integral on the right, and just select values from \\(\\{ U_i\\}\\) at \\((x_0, y_0)\\). Doing this with the first hundred harmonics shows Airy disc-esque patterns on the membrane:

<div class="imblock">
<img src="airy.png" class="postim"></img>
</div>

To remove the (unphysical) ringing artifacts, we can apply a low pass filter to the spectrum (\\(G\propto 1/f \\)):

<div class="imblock">
<img src="noairy.png" class="postim"></img>
</div>

Despite feeling a little dirty, this works, and it runs quickly.

## Listening

We know the eigenmodes and their frequencies, and we can find their amplitudes (given a 'mallet' strike location). All that remains is to add up the sine waves. After that, SciPy has the convenient <code>scipy.io.wavfile</code> that makes it easy to export audio from our simulation.

<pre><code class="language-python"># Calculate more eigenmodes for a better sound
vals, vecs = eigs(csc_matrix(FD_matrix), k=128, which='SM')

from scipy.io.wavfile import write
# Set some constants (arbitrarily)
alpha = 0.005
c = 1000.0
strike_x = 150
strike_y = 100

# The division at the end is my 'low pass filter'
amplitudes = np.real(vecs[grid_index[strike_y, strike_x]])/(np.abs(vals)+5.0)
rate = 44100 # standard for audio stuff
data = np.arange(0, 1, 1.0/rate) # fill it with timestamps
for i in range(0, len(data)):
    t = data[i]
    level = 0.0
    # w02 means \omega_0^2...
    for A, w02 in zip(amplitudes, np.real(vals)):
        # not worrying about speed here
        frequency = np.sqrt(w02 - alpha**2)*c
        level += A*np.sin(frequency*t)*np.exp(-alpha*c*t)
    data[i] = level

# .wav files are made of many large integers
scaled = np.int16(data / np.max(np.abs(data))*32767)
write('one_second_hit.wav', rate, scaled)
</pre></code>

The nice thing about this approach is that we can vary <code>strike_x</code> and <code>strike_y</code> to get all sorts of interesting sounds out of our drum. For example, if we strike the blob in its 'middle', we get this sound:

<div class="imblock">
<img src="middle.png" class="postim"></img>
</div>
<audio controls style="width: 90%;">
    <source src="blob_150_100.mp3" type="audio/mp3">
</audio>

While if we strike it on the nub in the upper-left corner, it sounds like this:

<div class="imblock">
<img src="upperleft.png" class="postim"></img>
</div>
<audio controls style="width: 90%;">
    <source src="blob_50_50.mp3" type="audio/mp3">
</audio>

## Uniqueness

No article about whacking arbitrary shapes would be complete without at least mentioning Mark Kac's famous 1966 article ["Can One Hear the Shape of a Drum?"](https://maa.org/programs/maa-awards/writing-awards/can-one-hear-the-shape-of-a-drum). [The answer](https://en.wikipedia.org/wiki/Hearing_the_shape_of_a_drum#The_answer), found in 1992 in a couple (and later a one-parameter family) of isospectral shapes, is "no". Infinitely many shapes can have the exact same spectra (eigenvalues). However, the follow-up question, ["okay, but what if you can whack it in different spots,"](https://mathoverflow.net/questions/227707/can-you-hear-the-shape-of-a-drum-by-choosing-where-to-drum-it) is still open.

Despite all this buzz about the topic, I wasn't able to find much online in the way of actually *listening* to the shape of a drum, which is why I wrote this article. On a related note, here's one of the members of the famous isospectral pair:

<div class="imblock">
<img src="isospec1.png" class="postim"></img>
</div>

And here is the glorious, undamped (and low pass filtered) sound of every eigenmode activated simultaneously:

<audio controls style="width: 90%;">
    <source src="isospec1.mp3" type="audio/mp3">
</audio>