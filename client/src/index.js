import './index.css';
import Game from './Game';

async function main() {
  const game = new Game();
  document.body.appendChild(await game.start());
}

main();
