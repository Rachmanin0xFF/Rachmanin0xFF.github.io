I am organizing a bachelor trip for my three friends and I. We are going to be travelling around Arizona in a rental car. What they don't know (yet) is that I have planted hidden caches across the desert in the area between Flagstaff and Phoenix and along Route 66. These caches contain short alphanumeric codes. These codes mostly serve as a physical requirement to progress in a series of puzzles that I will host on my website in this directory.

The layout works like this: the party will find a cache with a code in it. They will enter the code into a text field on this website, and it will decrypt (just XOR-ciphered) a page with text and photos that will show a puzzle. This puzzle, once solved, will point to the next clue.

The theme I'm going for is that kind of gritty analog typewriter-esque feel. All the party members will be given roles (casino manager, ex-cop, etc.) and the trip will parallel the journey of Odysseus. I want to hand-write / scan a ton of the pictures and things.

Anyway, most of this isn't relevant to the design, just wanted to write that down here for context. This is what I want out of the design:

1. The actual context lives as plain .html pages in the "az" directory. The pages contain images and text as normal (videos would also be cool, but let's consider that later), and can make authoritative formatting decisions (they do not utilize the .md / template route employed in the main site).
2. The `_build.py` script encrypts the contents of each page with a XOR cipher. Basically, the body copy stays, but the characters get XOR'd. The same thing happens to the image bytes (I think -- we might want to use a different algorithm there so that features aren't recognizable, because the edges will probably still be readable if the XOR is pixel-wise). The script also inserts a blank text box at the center of the page. When a key is dropped in this text box and an "unlock" button is pressed/touched/clicked, the page will be decoded with the key. If the key is incorrect, the original text will still get XOR'd, it'll just remain garbage because the key is gone (see the existing index.html script in here for an example of that). The original page body is placed under the centered text box (there are no overlays, everything just scrolls).
3. Page backgrounds are black; formatting is very minimal; I will be handling CSS and prettification/design later; I anticipate many hand-drawn assets / things.
4. No navbar, no header/footer, the only navigation will be hyperlinks.
5. Yes, this is all easily decryptable, and the party could just look at the github or something and get the info they want pretty easily (XOR ciphers are easy to solve). But remember that the party is playing an RPG, and there won't be any incentive for them to break "the rules" of the game. Like, there's a small barrier to the information by design, but it's more just because it makes the experience a little cooler-feeling that way.
6. Ask me about design decisions.
7. Do not try to write any text or anything for me. I will be handling all creative writing. I just want you to create the framework necessary to support this project and let me easily dump these pages in there.

have fun :-)


Alpha, Beta, Chi, Delta, Epsilon, Eta, Gamma, Iota, Kappa, Lambda, Mu, Nu, Omega, Omicron, Phi, Pi, Psi, Rho, Sigma, Tau, Theta, Upsilon, Xi, Zeta