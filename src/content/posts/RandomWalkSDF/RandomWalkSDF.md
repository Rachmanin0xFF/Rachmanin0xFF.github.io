---
title: PDEs - Random Walks and Distance Fields
layout: post.hbs
date: 2024-06-08
tags: math, physics, cs, graphics
iconpath: randomwalk.png
---

In my [previous post](https://www.adamlastowka.com/articles/SquiggleSound/), I showed how to solve the Helmholtz equation using the finite difference (FD) method. In this post, I want to highlight a lesser-known technique for solving PDEs that doesn't involve any linear algebra whatsoever.

## The Walk-on-Spheres (or Circles) Method

The WoS method was [introduced in 1956](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-27/issue-3/Some-Continuous-Monte-Carlo-Methods-for-the-Dirichlet-Problem/10.1214/aoms/1177728169.full) as a method of solving the Laplace equation (\\(\nabla^2 u = 0\\)). The algorithm is a Monte Carlo method: it uses repeated random sampling to approximate a solution.

The method relies on the mean value property of the Laplace equation: to find the value of a solution at a point, just take the average of the values in a circle (or a solid disc, consequently) around it, provided all points on the circle are in the harmonic domain. Explicitly, for a harmonic function \\(u(x,y)\\) (one that solves \\(\nabla^2 u = 0\\)),

\\[ u(x_0,y_0)=\frac{1}{2\pi R} \int_0^{2\pi} u(x+R\cos\theta, y+R\sin\theta)\\ d\theta\\]

This result generalizes to spheres/balls in \\(n\\) dimensions, but we'll stick to the 2D case here. Now, say we're given some domain \\(\Omega\\) with \\(u(x,y)\\) defined on its boundary, \\(\partial\Omega\\), and we're told the function is harmonic in \\(\Omega\\). Unless our domain is a perfect disc, the mean value property can't immediately tell us the value of \\(u(x,y)\\) anywhere in the domain. But we can do something a little clever.

Let's look at the problem. We're trying to find the value \\(u(x_0, y_0)\\), only knowing \\(u\\) on \\(\partial \Omega\\). We draw a circle around \\((x_0, y_0)\\):

<div class="imblock">
<img src="shape_sto1s.png" class="postim"></img>
</div>

If we knew all the values of \\(u\\) on the red circle, we could average them and easily find \\(u(x_0, y_0)\\). But we only know values of \\(u\\) on the boundary. Because we made the circle as large as we could, *part* of it is close (within some distance \\(\epsilon\\)) to the boundary, so at least we approximately know that fraction of the integral.

But for a statistically meaningful random sample over this circle, we'll need more than just that one point. Let's look at another point on the circle, \\((x_1, y_1)\\):

<div class="imblock">
<img src="shape_sto2s.png" class="postim"></img>
</div>

Again, the value at this point is equal to the average on a circle around it. The clever bit is that to find the value at \\((x_1, y_1)\\), we re-apply the mean value theorem, and randomly sample a circle at *that* point — the process becomes recursive.

<div class="imblock">
<img src="shape_sto3s.png" class="postim"></img>
</div>

So for each sample on our initial circle, we perform a random walk jumping between the surfaces of different spheres (hence the name). The loop terminates when we reach a point sufficiently close to the boundary, where \\(u(x_n, y_n)\\) is approximately equal to the value of \\(u\\) on the boundary. In pseudo-Python, the walk-on-spheres method looks like this:

<pre><code class="language-python">get_function_in_boundary(x0, y0, sample_count)
    total = 0
    for i in range(sample_count):
        (x, y) = (x0, y0)
        while True:
            R = distance from (x, y) to boundary
            if R &lt; epsilon:
                total += boundary value near (x, y)
                break
            phi = random angle
            x += R*cos(phi)
            y += R*sin(phi)
    return total / sample_count
</code></pre>

The WoS method has since been [adapted to solve other PDEs](https://arxiv.org/abs/1512.07725). For a view of the front lines of its applications, have a look at [Keenan Krane's work](https://www.cs.cmu.edu/~kmcrane/).

## The Tricky Bit

The pseudocode above is dead-simple to implement, save for one bit: computing the minimum distance from an arbitrary point \\((x, y)\\) to \\(\partial \Omega\\). The calculation of this value depends on how the boundary \\(\partial \Omega\\) is represented.

For now, I'll continue exploring the blob I've been using in this article and the previous one:

<div class="imblock">
<img src="shape.png" class="postim"></img>
</div>

This is a binary image. To calculate distances to the binary boundary in the photo, we have two choices:
1. Locate the boundary using edge detection and parameterize it (e.g. with line segments).
2. Work with the image directly.
I'll continue to avoid any sort of meshing and choose the second option. We'll keep the image as a grid of pixels, and somehow come up with an algorithm that returns the distance from each pixel to the shape's boundary.

## Distance Fields

Distances to the boundary won't change, so we can precompute them and store them in a lookup table — a lookup *image* — where each pixel holds its distance to the nearest edge. In computer graphics, this sort of image is called a *distance field*. You can calculate these for \\(n\\) pixels with brute force (\\(O(n^2)\\)), use a 'flood'-based approach and do it in \\(O(n^{1.5})\\), or use a sweet \\(O(n\log_2(n))\\) algorithm developed by [Rong and Tan in 2006](https://www.comp.nus.edu.sg/~tants/jfa/i3d06.pdf) called "Jump Flooding". You can find [good descriptions of this algorithm elsewhere](https://blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/), so I'll only give the implementation here:

<pre><code class="language-python">import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

binary_image = np.array(Image.open('shape.png').convert('1'))
distance_field = binary_image.shape[0]*np.ones(binary_image.shape)

# This array will hold the coordinates of the nearest boundary location
sample_field = np.ones((*binary_image.shape, 2))
for ix, iy in np.ndindex(binary_image.shape):
    if ~binary_image[ix][iy]:
        distance_field[ix][iy] = 0.0
        sample_field[ix][iy] = [ix, iy]

def sample(ix, iy):
    if ix &gt;= 0 and iy &gt;= 0 and ix &lt; binary_image.shape[0] and iy &lt; binary_image.shape[1]:
        return sample_field[ix][iy]
    return [0, 0]

def dist2(x0, y0, S1):
    return (S1[0]-x0)**2 + (S1[1]-y0)**2

# Find the largest power of 2 that fits in our image dimensions
N = int(2**np.floor(np.log2(np.max(binary_image.shape))))
while N &gt;= 1:
    for ix, iy in np.ndindex(binary_image.shape):
        D0 = dist2(ix, iy, sample(ix, iy))
        offsets = [[-N,0],[N,0],[0,N],[0,-N],[-N,-N],[N,-N],[-N,N],[N,N]]
        for dr in offsets:
            dx = dr[0]
            dy = dr[1]
            Di = dist2(ix, iy, sample(ix + dx, iy + dy))
            if Di &lt; D0:
                sample_field[ix][iy] = sample(ix + dx, iy + dy)
                D0 = Di
        distance_field[ix][iy] = D0
    N //= 2
distance_field = np.sqrt(distance_field)

plt.imshow(np.ma.masked_where(~binary_image, distance_field))
plt.colorbar()
plt.show()
</code></pre>

<div class="imblock">
<img src="shapesdf.png" class="postim"></img>
</div>

A fun consequence of this algorithm is that it calculates Voronoi cells for each edge pixel as a byproduct:
<pre><code class="language-python">plt.imshow(np.ma.masked_where(~binary_image, sample_field[:, :, 0]*sample_field[:, :, 1] % 19), cmap='gist_ncar')
plt.show()
</code></pre>
<div class="imblock">
<img src="shape_voronoi.png" class="postim"></img>
</div>

Pretty pictures aside, we can use our distance field to accelerate the random sampling in the WoS method. We can also exploit the fact that every point along the random walk can be viewed as the starting point of *its own* random walk. I'll pick an arbitrary boundary condition for the shape: the top half will be 1, the bottom half will be 0.

<pre><code class="language-python">total = np.zeros_like(binary_image, dtype=np.float32)
total_count = np.zeros_like(binary_image, dtype=np.float32)

epsilon = 1

# It takes my PC about a minute to run this many iterations
for i in range(0, 1000000):
    # Let's pick a random starting point inside the shape
    x0 = 0
    y0 = 0
    found_starting_point = False
    while not found_starting_point:
        x0 = np.random.randint(0, binary_image.shape[0])
        y0 = np.random.randint(0, binary_image.shape[1])
        found_starting_point = binary_image[x0, y0]
    
    x = x0
    y = y0
    # The 'steps' of the walk are just as valid as the starting point,
    # so we'll record them, too.
    xcoord_list = []
    ycoord_list = []
    R = distance_field[int(x)][int(y)]
    while R &gt; epsilon:
        phi = np.random.uniform(low=0.0, high=2.0*np.pi)
        xcoord_list.append(x)
        ycoord_list.append(y)
        x += R*np.cos(phi)
        y += R*np.sin(phi)
        R = distance_field[int(x)][int(y)]
    
    # It's not really necessary with an epsilon this small,
    # but we can get the nearest boundary point coordinates
    # from this array we generated earlier.
    boundary_coords = sample_field[int(x)][int(y)]
    boundary_value = -1.0
    if x &lt; 125.0:
        boundary_value = 1.0
    
    # Add the boundary value to every point on our path!
    for (xc, yc) in zip(xcoord_list, ycoord_list):
        total[int(xc)][int(yc)] += boundary_value
        total_count[int(xc)][int(yc)] += 1
        
solution = np.divide(total, total_count, 
                     out=np.zeros_like(total),
                     where=(total_count != 0))

plt.imshow(np.ma.masked_where(~binary_image, solution))
plt.colorbar()
plt.show()
</code></pre>

<div class="imblock">
<img src="shapesolution.png" class="postim"></img>
Each pixel in this image has roughly 300 samples.
</div>

The best thing about this method (and Monte Carlo methods in general) is that it's easily parallelizable: a modern GPU can run similar code [in real time](https://www.shadertoy.com/view/7tyyzW). It is also able to provide *localized* solutions; if, for whatever reason, you only care about the value at a specific point, you can sample it a million times and forget about the rest of the function.

## An Even Simpler Way

Actually, we don't even need the distance field. Convergence is certainly faster if we sample the surfaces of maximum-radius spheres, but the mean value property of the Laplacian applies to *any* size sphere, even very tiny ones. Even one-pixel spheres. Replacing our efficient, jumping paths with Brownian motion kills any semblance of efficiency, but this is probably the most *concise* way to solve the Laplace equation on a grid (for the code, we can just change <code>x+=R*np.cos(phi)</code> to <code>x+=np.cos(phi)</code>, and the same for <code>y</code>):

<div class="imblock">
<img src="brownian_solution.png" class="postim"></img>
Now we're up to nearly 1000 samples per pixel.
</div>

The result clearly lacks WoS's precision, even with three times the samples per pixel. But there's something very charming about the simplicity of the technique.