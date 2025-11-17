---
title: Understanding the Wronskian
layout: post.html
date: 2022-05-22
tags: math
iconpath: Wronskian.png
hidden: true
draft: true
---

*This post assumes familiarity with calculus and linear algebra.*

I recently took *MTH2201: Differential Equations and Linear Algebra* at Florida Tech. The academic demographic of the class was as follows:
* 5% physics majors (<-- including me!)
* 10% various other disciplines
* 85% engineers

Needless to say, the course was focused more on problem-solving techniques than actual *math*. I was not fully aware of this when the course began, then this happened:

Professor: So, you're good with linear independence, right? Guess what, functions can also be linearly independent.

Class: ...

Professor: Yeah, you use this thing called the Wronskian to test for linear independence. Here it is:
\\[begin{bmatrix}a & b\\c & d\end{bmatrix}\\]

## Linear Independence: A Quick Refresher

Two vectors \\(\vec{a}\\) and \\(\vec{b}\\) are Linearly independent if and only if
\\[ \vec{a} = c\vec{b}, c\in \mathbb{R} \\]
i.e. if the two vectors are multiples of each other.

\\[ c_1f_1(x) + c_2f_2(x) + ... + c_nf_n(x) = 0 \\]