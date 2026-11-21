# Patent landscape: single-piece 3D-printed, breath-powered multi-pipe "techno flute" (orientation only, not legal advice)

Method note: research done 2026-11-21 through web search only. Direct page fetches of patents.google.com, image-ppubs.uspto.gov and patents.justia.com were blocked in this session's network, so every patent below is confirmed to exist only by appearing (number + title) in search results that link to the official record. Dates, assignees and legal status are given only where a search result stated them; otherwise they are marked "not verified". Claim scope was NOT read for any patent. Anyone relying on this should open each URL and check the bibliographic data, claims and status (Google Patents "Legal events", USPTO Patent Center, Espacenet INPADOC).

Overall picture: the individual building blocks are old and well documented in patents, mostly long expired: multi-chamber whistles detuned on purpose to beat (US5251569, US5816186, US7581509, EP1249015), a whistle that alternates breath between two sound generators automatically (US2777251), a fluidic-oscillator tone generator for a musical instrument (US3715949), multi-chamber ocarinas and flutes (US4893541, US6914179), and detuned-reed tremolo/musette (accordion and harmonica patents). The only computational-design patent found that is close to the concept is US11798521, "Computation design of acoustic resonators" (priority July 2016). It is probably related to Autodesk's Printone research, but its assignee is not verified. No patent was found that combines all the elements: a single printed part with detuned pipes beating at a musical tempo, plus a drone, a finger-hole lead pipe, a noise chamber, and optimisation of the geometry against target sounds.

## 1. Multi-pipe / multi-chamber whistles, flutes, ocarinas and toy wind instruments

### Takeaway
There is dense, mostly expired prior art on whistles and toy instruments with several chambers or pipes fed from one mouthpiece. It includes chambers detuned on purpose to produce beating, and multi-chamber ocarinas that play harmony or a drone-like second voice.

### Cited Findings
- **US2777251A, "Self-oscillating double tone whistle"**: a fluid-operated device with two sound generators and a fluid control valve that *alternately directs the air between them*, producing two tones that alternate at a fixed rate. It is the closest old art to "breath alternated between pipes to create rhythm". Grant date, inventor and assignee were not verified; the caller's brief and one search snippet name the inventor as Bailey, and the date as about 1957, which is unconfirmed. Almost certainly expired because of its age. — [Google Patents](https://patents.google.com/patent/US2777251); description summarised in [search result](https://patents.google.com/patent/US2777251)
- **US5251569A, "Multiple tone whistle"**: two chambers tuned to set the *beat* frequency, with knockouts that adjust the pitch and slightly different chamber widths. It reproduces the beat of a pea whistle with two pealess chambers. Date and assignee not verified. Relevance: detuned parallel chambers used on purpose to beat. — [Google Patents](https://patents.google.com/patent/US5251569A/en)
- **US5816186A, "Whistle"**: two chambers whose splitter-edge resonances differ, so that they beat. Date and assignee not verified. Relevance: beating from detuned chambers. — [Google Patents](https://patents.google.com/patent/US5816186A/en)
- **US7581509B2, "Hybrid whistle"** (issued Sept 1, 2009 per Justia): a central pea chamber plus left and right pealess chambers that are deliberately "out of pitch with one another" to create a beating effect like the staccato of a pea whistle. Relevance: detuned-chamber beating used as a rhythmic, pulsing effect. — [Google Patents](https://patents.google.com/patent/US7581509B2/en); [Justia](https://patents.justia.com/patent/7581509)
- **US6837177**: a search snippet of later prior-art discussion describes it as using chambers at 3.4 and 3.7 kHz, giving a beat of about 300 Hz. The title was not verified. — cited within [US7581509B2 record](https://patents.google.com/patent/US7581509B2/en)
- **EP1249015B1 / EP1249015A1 / WO2001052235A1 / CN1418359A, "Whistle with several chambers"**: two pealess chambers tuned to dissonant frequencies, sounded together. Dates, assignee and status not verified. — [EP1249015B1](https://patents.google.com/patent/EP1249015B1/en); [WO2001052235A1](https://patents.google.com/patent/WO2001052235A1/en); [CN1418359A](https://patents.google.com/patent/CN1418359A/en)
- **US8006634B2, "Whistle"**: resonant waves are generated in both a first and a second resonance chamber. — [Google Patents](https://patents.google.com/patent/US8006634B2/en)
- **US5113784A, "Multi-tone whistle"**: a molded plastic whistle with several resonant cavities; the player chooses which tones sound, singly or several at once. Relevance: a single molded body with several selectable voices. — [Google Patents](https://patents.google.com/patent/US5113784)
- **US2454105A, "Multitone whistle"** — [Google Patents](https://patents.google.com/patent/US2454105); **US2823570A, "Musical whistle"** — [Google Patents](https://patents.google.com/patent/US2823570); **US1383878A, "Toy whistle"**: several sounding tubes of different lengths fed by one mouthpiece — [Google Patents](https://patents.google.com/patent/US1383878); **US1039814A, "Toy whistle"** — [Google Patents](https://patents.google.com/patent/US1039814A/en); **US1852934A, "Toy whistle"** — [Google Patents](https://patents.google.com/patent/US1852934A/en). All are old and presumed expired.
- **US2754714A, "Pipe harmonica"** (1956 per search snippet): a reedless, valveless instrument with pairs of resonator pipes behind a row of mouth openings. — [Google Patents](https://patents.google.com/patent/US2754714A/en)
- **CN101169932A, "Simple blowing pipe organ"**: a toy organ with harmonica-style blow holes feeding reed and whistle pipes. — [Google Patents](https://patents.google.com/patent/CN101169932A/en)
- **US4893541A, "Pentatonic ocarina"**: two enclosed chambers and two windways, so one player can sound two harmonising tones, i.e. a two-voice, single-body instrument. — [Google Patents](https://patents.google.com/patent/US4893541A/en)
- **US6914179B2 / US20040003702A1 / WO2003091986A1, "Flutes with multiple chambers that share compound bisected toneholes"**: multi-chamber flutes and ocarinas with shared toneholes. Relevance: several resonators in one body with a shared fingering system. — [US6914179B2](https://patents.google.com/patent/US6914179B2/en); [US20040003702A1](https://patents.google.com/patent/US20040003702); [WO2003091986A1](https://patents.google.com/patent/WO2003091986A1/en)
- **US7816595B1, "Methods of constructing and tuning ocarinas"**: two-chamber designs played independently or together. — [Google Patents](https://patents.google.com/patent/US7816595B1/en); **US7799980B1, "Ocarina"**: notes two sound chambers in one ocarina — [Google Patents](https://patents.google.com/patent/US7799980B1/en); **US20040244562A1, "Ocarinas with chamber extensions…"** — [Google Patents](https://patents.google.com/patent/US20040244562)
- **US3685388A, "Flute"** (1972 per snippet): a turbulation means in the head joint makes the airstream turbulent for a breathier, richer timbre. Relevance: deliberate air turbulence and noise, loosely analogous to a hiss chamber. — [Google Patents](https://patents.google.com/patent/US3685388A/en)
- **JP2000029458A, "Wind instrument with resonance cylinder"**: a sealed resonance cylinder inside the bore. — [Google Patents](https://patents.google.com/patent/JP2000029458A/en)
- **DE102012020559A1**: a bass block flute with a U-shaped resonance chamber inside the sound pipe. — [Google Patents](https://patents.google.com/patent/DE102012020559A1/en)
- **US20110197737A1 / EP2360676A1, "Pipe structure of wind instrument"**: auxiliary pipes and sound holes for pitch adjustment. — [US20110197737A1](https://patents.google.com/patent/US20110197737); [EP2360676A1](https://patents.google.com/patent/EP2360676A1)

### Inferences
- "Several fipple/duct voices in one body, fed by one breath, deliberately detuned so they beat" is squarely anticipated by sports-whistle patents (US5251569, US5816186, US7581509). The difference is the beat rate: whistle beats run at roughly 100 to 300 Hz (a rough, buzzy tone), whereas the concept wants a sub-audio, tempo-rate beat of about 1 to 10 Hz. That parameter choice alone is likely obvious over this art plus the tremolo art in section 4.
- A drone voice plus a fingered melody voice in one body is anticipated in concept by double and multi-chamber ocarinas and flutes (US4893541, US6914179), and by traditional double flutes and bagpipes, which are not patent literature.

### Gaps
- No patent was found that claims a dedicated *noise/hiss chamber* as a sound voice in a wind instrument; only turbulence-for-timbre (US3685388A). A targeted CPC search (G10D7/00, G10K5/00) would be needed.
- Legal status and expiry were not verified for the post-1990 whistle patents. US5251569, US5816186 and US7581509 should be expired by now if their maintenance was normal, but this was not checked.

## 2. Fluidic / fluid-amplifier tone generators and fluidic oscillators producing audible pulses

### Takeaway
A fluidic oscillator used as a musical tone generator is patented old art (Nippon Gakki/Yamaha, US3715949A, 1973), and the no-moving-parts jet-switching oscillator dates back to about 1960 (US3016066A). The most recent close filing is Perlemax's acoustically switched fluidic oscillator with a resonance chamber on each outlet (US12370506B2, granted 2025), an industrial patent and not a musical one.

### Cited Findings
- **US3715949A, "Musical instrument using a fluid powered tone generator for generating sonic energy"**: assignee Nippon Gakki (now Yamaha); filed 1972, granted 1973 (per search summary). The tone generator is a fluidic oscillator plus frequency-setting means plus a resonator; fluid passageways of different inner capacity are connected in parallel to produce a scale. Expired. Relevance: the direct ancestor of "fluidic oscillator inside a musical instrument". — [Google Patents](https://patents.google.com/patent/US3715949)
- **US3016066A, "Fluid oscillator"**: a jet of air oscillates back and forth between two passages with no moving parts. It is a timing device, not a sound source. Expired. Relevance: the basic jet-switching mechanism for alternating breath between pipes. — [Google Patents](https://patents.google.com/patent/US3016066A/en)
- **US2777251A** (see section 1): a valve alternately directs the air between two whistles, i.e. mechanical rather than fluidic alternation, but the same musical result. — [Google Patents](https://patents.google.com/patent/US2777251)
- **US20220168697A1, matured into US12370506B2, "Fluidic oscilators"** [sic]: assignee Perlemax Ltd; inventors W. B. J. Zimmerman and P. D. Desai; US application 17/601,872; granted July 29, 2025 (per search summary of Google Patents and Justia). Each outlet conduit has a resonance chamber, and the device operates in an "acoustic switching mode". Likely in force. Relevance: the closest *recent* patent to "a fluidic oscillator switching flow between resonators". Its field is industrial (microbubble/gas delivery), but its claims should be checked for breadth before practising an acoustically switched oscillator. — [US20220168697A1](https://patents.google.com/patent/US20220168697A1/en); [US12370506B2](https://patents.google.com/patent/US12370506)
- **US6253782B1 / EP1121201B1, "Feedback-free fluidic oscillator and method"** — [US6253782B1](https://patents.google.com/patent/US6253782B1/en); [EP1121201B1](https://patents.google.com/patent/EP1121201B1/en)
- **USRE33158E, "Fluidic oscillator with resonant inertance and dynamic compliance circuit"** — [Google Patents](https://patents.google.com/patent/USRE33158)
- **US7128082B1, "Method and system for flow control with fluidic oscillators"** — [Google Patents](https://patents.google.com/patent/US7128082B1/en)
- **US9802209, "Fluidic oscillator having decoupled frequency and amplitude control"**; **US9789496, "Fluidic oscillator array for synchronized oscillating jet generation"**; **US5362987, "Fluidic generator"**: non-musical fluidic oscillators found in search; no musical use confirmed. — [US9802209](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9802209); [US9789496](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9789496); [US5362987](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/5362987)

### Inferences
- An oscillator that switches breath between pipes at a *tempo* rate (about 1 to 8 Hz) is much slower than typical fluidic oscillators, which run at tens of Hz to kHz. Getting a breath-powered fluidic oscillator to switch that slowly, perhaps with large feedback volumes or capacitance, could be a technically distinctive feature. Novelty would depend on how it is claimed, and US3715949, US2777251 and US3016066 would all be cited against it.
- Bowles-type and Coanda feedback oscillators date from the 1960s, so the general design space is free to use. Freedom-to-operate risk sits mainly with recent, specific filings such as Perlemax.

### Gaps
- No musical-instrument fluidic patent dated after 1973 was found; the search found none, but that is not proof that none exist.
- The status and claim scope of the Perlemax patent were not read.

## 3. 3D-printed instruments and computational design of instrument or resonator geometry

### Takeaway
The academic literature is rich: Autodesk/Umetani's "Printone" (2016), the Columbia/Disney/MIT "Acoustic Voxels" (2016), and the Disney/Harvard/Columbia "Metallophone" (2015). Only one closely matching US patent was found, US11798521 "Computation design of acoustic resonators" (provisional July 20, 2016). No Disney, Columbia or Adobe patent on these works was located.

### Cited Findings
- **US11798521 (B2), "Computation design of acoustic resonators"**: claims priority to provisional 62/364,698, filed July 20, 2016. Its background says that free-form resonant cavities for wind instruments are hard to design, because conventional methods need iterative simulations across many frequencies. Assignee and inventors are **not verified**. The timing and subject (free-form wind-instrument cavities) match the Autodesk Printone paper, but that link is my inference. Likely in force if maintenance fees are paid; issued about 2023, not verified. Relevance: the **highest-risk FTO item** for "computationally optimising a free-form printed flute toward target frequencies"; read its claims first. — [USPTO PDF](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11798521)
- Printone (Umetani, Panotopoulou, Schmidt, Whiting; Autodesk Research; ACM TOG 35(6), 2016): an interactive design tool for 3D-printable free-form wind instruments with finger holes and a fipple, where resonance simulation guides the geometry toward target frequencies. It is non-patent prior art for the method. — [Autodesk Research](https://www.research.autodesk.com/publications/printone-interactive-resonance-simulation-for-free-form-print-wind-instrument-design/); [paper PDF](https://www.cs.dartmouth.edu/~athina/papers/a184-umetani.pdf)
- Acoustic Voxels (Li et al., Columbia/Disney Research/MIT, SIGGRAPH 2016): optimises modular hollow-cube filters toward target filtering, with wind-instrument prototyping listed as one application. No patent was found. — [Disney Research](https://la.disneyresearch.com/publication/acoustic-voxels/); [ACM](https://dl.acm.org/doi/10.1145/2897824.2925960)
- Computational Design of Metallophone Contact Sounds (Bharaj et al., Disney/Harvard/Columbia, ACM TOG 2015): optimises shape to match target frequency and amplitude spectra. No patent was found. — [ACM](https://dl.acm.org/doi/10.1145/2816795.2818108)
- **US11498282B1, "Computationally optimized and manufactured acoustic metamaterials"**: tunes resonator mass, stiffness, size and placement to target acoustic properties, with printed porous fill. Assignee and date not verified. Relevance: computational optimisation plus manufacture of resonators, aimed at noise control and not music. — [Google Patents](https://patents.google.com/patent/US11498282B1/en)
- **US20100010786A1, "Sound synthesis method and software system for shape-changing geometric models"**: computes estimated resonant frequencies as a user edits an instrument's 3D geometry. — [Google Patents](https://patents.google.com/patent/US20100010786)
- **CN109346033A, "A kind of novel 3D printing bone flute and preparation method thereof"**: a 3D-printed flute and its manufacturing method (CPC B29C64/B33Y). Status not verified. — [Google Patents](https://patents.google.com/patent/CN109346033A/en)
- Non-patent 3D-printed flute art: a titanium EBM flute (Kolomiets et al., 2020) — [Ariel University](https://cris.ariel.ac.il/en/publications/the-titanium-3d-printed-flute-new-prospects-of-additive-manufactu/); microtonal 3D-printed flutes (Narushima) — [SPIE](https://spie.org/news/6082-3d-printing-for-custom-design-and-manufacture-of-microtonal-flutes?ArticleID=x115347&highlight=x2422&SSO=1); FlueBricks, a construction kit of flute-like instruments (arXiv 2604.03636, 2026) — [arXiv](https://arxiv.org/pdf/2604.03636)

### Inferences
- Printone (published 2016) is prior art against any later-filed claim to the general method of "simulating resonances of a free-form wind instrument and adjusting it toward target frequencies". US11798521 has an earlier effective date and may limit freedom to operate if its claims are broad. Optimising against *target sounds*, meaning spectra, beat rate or timbre rather than resonant frequencies alone, may be distinguishable, but this must be checked against its claims.
- Universities and Disney appear to have published rather than patented in this niche, which is good for freedom to operate and bad for the novelty of the general method.

### Gaps
- The assignee, inventors, issue date and claims of US11798521 could not be retrieved because the fetch was blocked. This is the single most important item to verify.
- No Adobe or Columbia patent on computational musical-instrument design was found.

## 4. Detuning-based beating / tremolo (harmonica, accordion musette)

### Takeaway
Producing an amplitude-pulsing tremolo by detuning two sound sources slightly is 19th-century technique. It is described in many accordion and harmonica patents, including in their background sections, so it is strong evidence that "detuned voices produce a beat" is old.

### Cited Findings
- **EP1258861B1, "Method for reproducing the sound of an accordion electronically"**: describes musette tuning as reeds of the same footage given slight tuning differences that cause beats, producing a tremolo. — [Google Patents](https://patents.google.com/patent/EP1258861B1/en)
- **US2051621A, "Reed block for accordions"**: reeds tuned "just slightly off pitch" so that they produce a particular timbre when sounding together. — [Google Patents](https://patents.google.com/patent/US2051621)
- **US5824927A, "Keyed free-reed instruments scope"**: extra reeds in separate passageways that, when properly tuned, beat against the original reed ("musette" or "wet" tuning). — [Google Patents](https://patents.google.com/patent/US5824927)
- **US7265286, "Harmonica"**: its background describes the conventional tremolo harmonica as two reeds per cell, one tuned slightly higher than the other. — [USPTO PDF](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7265286)
- Mechanical tremolo, a different mechanism: **US2016122A** and **US2457886A, "Tremolo device for accordions"** — [US2016122A](https://patents.google.com/patent/US2016122); [US2457886A](https://patents.google.com/patent/US2457886); **US59354A** (Burdett, 1866), a tremolo valve for reed instruments — [Google Patents](https://patents.google.com/patent/US59354A/en); **US2000408A, "Chromatic harmonica with tone controls"** — [Google Patents](https://patents.google.com/patent/US2000408A/en); **US2535813A, "Means for tuning accordions"** — [Google Patents](https://patents.google.com/patent/US2535813)
- General principle: tremolo harmonicas use two reeds per note, slightly detuned, and the volume oscillates at constant pitch. The detuning amount varies by tradition. — [Wikipedia](https://en.wikipedia.org/wiki/Tremolo_harmonica); [Hohner forum](https://my.hohner.de/t/tremolo-harmonica-tuning-delta/4736)

### Inferences
- Choosing the detuning so that the beat rate equals a musical tempo (for example 2 Hz = 120 BPM) is a design choice that an examiner would likely find obvious over musette and tremolo art combined with the multi-chamber whistle patents. Any patentable contribution would probably have to lie in *how* the tempo is set or kept stable in a breath-driven, single-printed part, for example by geometry that keeps the beat rate stable as blowing pressure changes, or by optimisation for that.

### Gaps
- No patent was found that specifically claims beating at a *tempo-locked* rate in a flue (non-reed) instrument.

## 5. Recent filings (2015–2026) close to the concept

### Takeaway
Few recent filings are close. The two that matter are US11798521 (computational design of free-form resonators, priority 2016) and US12370506B2 (Perlemax acoustically switched fluidic oscillator, granted 2025). No 2015–2026 patent combining multi-pipe beating, drone, lead and noise voices in one printed flute was found.

### Cited Findings
- US11798521, "Computation design of acoustic resonators" (priority July 2016). — [USPTO PDF](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11798521)
- US20220168697A1 → US12370506B2, "Fluidic oscilators", Perlemax Ltd, granted July 29, 2025. — [Google Patents](https://patents.google.com/patent/US12370506)
- US11498282B1, "Computationally optimized and manufactured acoustic metamaterials" (date not verified). — [Google Patents](https://patents.google.com/patent/US11498282B1/en)
- CN109346033A, a 3D-printed bone flute (about 2019, not verified). — [Google Patents](https://patents.google.com/patent/CN109346033A/en)
- A targeted search for 2018–2022 toy multi-pipe whistle patents returned only older art. — [search hits e.g. US5113784A](https://patents.google.com/patent/US5113784)

### Inferences
- The combination (one printed part plus tempo-rate detuned beating plus drone plus fingered lead plus noise chamber plus optimisation against target sound, and optionally a slow fluidic switch) appears unclaimed in what was found. Each element has strong prior art, however, so any claim would face obviousness challenges. The strongest angles are probably specific geometric or fluidic arrangements, or a specific optimisation objective (for example beat-rate stability across blowing pressure).
- The main freedom-to-operate items to clear are US11798521, for the computational design method, and US12370506B2, if an acoustically switched fluidic oscillator is used. Most of the physical-instrument prior art is pre-2006 and presumed expired.

### Gaps
- Searches of Espacenet, WIPO Patentscope and CNIPA were not done; Chinese utility models on toy multi-tube flutes are numerous and probably under-represented here.
- Recently published applications (2024–2026) may not appear in web search indexes. A CPC-based search (G10D7/00, G10D9/00, G10K5/00, B33Y80/00, G06F30/ with "musical instrument") is recommended.
- Every legal status listed above is unverified unless stated.
