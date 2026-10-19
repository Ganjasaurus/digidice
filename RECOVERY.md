# DIGIDICE recovery

Recovered on 9 October 2026 from the **DIGIDICE** menu item on the public WordPress site:

- Source page: https://diecardtemp.wordpress.com/digidice/
- Public page data: https://public-api.wordpress.com/rest/v1.1/sites/diecardtemp.wordpress.com/posts/6478
- WordPress page ID: `6478`; reported last modification: `2026-01-19T01:58:45+00:00`.

The menu led directly to the real tool. No replacement generic dice roller was used. The page retained 32,182 characters of roller content, its original image/audio URLs and the exact Three.js r110 and Cannon.js 0.6.2 dependency versions.

The linked pen at https://codepen.io/Mac-Macbain/pen/QwEWMwv currently contains an unrelated joystick game. It was inspected but was not used as the roller source. The WordPress and CodePen lookup tabs were closed after saving the evidence; one active DIGIDICE preview was retained.

## What survived

The archived `wordpress-content.html.txt` is the exact UTF-8 content string returned by the public WordPress API; its SHA-256 is recorded in `provenance.json`. The `.txt` suffix prevents its old embedded CodePen from running when reviewing the archive. `wordpress-page-6478.json` preserves the downloaded public response. `wordpress-decoded.txt` removes WordPress-created URL anchor wrappers and decodes HTML entities while keeping the damaged code unchanged.

WordPress stripped script/style/canvas/form elements, converted quotes and minus operators into typography, and swallowed several stretches containing less-than signs. This is **surviving original source, not a recovered complete executable original**. In particular, quantity defaults/bounds, part of the roll dispatcher, the animation loop, falling-dice cleanup and some motion maths no longer exist in the public copy. Those parts were reconstructed around the surviving code. The original missing quantity cap cannot be established; 0–12 per set is a new practical limit.

## Original mechanics retained

| Shape | Original geometry / mass | Original launch |
|---|---|---|
| D2 Coin | Cylinder: radius 1.5, thickness 0.4, 32 segments; mass 15 | Starts at Y=8; random Euler rotation; angular velocity 0–20 per axis, velocity −10–10; angular damping 0.3 |
| D4 Tetrahedron | Tetrahedron radius 2; mass 1 | Starts at Y=8; random Euler rotation; angular velocity 0–20 per axis, velocity −10–10 |
| D4 TeeJayhedron | Tetrahedron radius 3.5; mass 1; transparent shell and inner radius `3.5 × 0.33333` | Same tetra launch; original inner rotation changes with top/underside view |
| D6 Cube | Cube size 2; mass 8 | Starts at Y=5; random Euler rotation; angular velocity −12.5–12.5; X/Z velocity −50–50; Y velocity −40–−20 |
| D8 Octahedron | Octahedron radius 2; mass 1 | Same tetra launch |

All play objects spawn with X/Z centres in −7.5–7.5. Gravity remains `(0, −9.82, 0)`. The original ground, four walls and roof remain, including the playable wall surfaces at X/Z ±10. The original unused `diceMaterial` assignments were not turned into new friction/restitution behaviour: Cannon's actual original default contacts and body damping remain. Bodies may sleep after coming to rest to save work.

The surviving original uses random launch positions, Euler rotations and velocities followed by collision physics. There is no original independent uniform face picker. The restoration retains those sampled launch distributions and reads the landed face; it does not force equal probabilities or substitute a different random-number roller. Exact historical outcome frequencies cannot be proved from the damaged original, and the empirical checks are not an equal-odds guarantee.

All twelve original PNG textures and all three original MP3 files are bundled. Triangle UVs retain the original atlas mapping. The D4 atlas order is `2, 3, 1, 4`; the D8 order, independently checked against the original pixel artwork, is `5, 3, 2, 6, 8, 7, 1, 4`. Coin mesh/physics cylinder axes retain the original 90-degree alignment. The colourful falling-dice introduction remains, with its original cube size range of 1.5–2.5; its lost timing/cleanup were rebuilt and bounded. Reduced-motion users receive a static introduction.

## Repairs and presentation

- Restored real HTML controls, the canvas, script loading, syntax, missing dispatch/animation/cleanup and usable responsive sizing.
- Retained two independently configured sets, all five shape options, colour, amount, roll, music, roll sounds, fullscreen and motion.
- Consolidated the conflicting duplicate motion handlers. The erased motion force calculation was rebuilt; it now safely moves all five shapes, checks permissions and handles missing sensor data.
- Retained the original D4 underside camera rule and TeeJayhedron inner orientation. Camera sizing fits portrait and desktop without cropping the tray.
- Made fullscreen rejection fall back to an expanded tray instead of the original iOS alert. Added keyboard controls and visible focus states.
- Added readable and accessible results from actual orientations. Tilted or edge-landed dice stay unresolved; no hidden random value is assigned.
- Bound and validate quantities, remove every previous dynamic body on reroll and reuse geometry/texture resources. Settled dice stop repeated WebGL drawing, and hidden pages pause simulation work.
- Embedded PNG data in `textures.js` so artwork has no cross-origin local-file dependency. No external runtime requests are needed.
- Applied RETROFLESHED presentation: dominant black, saturated grape-purple, clear moss/leaf green, crisp borders and solid offset shadows.

## Verification

`mechanics-checks.json` records the completed checks: all five shapes, 200 seeded physical rolls, finite positions, tray confinement, every mapped face, original dimensions/masses/gravity/launch bounds, invalid quantities/colours, safe synthetic motion, a maximum 24-cube pool and two maximum mixed pools (12 TeeJayhedrons + 12 coins; 12 tetrahedrons + 12 D8s). All 200 single-shape runs came to rest; some legitimately landed against a wall or at an angle and therefore remained unresolved.

Browser checks used the actual localhost app: the five shapes, top and underside views, zero quantity, colour input, amount buttons and caps, invalid fractional/empty pools, Enter/Space, visible focus, music play/pause, fullscreen enter/exit, motion on/off, reroll body counts and desktop/mobile rendering. Saved viewport details and observations are in `ui-checks.json`. Physical handset motion and real iOS fullscreen were not available to test. The direct `file://` check was blocked by the browser's HTTP/HTTPS URL policy; the local HTTP app and its launcher's readiness were verified instead.

No public deployment, DNS/redirect change or separate game/website edit was performed.

The final brand spelling was corrected to **RetroFleshed / RETROFLESHED** in the app's visible copy, title, accessibility label and documentation after screenshot export. Paths, mechanics and styling were kept unchanged. Existing screenshots/check observations still show the earlier spaced spelling; no further live tests or captures were run for this copy-only update.
