# Computational / Inverse Design and Shape Optimization of 3D-Printed Wind Instruments (state as of Nov 2026)

> Method note: arxiv.org and didgitaldoo.github.io could not be fetched from this session (network allowlist), so every claim about arXiv preprints (TubeLab, AcoustiPrint, the alphorn paper, the logical clarinet) and about the Didgitaldoo blog comes from search-engine abstracts/snippets, not a full-text read. Author lists, exact numbers and results of the 2026 arXiv preprints are not verified. Treat them as "reported in abstract".

## 1. Academic work on designing wind-instrument geometry from a target sound

### Takeaway
There are two lineages. (a) 1D bore/tone-hole optimization from musical acoustics (transfer-matrix / 1D FEM, gradient or least squares) is mature for tubes: clarinet, brass, recorder, didgeridoo, alphorn. Its newest step is TubeLab (arXiv, ~Sept 2026), an interactive browser tool that uses adjoint gradients. (b) Graphics/fabrication work allows free-form 3D shapes: Printone 2016, Acoustic Voxels 2016, and an MIT 2019 3D-FDTD + deep-learning thesis. Lineage (b) has seen little visible follow-up for wind instruments since 2019. I found no published system that does inverse design of a single-piece printed body with several coupled internal pipes or chambers aimed at a target sound.

### Cited Findings
**Free-form / graphics lineage (older, 2016–2019)**
- Printone (Umetani, Panotopoulou, Schmidt, Whiting; ACM TOG / SIGGRAPH Asia 2016, older): interactive resonance simulation for free-form "print-wind" instruments. It treats the instrument as a passive resonator (no coupled excitation from the mouthpiece) and uses BEM plus eigenvalue-based resonance prediction. The user supplies a 3D shape; the tool hollows out a cavity; the user picks the fipple/blowing area and places finger holes. An "AutoTune" feature sizes holes for target notes, and scaling the shape shifts the range. The team built 16 instruments (e.g., a star that plays "Twinkle Twinkle", a snowman that plays "Jingle Bells"), printed on consumer printers, hobby-grade. — [Dartmouth news](https://home.dartmouth.edu/news/2016/12/new-printone-tool-allows-users-create-3-d-printed-wind-instruments-any-shape-or-form); [paper PDF](https://www.cs.dartmouth.edu/~athina/papers/a184-umetani.pdf); [Autodesk Research](https://research.autodesk.com/publications/printone-interactive-resonance-simulation-for-free-form-print-wind-instrument-design); [SIGGRAPH archive](https://history.siggraph.org/?p=210588)
- Printone's user inputs a shape and target frequencies, and the tool searches finger-hole open/close patterns that produce those pitches. The target is pitch only. — [paper PDF](https://www.cs.dartmouth.edu/~athina/papers/a184-umetani.pdf)
- Acoustic Voxels (Li, Levin, Matusik, Zheng; ACM TOG 35(4), SIGGRAPH 2016, older): parameterized shape primitives with precomputed transmission matrices. The tool simulates the transmission matrix of the assembled structure and optimizes the arrangement and parameters of the primitives. Stated applications: mufflers, prototyping musical wind instruments, encoding acoustic tags in objects. — [project page](https://www.cs.columbia.edu/cg/lego); [Disney Research](https://studios.disneyresearch.com/2016/07/11/acoustic-voxels-computational-optimization-of-modular-acoustic-filters/); [MIT CDFG](https://cdfg.csail.mit.edu/publications/acoustic-voxels-computational-optimization-modular-acoustic-filters)
- Acoustic Voxels poster: optimizes impedance curves toward desired peaks for lip-reed instruments, validated against industrial lab measurements and offline FEM. — [poster PDF](https://www.cs.columbia.edu/cg/lego/acoustic-voxels-siggraph-2016-poster-li-et-al.pdf)
- Larry Z. Wang, "Algorithmic design of wind instrument shape via 3D FDTD and deep learning", MIT M.Eng. thesis (EECS, 2019, advisor Justin Solomon; older). It builds a GPU-accelerated 3D acoustic wind-instrument simulator and uses deep learning for the inverse problem: a 3D shape that "roughly approximates a desired sound" when played as a single-reed instrument. Motivation: traditional design is limited to tubes and cones. — [DSpace@MIT](https://dspace.mit.edu/handle/1721.1/123116); [UiTM mirror record](https://openaccess.library.uitm.edu.my/Record/ndltd-MIT-oai-dspace.mit.edu-1721.1-123116)
- Related older inverse-shape work for struck instruments: 3D-printed and water-jet-cut metallophone keys optimized for target frequencies and amplitudes with a stochastic global optimizer ("Latin Complement Sampling"). — [Columbia PDF](https://www.cs.columbia.edu/~cxz/publications/metallophone.pdf); [Harvard SEAS news 2015](https://www.seas.harvard.edu/news/2015/11/change-shape-change-sound)
- Amit Zoran, "The 3D printed flute" (JNMR 2012, older): a printed concert flute that demonstrates fabrication, not new acoustic design. — [MIT Media Lab](https://www.media.mit.edu/publications/the-3d-printed-flute-digital-fabrication-and-design-of-musical-instruments/); [PDF](https://resenv.media.mit.edu/pubs/papers/2012-JNMR-ZORAN-3DFLUTE.pdf)

**Musical-acoustics bore/tone-hole lineage**
- "The logical clarinet: numerical optimization of the geometry of woodwind instruments" (Noreland, Kergomard et al., Acta Acustica united with Acustica 2013, older). Models the instrument as a network of 1D transmission-line elements and uses least squares to minimize deviation from an even chromatic scale. Optimized chimney positions, diameters and lengths vary smoothly along the instrument. A register hole keeps deviations within about 10 cents across the usual range. A chromatic prototype tested with an artificial blowing machine agreed well with predictions. The authors note that balanced timbre across the range is harder than pitch. — [arXiv 1209.3637](https://arxiv.org/pdf/1209.3637); [HAL](https://hal.archives-ouvertes.fr/hal-00683477)
- Brass bore optimization with surrogates (Tournemenne et al., J. Mech. Design 2017, older): physics-based sound simulation plus surrogate-assisted derivative-free optimization (MADS) on trumpet intonation. — [HAL 01504179](https://hal-univ-lemans.archives-ouvertes.fr/hal-01504179); [ScienceGate/ASME 10.1115/1.4035503](https://www.sciencegate.app/document/10.1115/1.4035503)
- Follow-up "Sound simulation-based design optimization of brass wind instruments" (JASA 2019, older): adds objectives and constraints on the spectrum (spectral centroid) on top of intonation, averaged over embouchure parameters. It compares a surrogate ensemble with LOWESS and notes limits in predicting realistic spectral-centroid values. — [HAL 01963668](https://hal.archives-ouvertes.fr/hal-01963668); [Bohrium summary](https://www.bohrium.com/paper-details/sound-simulation-based-design-optimization-of-brass-wind-instruments/812757635282501632-582)
- "Optimal control theory: a method for the design of wind instruments" (arXiv 1001.3217, 2010, older). — [arXiv](https://arxiv.org/pdf/1001.3217)
- Ernoult, Chabassier, Rodriguez, Humeau (Acta Acustica 2021): full-waveform inversion for bore reconstruction. The gradient is obtained by solving the direct system with a different source term. Works for woodwind-like instruments with side holes, takes about 1 min on a laptop, and agrees "excellently" with direct geometric measurement. — [Acta Acustica 10.1051/aacus/2021038](https://acta-acustica.edpsciences.org/articles/aacus/epub2/2021/01/aacus210048/aacus210048.epub)
- Dabin, Ritz et al., "3D Modelling and Printing of Microtonal Flutes" (NIME 2016, older): customized recorders and transverse flutes in microtonal scales, with interchangeable mouthpieces and acoustic-impedance modelling before printing. Long-term aim: the user specifies a tuning and gets a printed instrument on demand. — [NIME proceedings](https://nime.org/proc/nime2016_dabin/); [SPIE newsroom](https://amp.spie.org/news/6082-3d-printing-for-custom-design-and-manufacture-of-microtonal-flutes); [UOW repository](https://ro.uow.edu.au/lhapapers/2798)
- Ocarina CFD (Kobayashi et al., arXiv 0911.3567, 2009, older): 3D compressible LES of an ocarina, modelled as an edge-tone coupled to a Helmholtz resonator. Analysis only, no design. — [arXiv](https://arxiv.org/pdf/0911.3567)

**2025–2026 work**
- TubeLab: "Interactive inverse design of wind instrument bores with hard spectral constraints" (arXiv 2609.22468, ~Sept 2026). A browser-based acoustic simulator and inverse bore-design tool for instruments without tone holes. Forward model: TMM. Inverse step: Tikhonov-regularized least squares, with the Jacobian computed by one adjoint backward pass (one forward pass with state caching plus one co-state pass per mode). Hard equality frequency constraints are enforced to first order with a saddle-point formulation in profile-radius space. It offers seven solutions along a log-spaced sweep of the constraint weight instead of a single automated answer. Validated against sound-response measurements on a set of didgeridoos built in a controlled way. Geometry uncertainty, including differences between copies of the same design, explains "much, though not all" of the sim–measurement discrepancy. Pitched as fitting makers' everyday workflow. Authors not confirmed. — [arXiv PDF](https://arxiv.org/pdf/2609.22468)
- Related adjoint-for-TMM method in a non-instrument field: "Physics-agnostic inverse design using transfer matrices" (APL Machine Learning, Mar 2024). — [DOAJ](https://doaj.org/article/53d9be43a63a4eee9eddf5f67ec2e84e)
- "Can the perfect Swiss alphorn be designed? A combination of reduced basis method and machine learning for shape optimization" (arXiv 2607.22823, ~July 2026). Parametrized FEM avoids remeshing per shape. A reduced-basis framework generates thousands of simulations, and a deep neural network identifies the optimal shape. Includes a mesh-convergence study of the impedance spectrum. Final results not verified. — [arXiv PDF](https://arxiv.org/pdf/2607.22823)
- Clarinet register-hole design (arXiv 2601.01981, Jan 2026): finds combinations of register-hole diameter, position and chimney length that give reliable register transitions. — [arXiv](https://arxiv.org/abs/2601.01981v1)
- Sensitivity of modal parameters to resonator geometry, applied to saxophone intonation (arXiv 2506.16220, 2025). — [arXiv](https://web3.arxiv.org/abs/2506.16220)
- A US patent titled "Computation design of acoustic resonators" (US 11798521) appeared in searches. I did not read its contents. — [USPTO PDF](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11798521)

### Inferences
- For a tube without holes (didgeridoo, alphorn), inverse design to target resonances is effectively solved and fast: adjoint TMM, 1D FEM with FWI, reduced basis plus ML. With tone holes it is mature for pitch (logical clarinet, OpenWInD, WIDesigner).
- Free-form 3D inverse design (Printone, Acoustic Voxels, the MIT thesis) shows feasibility but stops at pitch or rough spectral match. Printone ignores the jet/excitation, and Acoustic Voxels is a filter/transmission model. Neither captures the coupling of the edge-tone/fipple jet to the resonator, which matters for flutes, whistles and ocarinas.
- Multi-pipe or multi-chamber single-piece printed instruments are only covered implicitly: Acoustic Voxels' assembled networks of primitives come closest to "multiple internal chambers". No playable multi-pipe flute was demonstrated in the sources found.

### Gaps
- I found no 2023–2026 SIGGRAPH or NIME paper on free-form wind-instrument inverse design (search returned nothing newer than 2017 for NIME + printed wind). A direct browse of NIME 2023–2026 proceedings is needed to confirm none exists.
- I found no peer-reviewed ocarina/vessel-flute inverse-design paper. Only Printone (general), the LES analysis and a hobbyist build packet ([tonykoop ocarina](https://tonykoop.github.io/ocarina/design.md)) turned up.
- TubeLab's authors, code URL and numeric accuracy (cents error) are unverified because the full text was not readable. One search summary linked it to the Szwarcberg group, but nothing in the snippets confirmed that, so I left it out.

## 2. Open-source and commercial tools

### Takeaway
The open tools are strongest for 1D bores. DidgeLab and Didgmo cover didgeridoos; WIDesigner covers whistles and Native American flutes, with a prototype for transverse flutes; OpenWInD is a general 1D FEM toolbox with inverse design; TubeLab is browser-based. BIAS is commercial impedance-measurement hardware and software. None handles free-form 3D printed bodies with several chambers.

### Cited Findings
- **DidgeLab** (Jan Nehring, Didgitaldoo): Python toolkit, on PyPI as `didgelab`. The builder defines the target sound (e.g., drone in D, toots in F, G, B) and an evolutionary search computes the bore geometry. Inspired by Frank Geipel's CADSD. Didgelab 1.0 came out in 2022 and Didgelab 3 in Feb 2026. Gradient-based optimization with autodiff (e.g., PyTorch) is listed as future work. — [didgitaldoo.github.io](https://didgitaldoo.github.io/didgelab.html); [PyPI 3.0.8](https://pypi.org/project/didgelab/3.0.8/); [GitHub](https://www.github.com/jnehring/didge-lab)
- DidgeLab's licence conflicts between sources: PyPI says CC BY-NC-SA 4.0, the GitHub README says GPL v2.0. — [PyPI 3.0](https://pypi.org/project/didgelab/3.0/); [GitHub](https://www.github.com/jnehring/didge-lab)
- DidgeLab validation is simulator-to-simulator: the author says geometries fed to Didgmo and DidjImp give the same impedance spectra. The README also reports the author "could not get the 3D printer to work" and would restart that effort later, so there is no published print validation. — [GitHub](https://www.github.com/jnehring/didge-lab)
- Didgitaldoo Feb 2026 posts: a 1D FEM impedance solver (Webster horn equation plus a wall-loss term), described as more precise but slower than the transmission-line model, and "didge2wav", a sound-synthesis post. A guide to reading DidgeLab outputs exists (2025). — [1D FEM post](https://didgitaldoo.github.io/2026/02/26/1dfem.html); [didge2wav](https://didgitaldoo.github.io/2026/02/26/didge2wav.html); [outputs guide](https://didgitaldoo.github.io/2025/02/13/how-to-read-outputs-of-didgelab.html)
- **Didgmo**: SourceForge software that simulates didgeridoo sound characteristics from the inner geometry and computes the impedance spectrum (older). — [didgmo.sourceforge.net](https://didgmo.sourceforge.net/)
- **DidjImp**: SourceForge project, C#/.NET/Mono, registered 2008. I found no description of its features (older). — [SourceForge](https://sourceforge.net/projects/didjimp/)
- **CADSD (Frank Geipel)**: I found no current official page; it is known only as DidgeLab's inspiration. — [GitHub didge-lab](https://www.github.com/jnehring/didge-lab)
- **WIDesigner / WWIDesigner** (Edward Kort): a Java application under the GNU GPL. Supports whistles and Native American flutes; the transverse-flute model is a prototype derived from the whistle model. Uses transfer-matrix models of bore, tone holes and excitation for fast impedance calculations. Optimizers: Flute Calibrator (fits airstream length and beta factor to measured notes), hole size, hole spacing, stopper position (added in v2.4.0). Each optimizer varies geometry to match a target tuning. — [GitHub wiki mirror: optimizers](https://github-wiki-see.page/m/edwardkort/WWIDesigner/wiki/Optimizers-in-the-Whistle-and-Flute-Study-Models); [wiki: optimizing design](https://github-wiki-see.page/m/edwardkort/WWIDesigner/wiki/Optimizing-a-Whistle-or-Flute-Design); [Chiff & Fipple announcement](https://www.chiffandfipple.com/t/widesigner-new-tuning-calculator-and-optimizer/92874); [v2.4.0](https://forums.chiffandfipple.com/t/widesigner-release-2-4-0-now-available/101068)
- WIDesigner's calibrator fits model parameters to measured frequencies of a physical prototype, a form of physical-prototype-in-the-loop correction. — [wiki mirror](https://github-wiki-see.page/m/edwardkort/WWIDesigner/wiki/Optimizers-in-the-Whistle-and-Flute-Study-Models)
- **OpenWInD** (Inria team Makutu): Python library, GPL-v3, 1D FEM. Forward: acoustic response from geometry. Inverse: reconstructs shape to meet an objective, used for bore reconstruction and design, via full-waveform inversion. Has a web GUI, frequency-domain only. Contributions go through gitlab.inria.fr. — [PyPI 0.7.1](https://pypi.org/project/openwind/0.7.1/); [HAL "Virtual Workshop OpenWinD"](https://hal-univ-pau.archives-ouvertes.fr/hal-02984478); [Acta Acustica 2021](https://acta-acustica.edpsciences.org/articles/aacus/epub2/2021/01/aacus210048/aacus210048.epub)
- **TubeLab**: browser-based TMM with adjoint inverse design for bores without holes (see section 1). — [arXiv PDF](https://arxiv.org/pdf/2609.22468)
- **BIAS** (Brass wind Instrument Analyzing System; TU Wien, AES paper 1989; sold by Artim): measures input impedance and derives intonation from it, player-independent. A secondhand forum post says the higher tier adds physical modelling to predict the effect of design changes, and that an extended version covers woodwinds. No explicit optimizer was found. — [AES e-lib 5860](https://www.aes.org/e-lib/browse.cfm?elib=5860); [Houghton Horns](https://houghtonhorns.com/pages/brass-instrument-acoustic-analysis); [TubaForum](https://www.tubaforum.net/viewtopic.php?p=126903)
- NESS (Edinburgh): physical-modelling synthesis of brass instruments, for synthesis rather than design. — [NESS brass](https://www.ness.music.ed.ac.uk/target-systems/brass-instruments)

### Inferences
- Maturity ranking: WIDesigner and OpenWInD are the most mature for instruments with tone holes. DidgeLab and Didgmo serve the didgeridoo niche. TubeLab is new research software. Printone and Acoustic Voxels appear to be research code only; I found no maintained public release.
- Every one of these tools treats the instrument as an axisymmetric 1D bore with lumped tone holes, so folded or branched multi-chamber geometries are out of scope. The exception is OpenWInD, which may handle networks, but that is unverified.

### Gaps
- I could not confirm whether Printone or Acoustic Voxels code was ever released.
- I could not confirm BIAS's current tiers and features from Artim directly.
- I could not confirm whether OpenWInD supports branched or multi-pipe networks.

## 3. ML, differentiable acoustics and physical modelling for inverse design

### Takeaway
Differentiable and adjoint methods are now used for 1D bores (TubeLab adjoint TMM, OpenWInD FWI). ML surrogates appear in the alphorn reduced-basis + DNN paper (2026) and the MIT 3D-FDTD + DL thesis (2019). A differentiable 3D wave solver (j-Wave/JAX) has been used for fabrication-constrained acoustic inverse design (AcoustiPrint, 2026), but not for wind instruments. I found no Bayesian optimization with physical prints in the loop for wind instruments.

### Cited Findings
- AcoustiPrint: "Physics-Guided Neural Design of Manufacturable Acoustic Structures" (arXiv 2610.30411, ~Oct 2026). Inverse design under fabrication constraints using j-Wave, a JAX differentiable acoustic simulator. The problem is a focal-region design, not an instrument. — [arXiv PDF](https://arxiv.org/pdf/2610.30411)
- Borrel-Jensen and Bjørgaard (arXiv 2511.11415, Nov 2025): automatic differentiation for acoustic inverse problems, including shape optimization for resonance damping. No wind instruments. — [arXiv](https://arxiv.org/abs/2511.11415v1)
- "Acoustic Structure Inverse Design and Optimization Using Deep Learning" (arXiv 2102.02063, 2021, older). — [arXiv](https://arxiv.org/pdf/2102.02063)
- MIT thesis: GPU 3D FDTD forward model plus deep learning for the inverse shape problem, single-reed excitation (2019). — [DSpace@MIT](https://dspace.mit.edu/handle/1721.1/123116)
- Alphorn: reduced basis method generating thousands of FEM solutions, with a DNN to find the optimal shape (2026). — [arXiv PDF](https://arxiv.org/pdf/2607.22823)
- TubeLab: an adjoint-state TMM gradient; the Jacobian is cheaper than the initial frequency sweep, which is why it runs interactively in a browser (2026). — [arXiv PDF](https://arxiv.org/pdf/2609.22468)
- DidgeLab lists autodiff/PyTorch gradient descent as future work; it currently uses evolutionary search. — [PyPI](https://pypi.org/project/didgelab/3.0.1/)
- Surrogate-assisted derivative-free optimization (MADS) for brass bores. — [HAL 01504179](https://hal-univ-lemans.archives-ouvertes.fr/hal-01504179)
- Human-in-the-loop preferential Bayesian optimization for 3D printing (Deneault et al., Digital Discovery 2025): a human ranks triplets of images of printed objects (vases, cones). Not acoustic, not instruments. — [RSC Digital Discovery](https://pubs.rsc.org/en/content/articlepdf/2025/dd/d4dd00320a)
- A JoVE review of deep-learning timbre synthesis covers inverse design and differentiable or surrogate models. It argues the target should be a feasible range across manufacturing tolerances and players rather than one geometry or spectrum. — [JoVE](https://www.jove.com/t/74366/a-deep-learning-driven-approach-for-musical-instrument-sound)

### Inferences
- The obvious next step is to combine a differentiable 3D solver (j-Wave/FDTD in JAX) with a jet/edge-tone excitation model and printability constraints for flutes and whistles. I found no publication that does this, so it appears open.
- Closing the loop with printed prototypes appears only informally: WIDesigner's calibrator, and TubeLab's controlled builds used for validation. Nobody has published a formal Bayesian-optimization loop of print, measure and update.

### Gaps
- I found no source for differentiable FDTD or neural surrogates applied specifically to fipple, edge-tone or vessel-flute design.
- I found no Bayesian-optimization-with-prints study for any wind instrument.

## 4. How well simulations match real 3D-printed instruments

### Takeaway
Evidence is thin and mostly qualitative. FDM roughness reportedly raises impedance and destabilizes notes. A high-resolution PolyJet recorder sounded near-identical to the original to experts. TubeLab reports residual sim–measurement gaps on built didgeridoos, mostly explained by geometry uncertainty and variation between copies. I found no controlled study of how layer lines on the labium affect sound.

### Cited Findings
- Dabin/Ritz (Sydney/Wollongong): a PolyJet-printed alto recorder sounded nearly identical to the original according to experienced musicians. A low-resolution FDM print gave a rough surface, raised acoustic impedance and made stable notes harder to play. — [SPIE newsroom](https://amp.spie.org/news/6082-3d-printing-for-custom-design-and-manufacture-of-microtonal-flutes); [NIME 2016](https://nime.org/proc/nime2016_dabin/)
- Bacciaglia et al. review: FDM limitations include rough surfaces and coarse layer resolution. Instrument quality depends on layer thickness and machine accuracy, and cited work finds FDM roughness can cause air leakage that makes parts unusable for musicians. — [Springer, Progress in Additive Manufacturing 2021](https://link.springer.com/article/10.1007/s40964-021-00183-5)
- Unibo study: "A Design of Experiment approach to 3D-printed mouthpieces sound analysis". It exists, but I did not read its results. — [Unibo CRIS PDF](https://cris.unibo.it/retrieve/e1dcb338-1407-7715-e053-1705fe0a6cc9/A%20Design%20Of%20Experiment%20Approach%20To%203D-printed%20mouthpieces%20sound%20analysis.pdf)
- Polymers 2023, "Three-Dimensional Printing Process for Musical Instruments: Sound Reflection Properties of Polymeric Materials": a larger layer height does not necessarily mean worse acoustic performance, and surface-geometry parameters relate to sound reflection. This measures materials, not instruments. — [PMC10181013](https://pmc.ncbi.nlm.nih.gov/articles/PMC10181013)
- Trinity College Dublin thesis on extrusion-printed acoustic materials: the staircase surface roughness is partly responsible for the gap between numerical predictions and experiments. — [TARA TCD](https://www.tara.tcd.ie/items/b796177b-8994-4a86-bf9d-fa67457b5865)
- TubeLab: geometry uncertainty explains much but not all of the discrepancy on controlled-built didgeridoos, partly from variation between copies of one design. The fabrication method is not confirmed from the snippet. — [arXiv PDF](https://arxiv.org/pdf/2609.22468)
- Acoustic Voxels were validated against industrial lab measurements and FEM. — [poster](https://www.cs.columbia.edu/cg/lego/acoustic-voxels-siggraph-2016-poster-li-et-al.pdf)
- Informal tests: Prusa found PLA/ASA recorders slightly "warmer", PETG brighter, and smoothed ASA loudest and clearest, with a small difference from ABS or wood (blog, anecdotal). A Bambu forum user found plain PLA brighter than wood-fill PLA on a pan flute (anecdotal). — [Prusa blog](https://blog.prusa3d.com/3d-print-a-recorder-an-ocarina-or-a-kazoo-3d-pritned-musical-instruments_49390/); [Bambu forum](https://forum.bambulab.com/t/sound-quality-differences-between-filaments-instruments-isolation/70370)
- A patent on a 3D-printed flute head joint says high print resolution matters for the labium but gives no measurements. — [USPTO 11769474](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11769474)
- Didgeridoo measurement benchmark (UNSW): broadband input-impedance measurement from 0.2 to 3 kHz. Playing quality correlates with low |Z| between 1 and 2 kHz. — [UNSW didjeridu review](https://www.phys.unsw.edu.au/jw/reprints/didjeridu_review.pdf); [Tarnopolsky et al.](https://www.phys.unsw.edu.au/jw/reprints/Tarnopolskyetal.pdf)

### Inferences
- For printed instruments, the main error sources appear to be geometry fidelity (dimensional accuracy, copy-to-copy variation), wall roughness (higher losses, possible leaks) and labium/windway edge quality. Wall material elasticity seems secondary for rigid-wall air columns, although that is only supported anecdotally here.
- The edge and windway are the least modelled and probably the most print-sensitive parts. That suggests printing them at high resolution, as separate inserts, or post-processing them.

### Gaps
- I found no quantitative measured-vs-simulated cents-error study for FDM-printed flutes, whistles or ocarinas.
- I found no study of layer-line orientation or height at the labium.
- I found no DidgeLab print validation; the author reported printer issues.

## 5. Optimization toward a target timbre or recorded sound (not just pitch)

### Takeaway
Timbre-aware optimization exists only in limited forms. Brass spectral-centroid objectives (JASA 2019), the MIT thesis's "approximate a desired sound" (2019) and DidgeLab's sound-targeted didgeridoo design (drone plus toots, with impedance-shape preferences) are the closest. I found no work that optimizes a flute, whistle or ocarina geometry to match a recorded target sound.

### Cited Findings
- Brass: objectives and constraints on spectral centroid as well as intonation, with acknowledged limits in predicting realistic centroid values. — [HAL 01963668](https://hal.archives-ouvertes.fr/hal-01963668); [Bohrium](https://www.bohrium.com/paper-details/sound-simulation-based-design-optimization-of-brass-wind-instruments/812757635282501632-582)
- MIT thesis: deep learning generates a 3D shape that roughly approximates a desired sound (single reed). — [DSpace@MIT](https://dspace.mit.edu/handle/1721.1/123116)
- DidgeLab: "first define the sound and then compute the geometry". Targets are drone and toot pitches; its didge2wav synthesis post suggests audio rendering but not audio-matching optimization. — [didgitaldoo](https://didgitaldoo.github.io/didgelab.html); [didge2wav](https://didgitaldoo.github.io/2026/02/26/didge2wav.html)
- Logical clarinet authors: balanced timbre across the range is harder than tuning, and timbre-based objectives are future work. — [arXiv 1209.3637](https://arxiv.org/pdf/1209.3637v1)
- Acoustic Voxels: target impedance-curve shape (desired peaks), a proxy for timbre. — [poster](https://www.cs.columbia.edu/cg/lego/acoustic-voxels-siggraph-2016-poster-li-et-al.pdf)

### Inferences
- Optimizing a fipple flute toward a recorded sound would need a sound-producing model (jet–labium plus resonator, time domain) inside the loop, or a learned surrogate from impedance to spectrum. Neither appears in the published design tools, which is a clear research gap.

### Gaps
- No source found for recorded-audio-target optimization of any edge-tone instrument, or for perceptual or timbre metrics used in a wind-instrument design loop after 2019.
