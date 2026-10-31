// DIGIDICE with a controller, and on the Xbox One (console kit: console-kit.js next to this file, copied unchanged).
// - Only while a controller is connected (any device): the D-pad moves between the tray's controls, left and right
//   change a dice type, A presses the chosen button and otherwise rolls, and the hint names the controller.
// - Xbox One only: fullscreen on the first controller press, its GPU named for app.js's renderer settings
//   (window.DigidiceConsole), and the TV layout (html.console-kit in styles.css).
import { isConsole, menu, onPad, padConnected, start } from './console-kit.js';

window.DigidiceConsole = { isConsole };

const app = document.getElementById('fullScreenContainer');
const roll = document.getElementById('rollButton');
const hint = document.querySelector('.keyboard-hint');
const keyboardHint = hint ? hint.innerHTML : '';

function wording() {
  const pad = padConnected() || isConsole();
  const text = pad ? '<kbd>A</kbd> TO ROLL <span>↳</span> D-PAD TO CHOOSE THE DICE' : keyboardHint;
  if (hint && hint.innerHTML !== text) hint.innerHTML = text;
}

// The cursor works here (menus and buttons), so no "Use game controls" card.
start({ card: false, onPadChange: wording });
wording();
menu({ root: app });
// A rolls unless the D-pad chose another button: with nothing chosen, or a drop-down or colour chosen, A goes to ROLL.
onPad((pad) => {
  if (!pad.pressed.a || !roll || roll.disabled) return;
  const el = document.activeElement;
  if (!(el instanceof HTMLButtonElement) || !app.contains(el)) roll.focus({ preventScroll: true });
});
