---
title: Markdown Test
layout: post.html
date: 2022-05-16
tags: nothing
      lol
---

# This is an <h1\> tag
## This is an <h2\> tag
### This is an <h3\> tag
#### This is an <h4\> tag
##### This is an <h5\> tag

Here's some body text: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

*This is italic*

**This is bold**

***This is both of those***

[this is a link](../..)

Here, have some in-context modifiers: **Lorem ipsum dolor sit amet**, consectetur *adipiscing elit*, sed do eiusmod tempor incididunt ***ut labore et dolore magna*** aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.[^1] Excepteur [sint occaecat cupidatat non proident](../..), sunt in culpa qui officia deserunt mollit anim id est laborum.

Here's some `var txt = "inline code"` in-between some other text.

```python
"""And here's some block code (in Python)"""
def branch_fib(n: int) -> int:
    if n < 0:
        raise ValueError("Cannot calculate Fibonacci number for negative inputs!")
    else if n < 2:
        return n
    else:
        return branch_fib(n-1) + branch_fib(n-2)
```

## Here's an image:

![image](fellow.png)
And this should be an image description with a [link](../..) in it. Oh, and some **bold** stuff too.

Here's an inline equation: $x_{n+1} = rx_n(1-x_n)$ (escaped with '$' signs). And here's an out-of-line equation (sorry, I mean a block equation):
$$
\oint_{d\Omega} \vec{B}\cdot d\vec{r} = \pi
$$

That's all!

[^1] This is a footnote.
