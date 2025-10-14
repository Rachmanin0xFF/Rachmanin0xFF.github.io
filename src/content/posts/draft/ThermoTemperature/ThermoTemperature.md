---
title: Thermodynamics - Negative Temperatures
layout: post.hbs
date: 2023-12-29
tags: math, physics, thermodynamics
iconpath: ThermoCircle.png
---

## The Lie

*\"The temperature of a substance is proportional to the average kinetic energy of its molecules.\"*

Iterations of this phrase are widespread in early science education; its most fundamental form is probably *\"hot stuff is hot because it's jiggling around more\"*. This is a great way to explain why hot gas pushes outwards, or why hot water vaporizes.

This approximately-correct adage is fine, but I often observe the misconception that the *definition* of temperature is somehow tied to this cute proportionality. Consequently, the concept of **negative temperatures** can be extremely confusing to people not familiar to the field — negative kinetic energies don't make sense!

## Okay, Define It, Then

The temperature of a system with entropy \\(S\\) and energy \\(U\\) is:
\\[ T=\left( \frac{\partial S}{\partial U} \right)^{-1} \\]
That is, the reciporical of the rate of change of the system's entropy with respect to its energy.

## What

That might be a lot to parse. Here's another way to state the equation (for positive temperatures):
* **Low temperature** is when you add a little energy to your system and its entropy increases a **lot**.
* **High temperature** is when you add a little energy to your system and its entropy increases a **little**.

In case you don't know, entropy is, loosely, "the number of states a system's parts could be in given some of their net properties" (multiplicity, \\(\Omega\\)). Actually, it's a constant times the logarithm of that (\\(S = k \ln{(\Omega)})\\) — more on why this is the case later.

## A Monoatomic Example

We can think about number of possible arrangements of a system, \\(\Omega\\), as a function of energy, \\(\Omega=\Omega(U)\\). For example, if we know the kinetic energy of a single atom, then we know its velocity \\(\vec{v}\\) must rest on some **spherical surface in the space of velocities**. This is because knowing kinetic energy \\( E=\frac{1}{2} m |\vec{v}|^2\\) fixes the length of \\(\vec{v}\\), but not its direction. Specifically,
\\[ \Omega_\textrm{atom} \propto |\vec{v}|^2 \propto E_\textrm{atom}\\]
Because the surface area of a sphere is proportional to \\(r^2\\), energy is proportional to \\(|\vec{v}|^2\\), and here, \\(r \propto v\\).

So there is a linear relationship between an atom's energy and the number of velocities it can 'choose from'. We can plot this:

<div class="imblock">
<img src="graph1.png" class="postim"></img>
It's not like there are really a "number" of possible velocities; the y-axis is more representative of the size of the continuous state space. Though in quantum systems, it really is finite.
</div>

## Why Log-Multiplicity?

## Stuff

The actual definition of temperature is predicated on this (true) fact:

* If two things are in contact and no heat is flowing between them, they are the same temperature.

That is, the temperatures of two systems are equal in thermal equilibrium. So, to describe temperature, we're going to investigate the combination of two different systems, but eventually we will go back to just one.

Daniel Schroder's undergraduate textbook *An Introduction to Thermal Physics* has an excellent explanation of what I'm about to describe in chapter 3, so I'll try to avoid rehashing his explanation.