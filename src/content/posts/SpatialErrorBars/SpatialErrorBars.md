---
title: Make Your Averages Better-Than-Average
layout: post.html
date: 2025-04-16
tags: math
      stats
	  cs
	  gis
iconpath: SpatialErrorBars.png
---

Take a look at these two points:

![image](twopoints.png)

Think of these points as **repeated measurements of the same thing** — whether it's the coordinates of an ice cream shop in two different datasets, the orientation of a [relativistic jet](https://en.wikipedia.org/wiki/Astrophysical_jet) as inferred from two different telescopes, or my IQ and likability score from two different online quizzes.

Quick: how would you **combine** these two measurements? The red dataset says the ice cream shop is at (0, 0), and the blue one says it's at (2, 2). We often default to a few options:

1. Average the two points
2. Use the more 'accurate' point and discard the other
3. Apply some sort of ad-hoc weighted average

These methods aren't bad! Number 2 is often a good choice. But for this data, the 'best' merge location is actually right here, in green:

![image](twopoints_merge.png)

Confused? Let's explore this.



## Background: Error Bars
Data is meaningless without some guarantee of precision. In most real-world datasets, this guarantee is implicit; hiding in the dataset's implied use case, the [number of decimal digits](https://xkcd.com/2170/), or maybe just a vague collection of industry-specific assumptions. Error bars are awesome because they let you **make that guarantee explicit**. An error bar is just a tag that says "hey, here's how closely I represent the thing I'm measuring". Having that information can save time, effort, and make matching / merging data much easier.

Unfortunately, the real-world situation is as follows (YMMV depending on your industry):

* **Most** datasets: No mention of error whatsoever.
* **Some** datasets: A global statement about some sort of ill-defined 'accuracy', 'resolution', or 'precision', or maybe per-measurement error bars, but no explanation as to what they mean. Statements like "accurate to within 10 meters" fall in here.
* **Unicorns / (good) scientists**: Per-measurement error bars with a description of what the error means, covariances, and an explanation of how the error was determined/propagated.  This category includes statements like: "random error in position is approximately Gaussian with a 95% confidence interval of ±10 meters in all directions".

Part of the problem is that tracking and manipulating error isn't always a straightforward task. Modern databases aren't exactly streamlined for error propagation, and modifying your pipelines to handle error doesn't always pitch well.

Still, if you're willing to take the plunge (or at least hear about it), keep reading.
## Merging Measurements (1-D)
I'll use a [real-world](https://x.com/adamlastowka/status/1698148223603368314) example: I just took my temperature with two thermometers. One reads 99.1°F, the other 97.7°F. The website for the first one says it's accurate to within ±0.9°F (it's a food thermometer), and the second says it's accurate to ±0.3°F. They're unlabeled, but these ranges are *probably* 95% confidence intervals, which are equivalent to [about 2 standard deviations](https://www.wolframalpha.com/input?i=InverseCDF%5BNormalDistribution%5B0%2C1%5D%2C0.975%5D). So, in sum, the situation is:

* Thermometer A: Measured 99.1°F with a standard deviation of 0.45°F
* Thermometer B: Measured 97.7°F with a standard deviation of 0.15°F

If we plot two Gaussians (bell curves, a [very reasonable assumption](https://en.wikipedia.org/wiki/Central_limit_theorem) for our measurement error) with these properties, the graph looks like [this](https://www.desmos.com/calculator/zp2xhlhka3):

![image](twogauss.png)

Visually, the way to combine these measurements seems pretty obvious: look at where they overlap (this also lets you *validate* measurements, as we'll see later)! Formally, since these are probability densities of independent measurements, we can just *multiply them together*. After normalization, that gives us this curve, which is also a Gaussian (the product of two Gaussians is also a Gaussian):

![image](twogauss_merge.png)

Which has a mean of 97.8°F and a standard deviation of 0.14°F. I'll write the formulae for the new mean ($ \mu $) and standard deviation ($ \sigma $) below (I won't bore you with the derivation):

$$ \begin{align}
\mu_\textrm{combined}&=\frac{{\sigma_1}^2\mu_2 + {\sigma_2}^2\mu_1}{{\sigma_1}^2+{\sigma_2}^2} \\\\
\sigma_\textrm{combined} &= \sqrt\frac{1}{1/{\sigma_1}^{2}+1/{\sigma_2}^{2}}
\end{align} $$

If you prefer code:
```python
def combine_measurements_1D(meas_1, stdev_1, meas_2, stdev_2):
	combined_meas = ((stdev_1**2)*meas_2 + (stdev_2**2)*meas_1)/(stdev_1**2 + stdev_2**2)
	combined_stdev = (stdev_1**-2 + stdev_2**-2)**-0.5
	return combined_meas, combined_stdev
```

A few things about this strategy:

* **It's the "right way" to merge observations**. This is plain-old statistics; there is no better way to combine independent measurements. This operation is the bread-and-butter of scientific reports.
* **It's not that complicated**. The Greek letters above might seem intimidating to non-mathematicians, but the whole process boils down to just two one-line variable assignments.
* **It's just a weighted average.** Specifically, it's weighted by the variances (standard deviation squared) of our measurements.
* **Combining measurements increased our accuracy.** In this case, the effect was minor, but merging measurements will always shrink error bars, never widen them. If you merge two datasets that both say "±10 meters", your combined data will have an error of ±7 meters.

## Merging Measurements (2-D)
Let's return to the two points from earlier:

![image](twopoints.png)

The key bit of information I left out earlier (apologies) is that these points *also* have error bars:

![image](twomultivar.png)

The ellipses around each point represent confidence intervals (20%, 40%, 60%, 80%, 95%, and 99%). Interestingly, the point in the upper right has an *asymmetry* in its error: its y-coordinate is much more accurate than its x-coordinate. I can think of a few cases where this might happen (specifically in geospatial data, since that's what I've been up to lately):

1. Oblique aerial imagery — flat features will appear 'squished' along one axis, so any error bars will do the same.
2. Linearly referenced features — you might know a pothole is *on* a road (±5 meters), but not precisely where along that road (±30 meters).
3. Lat/lon near the poles: in Norway, "5 decimal places of precision" means two times the accuracy in longitude than in latitude.


Actually, we got an easy case here: the direction of greatest/least uncertainty often *isn't even aligned* with the axes; we could've ended up with something like this:

![image](twomultivar_angle.png)

The 'full treatment' of this sort of error requires knowing not just the standard deviation in x and y, but also whether those uncertainties are correlated. Mathematically, we can accomplish this with a **covariance matrix**. This sounds scary, but it's just a list of four numbers that describe how your uncertainty is smeared out in space. Here are some examples:

![image](covariance_matrices.png)
If you're someone who likes to learn by playing, check out [this](https://www.infinitecuriosity.org/vizgp/) somewhat-tangential-but-still-really-cool interactive demo.

Again, to properly merge two measurements in 2D, we just multiply their distributions together:

![image](twomultivar_merge.png)

The math to recover the resulting (still Gaussian) blob is a little bit trickier; we'll need to know both the means $ \mu_1, \mu_2 $ and the covariance matrices of both points $ \Sigma_1, \Sigma_2 $ (capital $ \Sigma $ instead of lowercase $ \sigma $):
$$ \begin{align}
\mu_\textrm{combined} &= \Sigma_2(\Sigma_1 + \Sigma_2)^{-1}\mu_1 + \Sigma_1(\Sigma_1 + \Sigma_2)^{-1}\mu_2\\\\
\Sigma_\textrm{combined}&=\Sigma_1(\Sigma_1 + \Sigma_2)^{-1}\Sigma_2
\end{align} $$
Keep in mind that the $ \Sigma $ are matrices, the $ \mu $ are vectors, the products are matrix multiplications, and the inverses are matrix inverses. The equivalent Python (using numpy) is:
<pre><code class="language-python">import numpy as np
def combine_measurements(meas_1, cov_1, meas_2, cov_2):
	reusable_inverse = np.linalg.inv(cov_1 + cov_2)
	combined_cov = cov_1 @ reusable_inverse @ cov_2
	combined_meas = cov_2 @ reusable_inverse @ meas_1 + cov_1 @ reusable_inverse @ meas_2
	return combined_meas, combined_cov
</code></pre>

Because the 2x2 matrix inverse has a [not-terribly-large closed-form expression](https://www.mathcentre.ac.uk/resources/uploaded/sigma-matrices7-2009-1.pdf), you *could* write this all out in something without using any sort of linear algebra libraries.

By the way, here's a function to generate a covariance matrix for lat/lon coordinates ([EPSG4326](https://en.wikipedia.org/wiki/EPSG_Geodetic_Parameter_Dataset#Common_EPSG_codes)) with precision specified in meters:
<pre><code class="language-python"># Note: this only works for uncertainties much less than Earth radius
# (because the world appears 'flat' up close)
def get_cov(lat, lon, error_meters):
	# use the mean WGS84 radius
	# (it's okay if error bars are off by less than 1%)
	meters_to_deg = 57.2958 / 6.371e6
	error_deg = meters_to_deg * error_meters
	mercator_stretch = np.cos(lat / 57.2958)
	return np.array([[error_deg, 0.0], [0.0, error_deg * mercator_stretch]])
</code></pre>

## The Middle Ground
If you're an engineer reading this, you're probably thinking "yeah, no way I'm attaching a covariance matrix to every coordinate in my data". Honestly — same. That level of detail is beyond the point of diminishing returns, and most spatial error is roughly symmetric, anyway.

For easier consumption, I'll provide some concise, practical functions to **combine and validate** data from two different sources, **assuming both sources have Gaussian error bars that look the same in every direction** (isotropy).

### Merging Two Features
This is simple; we just apply the 1-D procedure to each coordinate. With Numpy's operator overloading, our code doesn't even change:
<pre><code class="language-python">def combine_measurements(meas_1: np.array, err_1: float, meas_2: np.array, err_2: float) -> np.array:
	'''
	Returns a combined measurement formed from two independent measurements of the same feature, each with isotropic Gaussian error.
	Parameters:
		- meas_1: The first measurement, in any units
		- err_1: The (Gaussian) error in the first measurement (could be standard deviation, 95% confidence, or anything else)
		- meas_2: The second measurement, in the same units
		- err_2: The error in the second measurements (interpretation must match err_1)
	'''
	combined_meas = ((err_2**2)*meas_1 + (err_1**2)*meas_2)/(err_1**2 + err_2**2)
	combined_err = (err_1**-2 + err_2**-2)**-0.5
	return combined_meas, combined_err
</code></pre>

### Validating a Match (Chi-Squared Test)
One of the most powerful features of error bars is that they let you confidently *reject* matches. If my thermometers had said (95±0.3)°F and (100±0.1)°F, I could state with extreme confidence (a one in $ 2.6\times10^{56} $ chance of being incorrect) that either they were measuring different temperatures, or someone got their error bars *very* wrong. If you have standard deviations available, here are some functions for calculating frequentist match probabilities:
<pre><code class="language-python">def get_agreement_2D(meas_1: np.array, stdev_1: float, meas_2: np.array, stdev_2: float):
	'''
	Returns a value [0, 1] indicating how well two data points 'agree' with each other.
	Specifically, returns the probability of observing a difference between measurments greater than this one, given the input error bars.
	Parameters:
		meas_1: The first measurement (a 2D vector).
		meas_2: The second measurement (a 2D vector).
		stdev_1: The symmetric standard deviation of the first measurement.
		stdev_2: The symmetric standard deviation of the second measurement.
	'''
	meas_diff = meas_2 - meas_1
	inv_variance_sum = 1.0 / (stdev_1**2 + stdev_2**2)
	D_squared = np.sum((meas_diff**2) * inv_variance_sum)
	# Chi-squared CDF with 2DOF
	p = 1.0 - np.exp(-D_squared/2.0)
	return 1.0 - p
</code></pre>
If you *do* have covariances, here's the more general form:
<pre><code class="language-python">import numpy as np
from scipy.stats import chi2
def get_agreement_ND(meas_1, cov_1, meas_2, cov_2):
	meas_diff = meas_2 - meas_1
	cov_sum = cov_1 + cov_2
	inv_cov_sum = np.linalg.inv(cov_sum)
	D_squared = meas_diff.T @ inv_cov_sum @ meas_diff
	k = len(meas_1)
	p = 1.0 - chi2.cdf(D_squared, df=k)
	return 1.0 - p
</code></pre>
Lastly, here's a 1-liner for the 1-D version:
<pre><code class="language-python">from math import erf
def get_agreement_1D(meas_1, stdev_1, meas_2, stdev_2):
	return erf((0.5 * (meas_2 - meas_1)**2 / (stdev_1**2 + stdev_2**2))**0.5)
</code></pre>
When interpreting the results from these functions, remember that an 'agreement' of 0.1 doesn't mean *no* agreement: you should expect true matches to have an 'agreement' less than or equal to 0.1 precisely 10% of the time.

One last thing worth noting — [error is not always Gaussian](https://astronomy.stackexchange.com/questions/47539/how-do-you-propagate-asymmetric-errors-on-the-practical-way-to). The real world is not always so simple, and the formulae I've provided here may fail in those cases. Still, this is better than nothing. Good luck!
## Further Reading:

* ["Introduction to Error Analysis" by John R. Taylor](https://books.tarbaweya.org/static/documents/uploads/pdf/An%20introduction%20to%20error%20analysis%20.pdf) is an excellent practical handbook.
* [REPTool](https://pubs.usgs.gov/tm/11c3/) is an ArcGIS toolkit for propagating errors through raster data.
* Here's an [awesome blog post](https://geostatisticslessons.com/lessons/errorellipses) talking about combining multivariate Gaussians.
* The multivariate Gaussian ellipse plots in this post were made with [this Python script](https://gist.github.com/Rachmanin0xFF/ba57d7b7be58335f30b54027ba2fd6c9).