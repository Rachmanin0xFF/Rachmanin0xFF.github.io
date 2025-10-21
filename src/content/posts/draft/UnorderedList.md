---
title: Order, Multisets, and Language
layout: post.html
date: 2024-08-03
tags: cs
      information
      math
iconpath: UnorderedList.png
---

## Multisets & Order

Order matters.

A gigabyte of memory is useful because it has order. If we remove that order, we're left with a jumbled bucket of \\(8\times 10^9\\) indistinguishable bits, and the only information we have left is "how many ones are in the bucket". Suddenly, the information collapses from \\(8\times 10^9\\) bits into just \\(\log_2(8\times 10^9)\approx 33\\) bits.

This bag-like data structure (one with unordered, possibly repeating elements) is called a **multiset**. In the 'bucket-of-bits' example above, the multiset was formed by pulling eight billion symbols from the set \\(\\{0, 1\\}\\). Instead, if we partition our gigabyte into *bytes* (instead of bits), we pull a billion symbols from the 256-member set \\(\\{0, 1, ..., 255\\}\\). This is a more realistic use case for multisets: maybe we're storing ASCII characters. To generalize, we'll speak of a multiset with \\(k\\) members, each of which belongs to one of \\(n\\) indistinguishable types. So for 1GB partitioned into 8-bit segments, \\(n=256\\) and \\(k=10^9\\).

The number of unique multisets for some \\(n, k\\) is written \\( \left(\\!\\!{n\choose k}\\!\\!\right) \\) and is said \\(n\\) **multichoose** \\(k\\). It has a nice expression in terms of the binomial coefficient:

\\[
   \left(\\!\\!{n\choose k}\\!\\!\right) = {n + k - 1 \choose k} = \frac{n(n+1)(n+1)\cdots(n+k-1)}{k!}
\\]

From this, we can easily find the (asymptotic for large \\(n,k\\)) information content of a multiset using [Stirling's approximation](https://en.wikipedia.org/wiki/Stirling%27s_approximation) (\\(\ln(n!)=n\ln(n)-n+O(\ln n)\\)):

\\[
    \log_2\left(\\!\\!{n\choose k}\\!\\!\right)\approx\frac{1}{\ln(2)}\big[(n+k-1)\ln(n+k-1)-k\ln(k)-(n-1)\ln(n-1)\big]
\\]

\\[
    \approx (k+n)\log_2(k+n) - (k\log_2(k) + n\log_2(n)),\\ n,k \gg 1
\\]

This is a solid approximation: for our gigabyte example (\\(n=256,k=10^9\\)), it gives us ~5975.2 bits, just 0.5% over the actual value of 5947.8 bits. If we divide this expression by the ordered information, \\(k\log_2(n)\\), we can subtract that fraction from 100% and answer an interesting question: what percentage of our information is encoded in the order of our symbols? The answer, in general, is given below (recall that Stirling's approximation assumes \\(n,k \gg 1\\)):

\\[
    \\%I_\textrm{order}=100\\% - \frac{1}{k \ln(n)}\ln\left(\\!\\!{n\choose k}\\!\\!\right) \approx 100\\% - \frac{(k+n)\ln(k+n)-(k\ln(k)+n\ln(n))}{k \ln(n)}
\\]

The results of this are reasonable: in 1GB of bytes, 99.99993% of the bytes' information is encoded in the order of the 8-bit segments. Meanwhile, in a collection of a thousand 32-bit integers, that figure drops down to 27%, with 73% of the information stored in the choice of integers. Finally, for an ordered pair of 32-bit integers, their order accounts for just 1.6% of the total information contained in the pair.

## Language

There's no reason why we can't apply the formula above to the English language (or any other language). Although the actual information density of English words varies wildly, [Shannon](https://en.wikipedia.org/wiki/Claude_Shannon) put it at approximately [12 bits per word](https://archive.org/details/bstj30-1-50). The average sentence length in this article so far is 16 words, so we'll say a 'typical sentence' consists of 16 words, each of which is represented in some perfect 12-bit encoding.

Plugging in \\(n=2^{12},k=16\\), we find that only **roughly a quarter of the information in a typical English sentence is encoded in the order of its words**. This math makes a lot of assumptions and the figure is very much a ballpark. Still, it's little surprising. Long to are not always sentences scrambled interpret, especially when they are easy [*scrambled sentences are not always easy to interpret, especially when they are long*].

But we are biased: our sequential word-processing architecture isn't designed to extract meaning from jumbled text. Meanwhile, computers don't care nearly as much about word order. Natural language understanding algorithms are [(un)surprisingly invariant](https://arxiv.org/abs/2012.15180) under in-sentence word shuffling.

### Grammar

It's pretty clear that most of sentence meaning is in *word choice*: topics, adjectives, and associations with things in the real world — the small-scale lexical semantic part of language. So what's hiding in that remaining quarter pertaining to ordering?

For one, grammar! Well-formed English sentences implicitly contain information about the grammar they exist in. They *must*, actually: neither babies nor [transformers](https://arxiv.org/abs/2405.15943) are ever explicitly taught grammar, yet they both somehow naturally use and internalize the grammar (for formal grammars, check out [grammatical inference](https://en.wikipedia.org/wiki/Grammar_induction)). This is an argument for using simpler words around first-time language learners: from what we've seen, decreasing the size of the symbol set increases the percentage of information carried in word order (and thus grammar).

Consequently, if we already *know* the grammar's rules, there's really only one piece of information that gets lost when performing in-sentence shuffling: anagram ambiguity. Most sentences have multiple well-formed 'word-anagrams' (word shufflings). For example, the adjectives in a sentence can usually be permutated to apply to any combination of its nouns, e.g. "The red car and small bus" v.s. "The car and small red bus". While grammar lets us find the possible orderings of a set of words, it doesn't tell us which of those to use.

So the aforementioned fact that language models [don't really care](https://arxiv.org/abs/2104.06644) about word order is still interesting (which explains why it's still an [active area](https://aclanthology.org/2023.emnlp-main.550/) [of research](https://aclanthology.org/2022.acl-long.476/)).

In sum, order matters... except when it comes to text, sometimes. Keep this in mind when writing avant-garde poetry, I guess.

### Some More Food For Thought:
* How common are sets of words that admit no valid sentences?
* What is the average number of well-formed word-anagrams of a typical sentence?
* How close can multiset implementations get to their theoretical maximum space-efficiency?
* How much does order matter in images (investigate graining & shuffling)?