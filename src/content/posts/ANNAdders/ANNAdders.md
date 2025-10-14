---
title: Binary Universal Approximation & Neural Logic
layout: post.hbs
date: 2024-09-09
tags: math, ml, cs
iconpath: ANNAdders.png
---
### The Depth Necessary for Addition
In 2023, [Casey Primozic](https://cprimozic.net/) wrote [an awesome blog post](https://cprimozic.net/blog/reverse-engineering-a-small-neural-network/) about training a small neural network to perform modular 8-bit addition. The network's solution was interesting — you can read about it in the post; it's not unlike what a similar network [reverse-engineered by Neil Nanda and Tom Lieberum in 2022](https://www.lesswrong.com/posts/N6WM6hs7RQMKDhYjB/a-mechanistic-interpretability-analysis-of-grokking#Modular_Addition) achieved. Here, I want to focus on a hypothesis Casey stated at the beginning of his post:

>> *Additionally, I wasn't sure how the network would handle long chains of carries. When adding 11111111 + 00000001, for example, it wraps and produces an output of 00000000. In order for that to happen, the carry from the least-significant bit needs to propagate all the way through the adder to the most-significant bit. I thought that there was a good chance the network would need at least 8 layers in order to facilitate this kind of behavior.*

Obviously, Casey then showed that this was false, but it's a very reasonable way of thinking. Look at a circuit diagram of [any adder](https://en.wikipedia.org/wiki/Carry-lookahead_adder#Implementation_details), and you'll probably see a sequential chain of gates flowing from lower to higher bit significance. For \\(n\\) bits, [the best adder circuits](https://en.wikipedia.org/wiki/Kogge%E2%80%93Stone_adder) still need \\(\log_2(n)\\) layers. Additionally, the DAC/ADC-style solution Casey's network found might not scale well, and it would likely hit the floating-point precision floor as its bit count increased (this might be interesting to test). Maybe adders *do* need depth.

But wait, what about [universal approximation](https://en.wikipedia.org/wiki/Universal_approximation_theorem#Arbitrary_width)?

Actually, circuit theory also has something to say here. Neural networks have what's called "unlimited [fan-in](https://en.wikipedia.org/wiki/Fan-in)" — a neuron can have as many inputs as it likes. Couple this with a nonlinear activation function, and you'll find that, with the right parameters, individual neurons can perform AND and OR operations on an arbitrary number of incoming 'bits', as we'll see soon.

Because neurons have unlimited fan-in, feed-forward neural nets should be able to do addition with a constant number of layers, regardless of how many bits they're operating on: addition belongs to the \\(AC^0\\) circuit complexity class, which has \\(O(1)\\) depth and polynomial size. Let's see how we can construct such a network explicitly.

### Neuron Logic
First, we need to recognize that conventional neural networks can act as binary operators. A single ReLU-activated neuron can act as an AND gate:
<div class="imblock">
<img src="reluand.png" class="postim"></img>
</div>

While it takes two ReLU neurons to make an OR:
<div class="imblock">
<img src="reluor.png" class="postim"></img>
With a sigmoid activation, you can use a single neuron and saturate it by cranking up the weights.
</div>

Making a NOT gate is also easy (weight -1, bias 1). We could call it here and cite some circuit theory textbook, but let's explore a naive way to actually develop a \\(O(1)\\) (i.e. constant width) \\(n\\)-bit adder.

### "Coding" an Adder
Let's consider a 2-bit adder. We can explicitly write out the truth table for one of these:
<div class="imblock">
<img src="2bittruth.png" class="postim"></img>
</div>

There are 16 entries in this truth table, representing each pair of 2-bit numbers that could be added together. The truth table for a 16-bit adder would have \\(2^{32}\\), or 4 billion entries.

The easiest way to translate this into a constant-depth circuit? Encode each of these four billion rules into its logic. This means that our initial 16-bit circuit will have billions of transistors, but that's fine for now, we're just exploring.

First, we consider each digit of the output separately. Then, for each rule in the truth table with an output of '1', we make a circuit that activates *if and only if* each precondition in the table is met. Finally, we join the outputs of all these circuits with an unlimited fan-in OR gate. For our purposes, this is equivalent to writing the logic for each output digit in its Disjunctive Normal Form (DNF).

For example, for input binary numbers \\((a_2, a_1)\\) and \\((b_2, b_1)\\), the 10s place bit is given by:
\\[
(a_1 \land b_1) \oplus (a_2 \oplus b_2)
\\]
Which, in DNF, expands to:
\\[
(\lnot a_2 \land \lnot a_1 \land b_2) \lor(\lnot a_2 \land b_2 \land \lnot b_1) \lor \cdots \lor (a_2 \land a_1 \land b_2 \land b_1)
\\]
As a circuit, that expression looks like this:
<div class="imblock">
<img src="10splacecircuit.png" class="postim"></img>
If you're doing this with neurons, you can make things a little more compact by folding the NOTs into the AND gate's weights.
</div>

This technique generalizes to *any* arbitrary truth table. However, it's a pretty disgusting way to make a circuit. Addition is a low-entropy operation; it has exploitable symmetries that suggest more efficient constant-depth representations. For \\(n\\) bits, this one has a width (AND gate count) in \\(O(4^n)\\). You can get that down to a 3-layer \\(O(n^3)\\) if you're [clever about it](https://www.csa.iisc.ac.in/~chandan/courses/arithmetic_circuits/notes/lec4.pdf) (remember, addition is in \\(AC^0\\), which means polynomial size). That's not too bad! For a 16-bit adder, \\(O(n^3)\\) puts us on the order of \\(10^4\\) gates, which is reasonable for a neural network.

Interestingly, the fact that we can construct this kind of a network at all **demonstrates a binary universal approximation theorem**. All data on computers is stored in binary, and this shows that a shallow neural network can transform that data in any way you want.

### In the Wild
But, like all the other universal approximation theorems, it's not very helpful when you're trying to train something. If a network memorizes its inputs without 'understanding' them, we call it "overfitting". Sometimes this is okay: networks can still [grok](https://www.beren.io/2022-01-11-Grokking-Grokking/) data after overfitting it, especially in sufficiently-overparameterized networks. Maybe that initial gradient rush to the solution manifold sometimes takes us to a network similar to the DNF nets described above? Maybe DNF is a good starting point?

No, and probably not.

First, neural nets rely heavily on dense layers, where neurons are fully connected to each other. The type of network we've constructed is extremely sparse, and gradient descent is unlikely to accidentally stumble across anything like it unless it's being heavily regularized. I've been trying to coax a network into this sort of representation for a while, but without fixing the topology via weight masking, it's incredibly challenging.

Second, DNF can't really *be* abstract; it lays everything out on the table, and doesn't permit any clever representation tricks. Densely-connecting a DNF network *might* be a good starting point for understanding grokking, though (or slowly 'activating' additional weights), but probably not on anything of significant size.

### Takeaways
* Any boolean function can be represented as a constant-depth neural network by writing each output bit as an expression of the input bits in disjunctive normal form, then creating a logical (neural) circuit from that expression.
* However, these networks are sparsely-connected, and non-polynomial in width, and probably incapable of generalizing.