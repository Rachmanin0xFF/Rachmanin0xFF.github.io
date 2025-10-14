---
title: Motivation for Polyharmonic Splines
layout: post.hbs
date: 2025-01-07
tags: math, cs
iconpath: polyharm.png
---

I have a 9x9 grid of numbers; I only know what three of them are.

Can we guess the other numbers in the grid given these three?

...

Okay, obviously, no, we can't. We need some additional information. Maybe that information is "this is a sudoku board", or "everything else is just 5". I'll pick a simple-sounding rule:

**Every remaining number is the average of its neighbors.**

Where "neighbors" doesn't include cells on diagonals (just the four cardinal directions). This rule is great because it's really easy to solve with a computer. We just do this:

<pre><code class="language-python">for i in range(0, iterations):
	for each cell:
		cell = average(cell_neighbors)
</code></pre>

<div class="imblock">
<img src="anim-squares1.gif" class="postim"></img>
</div>

This code converges towards a solution. That is, if you want an answer where the averaging rule is true up to some precision, I can guarantee you'll get it after a number of iterations. I won't get into *why* that's true here, but it seems reasonable given the visualization above; we're smoothing out the grid of numbers, approaching a **maximally smooth** solution.

*Note: I'm not talking about [smoothness](https://en.wikipedia.org/wiki/Smoothness) in the traditional mathematical sense, I mean something closer to "smooth to the touch". Also, we're about to get a little mathematical, so be warned: I am not a mathematician :P (we will keep it very informal)*

But what does "maximally smooth" mean? Can we define it? I'll get there, but first let's explore this algorithm a little more.
### Stencils
"Update cell (x, y) to be the average of its neighbors" really means:
$$
f_{i+1}(x, y)=\frac{1}{4}\left(f_i(x+1, y) + f_i(x-1, y) + f_i(x, y+1) + f_i(x, y-1)\right)
$$
**At stability**, we expect that \\(f_{i+1}=f_i\\), so we can drop the \\(i\\), subtract \\(f(x, y)\\) from both sides, and multiply by -4:
$$
0 = 4f(x, y) - f(x+1, y) - f(x-1, y) - f(x, y+1) - f(x, y-1)
$$
We can visualize this as a [stencil](https://en.wikipedia.org/wiki/Stencil_(numerical_analysis)) for convenience:

<div class="imblock">
<img src="stencil.png" class="postim"></img>
</div>

If you've worked with [finite difference methods](https://pythonnumericalmethods.studentorg.berkeley.edu/notebooks/chapter23.03-Finite-Difference-Method.html) before, you might recognize this as the stencil for the Laplace equation, \\(\Delta f=0\\). That's right:
$$
\textrm{"Be the average of your neighbors"} \approx (\textrm{Solve }\Delta f = 0)
$$
If you want to know *why* this is true, you can [derive it](https://mitchr.dev/2020/03/18/skewedLaplaceSquare.html) by taking a Taylor expansion at each node, but I also encourage you think through things before plugging in symbols. A few ideas to mull over when building intuition:
1. Solutions to the Laplace equation are harmonic, which means they must satisfy [mean value property](https://en.wikipedia.org/wiki/Harmonic_function#The_mean_value_property) (a continuous analog of our rule).
2. The second derivative of a 1D function answers the question "how much am I different from the average of my neighbors?" at each point.
3. For the 2D Laplace operator, bending up along one axis cancels bending down along the other.
4. The Laplace equation essentially says "no local extrema allowed!"

Anyhow, the gist is that differential operators are ssociated with (non-unique) stencils. It turns out the little algorithm above is equivalent to solving a 9x9 discretization of the Laplace equation with the [Jacobi method](https://en.wikipedia.org/wiki/Jacobi_method).

Fun detour, but are solutions to the Laplace equation "maximally smooth", somehow?

### Quantifying Bending
Instead of thinking about maximal smoothness, let's work in terms of the equivalent property, 'minimal roughness'. Let's also put on our generality hats and think in \\(d\\) dimensions.

**To determine how 'rough' (not-smooth) a function is, we'll add up its derivatives.** This is reasonable: smooth surfaces are flatter, rough surfaces have little grooves and kinks \\(\implies\\) larger derivatives. We'll use the operator \\(\nabla^m\\), which spits out a vector of all \\(m\\)th-order partial derivatives, e.g., in 2D, \\(\nabla^2 f = (f_{xx},f_{xy},f_{yx},f_{yy})\\) is just the elements of the Hessian. I'll call the quantity \\(|\nabla^m f|^2\\) the "\\(m\\)-bending" of \\(f\\). You can think of this quantity as 'local roughness' if it helps. So, in 2D, the 2-bending of \\(f\\) is:
$$
|\nabla^2 f|^2={f_{xx}}^2 + 2{f_{xy}}^2 + {f_{yy}}^2
$$
And its 1-bending is simply:
$$
|\nabla f|^2={f_{x}}^2+ {f_{y}}^2
$$
We can talk about the *total* \\(m\\)-bending on \\(f\\) by integrating this value:
$$
E[f]=\int_{\Omega \subset \mathbb{R}^d} |\nabla^m f|^2 d\mathbf{x}
$$
Here, \\(d\mathbf{x}\\) is hypervolume (a bit of our region, \\(\Omega\\)) and \\(E\\) is a functional. So if some \\(f\\) minimizes this functional (a function of a function), we can say it has the sort of 'minimal roughness' we were looking for.

### From Action to Local Laws
The [Euler-Lagrange equations](https://en.wikipedia.org/wiki/Euler%E2%80%93Lagrange_equation) let us translate broad statements about maximization into concrete differential equations. Let's try using them on our bending energy functional and see what comes out. The relevant equation for our problem looks like this (the E-L equation for a single function of multiple variables with higher-order derivatives):
$$
\frac{\partial E}{\partial f} - \sum_{i}^n (-1)^{|\alpha_i|}\partial^{\alpha_i}\frac{\partial F}{\partial(\partial^{\alpha_i}f)} = 0
$$
Because our Lagrangian doesn't care about lower-order derivatives of \\(f\\), we'll say that the multi-index \\(\alpha\\) **only indexes** \\(m\\)**th-order partial derivatives**. [Multi-index notation](https://en.wikipedia.org/wiki/Multi-index_notation) can be intimidating if you haven't encountered it before, so I'll give a concrete example of how I'm using it here. In 2D, for \\(m=2\\):
$$
\begin{align}
&|\alpha|=m=2\\\\
&\alpha_1=(2, 0),\ \alpha_2=(1, 1),\ \alpha_3=(0, 2)
\\\\
&\partial^{\alpha_1}f = \frac{\partial^2 f}{\partial x^2}\\\\&
\partial^{\alpha_2}f = \frac{\partial^2 f}{\partial x\partial y}\\\\&
\partial^{\alpha_3}f = \frac{\partial^2 f}{\partial y^2}
\end{align}
$$
Fun fact: the cardinality of \\(\alpha\\) (\\(n\\) in the summation above, \\(n=3\\) in the example immediately above) is the number of distinct \\(m\\)th order partial derivatives in \\(d\\) dimensions is a [stars and bars](https://en.wikipedia.org/wiki/Stars_and_bars_(combinatorics)) problem, and is given by:
$$
n={m+d-1 \choose d-1}
$$
We choose this multi-index because our bending-energy Lagrangian, \\(F\\), is only a function of the \\(m\\)th order partial derivatives of \\(f\\):
$$
E[f] = \int_{\Omega \subset \mathbb{R}^d}F(\partial^{\alpha_1}f,\partial^{\alpha_2}f,\ldots,\partial^{\alpha_n}f)=\int_{\Omega \subset \mathbb{R}^d} |\nabla^m f|^2 d\mathbf{x}
$$
Conveniently, this Lagrangian depends on \\(f\\)'s derivatives, and not explicitly on \\(f\\) itself. So \\(\partial F / \partial f = 0\\), and we only need to find the quantity:
$$
\begin{align}
&\sum_{i}^n(-1)^{|\alpha_i|}\partial^{\alpha_i}\frac{\partial F}{\partial (\partial^{\alpha_i}f)}\\\\=&\sum_{i}^n(-1)^m\partial^{\alpha_i}\frac{\partial |\nabla^mf|^2}{\partial (\partial^{\alpha_i}f)}\\\\=&2(-1)^m\sum_{i}^n(\partial^{\alpha_i})^2f\\\\=&2(-1)^m\nabla^{2m}f\\\\=&2(-1)^m\Delta^m f
\end{align}
$$
Plugging everything into the Euler-Lagrange equation from earlier, all that remains is:
$$
\Delta^m f = 0
$$
So our energy-minimizing \\(f\\) solves a [polyharmonic equation](https://encyclopediaofmath.org/wiki/Poly-harmonic_function). For us, this means that if a function \\(g:\mathbb{R}^2\to \mathbb{R}\\) minimizes \\({g_{x}}^2 + {g_{y}}^2\\) integrated over its surface, then \\(g\\) **solves the Laplace equation** \\(\nabla^2 g = \Delta g = 0\\).

However, this does not necessarily mean that the converse is true: **we still don't know if our averaging algorithm generates maximally-smooth grids!**

### Trouble at the Boundaries
The problem that I've danced around until now is that I never explicitly said what happens at the *borders* of the 9x9 square: I worded the rule in a way that implied only *existing* neighbors were considered in the average. I did specify a *few* boundary conditions (the three Dirichlet points on the grid), but these don't tell you anything about the edges.

Keep in mind that I could've used any other policy. Cells could have been surrounded by a border of fixed values ([Dirichlet](https://en.wikipedia.org/wiki/Dirichlet_boundary_condition) bounds), restricted to be "flat" or "sloped" at the edges ([Neumann](https://en.wikipedia.org/wiki/Neumann_boundary_condition) bounds), or any other choice from the uncountably infinite set of possible boundary conditions (BCs). Some of these boundaries will lead to very slope-y behavior, so we can say that **not all BCs will lead to minimal bending**. 

But if we want minimal bending, which BCs do we choose?

We could just *search* the space of possible BCs. Bending is computable (and, notably, a linear function of the cell values) on the 9x9 grid; throwing an optimizer at it should work. For higher-order polyharmonics with larger stencils, you can pad the boundary with additional cells.

However, if we ask about the bending on *all* of \\(\mathbb{R}^d\\), there's an easier option.

### Free Variables

Let's return to the 2D Laplace equation for an illustrative example. In our case, we're looking at weakly [harmonic](https://en.wikipedia.org/wiki/Harmonic_function) solutions with singularities at the \\(N=3\\) points we fixed, which I'll denote \\( \mathbf{x}_1, \mathbf{x}_2, \cdots, \mathbf{x}_N \\). If these are the *only* singularities we have, we expect the solution to be some linear combination of the Green's functions at these points (\\(\propto\ln(r)\\) in 2D for \\(\Delta f=0\\)) (called [radial basis functions](https://en.wikipedia.org/wiki/Radial_basis_function)) plus any harmonic function defined everywhere, \\(H(x)\\):

$$
f(\mathbf{x}) = H(\mathbf{x}) + \sum_{i=1}^N {c_i \ln(|\mathbf{x} - \mathbf{x}_i|)}
$$

Let's think about minimizing the 1-bending, \\(\int|f_x|^2 + |f_y|^2\\). First of all, we probably want \\(\sum_{i=1}^Nc_i\\) to be zero, otherwise the derivatives of our basis functions don't cancel at infinity (which is obviously bad for minimzation). By the same logic, \\(H(\mathbf{x})\\) should also be bounded as \\(r\rightarrow\infty\\), but by [Liouville's theorem](https://en.wikipedia.org/wiki/Harmonic_function#Liouville's_theorem), that means it must be constant! So \\(H(\mathbf{x})=c_0\\) is a new unknown, but the constraint \\(\sum_{i=1}^Nc_i=0\\) helps resolve it. In the end, we can throw this mess in a matrix, and find all \\(c_i\\) by solving a linear equation.

### Polyharmonic Splines
If you try what we did above with 2-bending and the biharmonic equation \\(\Delta^2 f=0\\), you'll find that the RBFs look like \\(r^2 \ln(r)\\), and that you have freedom up to linear functions. In general, \\(m\\)-bending minimization is free up to a degree \\((m-1)\\) polynomial, and the generalization of bending-minimizing functions subject to Dirichlet conditions at a finite set of points is called a "polyharmonic spline". Now we can finally say:

A **polyharmonic spline** is a finite linear combination of specific radial basis functions \\(\phi(|\mathbf{x}-\mathbf{x_i}|)\\) and a polynomial term \\(P(\mathbf{x})\\):
$$
f(\mathbf{x})=P(\mathbf{x}) + \sum_{i=1}^Nc_i\phi(|\mathbf{x}-\mathbf{x_i}|)
$$
Where \\(c_i\\) and \\(P\\) are chosen so that \\(f(\mathbf{x}_i)=y_i\\) for all \\(N\\) interpolation centers \\(\mathbf{x}_i\\) and their values \\(y_i\\), and also so that \\(f(x)\\) minimizes the \\(m\\)-bending action of \\(f\\) defined earlier.

There are already good [resources](https://people.clarkson.edu/~gyao/paper/48.pdf) [out](https://en.wikipedia.org/wiki/Polyharmonic_spline#Definition) [there](https://mathsfromnothing.au/polyharmonic-spline/) describing how to actually *compute* \\(\\{c_i\\}\\) and \\(P(x)\\), but I haven't seen many informal posts describing where  polyharmonic splines come from. Hopefully this post can help fill that gap!

But first, one last thought:
### Thin-Plate Splines (TPS)
<div class="imblock">
<img src="comparison.png" class="postim"></img>
</div>
The function on the left minimizes 2-bending and solves the biharmonic equation.
The function on the right minimizes 1-bending and solves the Laplace equation.

Which looks like a more 'natural' interpolation choice?

For most applications, the one on the left! In fact, it looks so natural that 2-bending minimizing splines have a special name: [thin plate splines](https://en.wikipedia.org/wiki/Thin_plate_spline). It gets this name because 'minimize the 2-bending' is roughly the rule that a thin sheet of metal would obey if it was being poked up and down in different places.

So, if you're ever trying to [interpolate between values scattered on a grid](https://onlinelibrary.wiley.com/doi/10.1155/2018/3950312) (like I was before I wrote this), use a [biharmonic stencil](http://rodolphe-vaillant.fr/entry/57/2d-biharmonic-stencil-aka-bilaplacian-operator), not a 5-point Laplace.
### Sources:
* [Polyharmonic Splines on Wikipedia](https://en.wikipedia.org/wiki/Polyharmonic_spline)
* [Supplementary Notes: Representation of Thin-Plate Splines](https://www.stat.berkeley.edu/~ryantibs/statlearn-s24/lectures/tps_rkhs.pdf) (from Alden Green's [spring 2024 course at Berkeley](https://www.stat.berkeley.edu/~ryantibs/statlearn-s24/), *Advanced Topics in Statistical Learning*)