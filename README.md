# Tic Tac Toe - AI Challenge 🎮

A beautiful, interactive Tic Tac Toe game with a challenging AI opponent powered by the minimax algorithm.

## Features ✨

- **Colorful UI** - Modern gradient design with smooth animations
- **Challenging AI** - Three difficulty levels:
  - **Hard** (Default): Unbeatable AI using minimax algorithm
  - **Medium**: Smart AI that makes optimal moves 70% of the time
  - **Easy**: Random move selection for casual play
- **Score Tracking** - Keep track of wins, losses, and draws (persisted in browser)
- **Responsive Design** - Works on desktop and mobile devices.
- **Smooth Animations** - Pop-in effects for moves and interactive feedback

## How to Play 🎯

1. **Open the Game**: Simply open `index.html` in your web browser.
2. **Make Your Move**: Click any empty cell to place your X
3. **Beat the AI**: Try to get three in a row while blocking the AI from doing the same
4. **Track Score**: Your scores are automatically saved between sessions
5. **Change Difficulty**: Use the difficulty dropdown to adjust the AI challenge level
6. **New Game**: Click "New Game" to restart or "Reset Score" to clear all stats

## Game Rules 📋

- You play as **X**, the AI plays as **O**
- Take turns placing marks on a 3×3 grid
- First to get three marks in a row (horizontal, vertical, or diagonal) wins
- If all cells are filled with no winner, it's a draw

## Technical Details 🔧

### Technologies Used
- **HTML5** - Game structure and layout
- **CSS3** - Gradient backgrounds, animations, and responsive design
- **JavaScript (ES6)** - Game logic and AI algorithm

### AI Algorithm
The "Hard" difficulty uses the **Minimax algorithm** with these features:
- Evaluates all possible future game states
- Scores positions based on game outcome and search depth
- Always makes the optimal move
- Unbeatable when playing second (after you)

### File Structure
```
index.html    - Game markup and structure
style.css     - Styling and animations
script.js     - Game logic and AI implementation
README.md     - This file
```

## Performance 🚀

The game is lightweight and runs entirely in the browser with no external dependencies. All calculations are performed locally - no network requests needed.

## Browser Support 🌐

Works on all modern browsers that support:
- ES6 JavaScript
- CSS Gradients and Animations
- LocalStorage API

Tested and working on:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Game Statistics 📊

Scores are automatically saved to your browser's localStorage and persist between sessions. Click "Reset Score" to clear all statistics.

## Tips for Playing 🎓

1. **Hard Mode Strategy**: 
   - The AI is unbeatable with optimal play
   - Focus on creating a draw by blocking all of the AI's winning moves
   - The center square is strategically important

2. **Medium Mode Tips**:
   - The AI will occasionally make suboptimal moves
   - Exploit these opportunities to create winning patterns

3. **Easy Mode**:
   - Good for casual play and learning
   - Perfect for new players

## Credits 👨‍💻

Built with ❤️ as a demonstration of game AI and modern web design.

---

Enjoy the challenge! 🎮✨

Thanks for the Support.
