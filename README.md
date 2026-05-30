# Tic Tac Toe - AI Challenge 🎮

A beautiful, interactive Tic Tac Toe game with a challenging AI opponent powered by the minimax algorithm.

## Features ✨

- **Colorful UI** - Modern gradient design with smooth animations
- **Challenging AI** - Three difficulty levels:
  - **Hard** (Default): Unbeatable AI using minimax algorithm
  - **Medium**: Smart AI that makes optimal moves 70% of the time
  - **Easy**: Random move selection for casual play
- **Score Tracking** - Keep track of wins, losses, and draws (persisted in browser)
- **Responsive Design** - Works on desktop and mobile devices
- **Smooth Animations** - Pop-in effects for moves and interactive feedback

## How to Play 🎯

1. **Open the Game**: Simply open `index.html` in your web browser
2. **Make Your Move**: Click any empty cell to place your X
3. **Beat the AI**: Try to get three in a row while blocking the AI from doing the same
4. **Track Score**: Your scores are automatically saved between sessions
5. **Change Difficulty**: Use the difficulty dropdown to adjust the AI challenge level
6. **New Game**: Click "New Game" to restart or "Reset Score" to clear all stats

## Local Development 🛠️

### Using Docker Compose (recommended)
```bash
docker-compose up
```
This will start:
- **Web UI**: http://localhost
- **WebSocket Server**: ws://localhost:3000

### Manual Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the WebSocket server:
   ```bash
   npm start
   ```
3. Open `index.html` in your browser
4. Select "Remote Multiplayer" and connect to `ws://localhost:3000`

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

## Remote Multiplayer Rooms 🌍

This game now supports remote multiplayer rooms over WebSocket.

### Run the room server
1. Navigate to the project folder:
   ```bash
   cd tic-tac-toe
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

### Play remotely
- Choose **Remote Multiplayer** from the mode dropdown.
- Enter the WebSocket server URL (default is `ws://localhost:3000`).
- Click **Create Room** to generate a room code.
- Share the room code with your opponent.
- Have the opponent enter the same room code and click **Join Room**.

> Note: To play from truly remote locations, host the WebSocket server on a machine with a public IP or port forwarding configured.

## CI/CD Pipeline 🚀

This project uses GitHub Actions to automatically build and deploy to Azure.

### Setup Requirements

1. **Azure Resources**
   - Azure Container Registry (ACR): `tictactoeacr123`
   - Azure Web App: `tic-tac-toe-app`
   - Resource Group with appropriate access

2. **GitHub Secrets** (configure in your GitHub repository settings)
   - `AZURE_CREDENTIALS`: Service principal credentials for Azure authentication
   
   To create Azure credentials:
   ```bash
   az ad sp create-for-rbac --name "tic-tac-toe-sp" --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}
   ```
   Then add the JSON output as a GitHub secret named `AZURE_CREDENTIALS`.

### Docker Image Build Strategy

The CI/CD pipeline:
- Builds a Docker image from the Dockerfile
- Tags it with git commit SHA and `latest`
- Pushes both tags to Azure Container Registry
- Deploys the latest image to Azure Web App

### Pipeline Workflow

The GitHub Actions workflow (`.github/workflows/Deploy.yml`) automatically:

1. **On Pull Request**: 
   - Runs syntax validation on JavaScript files
   - Installs and verifies dependencies
   - No deployment (safe testing)

2. **On Push to main**: 
   - Runs all checks
   - Builds and pushes Docker image to ACR
   - Deploys to Azure Web App

### Triggering Deployments

Simply push to the `main` branch:
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

The pipeline will automatically run and deploy within minutes.

### View Pipeline Status

1. Go to your GitHub repository
2. Click the **Actions** tab
3. View build and deployment logs in real-time
4. Check deployment status in Azure Portal under `tic-tac-toe-app`

### Production Considerations

For production deployment:

1. **WebSocket Server**: The Dockerfile serves static files via nginx. For remote multiplayer:
   - Deploy WebSocket server as a separate App Service or container
   - Or run it as a background process in the same container
   - Update `ws://` URLs in the app to point to your server

2. **Networking**: Configure App Service to:
   - Allow WebSocket connections
   - Set up SSL/TLS for `wss://` (secure WebSocket)
   - Configure CORS if needed

3. **Scaling**: Consider:
   - Container Registry replication for global distribution
   - App Service auto-scaling rules
   - WebSocket server clustering for multiplayer

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with syntax error | Check GitHub Actions logs for line number, fix in your IDE |
| ACR push fails | Verify `AZURE_CREDENTIALS` secret is correctly configured |
| Web App deployment fails | Ensure App Service is configured to pull from ACR |
| Can't connect to WebSocket | Verify server URL format: `ws://` for dev, `wss://` for production |

### Manual Deployment

If you need to deploy manually without GitHub Actions:
```bash
az acr build --registry tictactoeacr123 --image tic-tac-toe:latest .
az webapp config container set --name tic-tac-toe-app \
  --resource-group {your-resource-group} \
  --docker-custom-image-name tictactoeacr123.azurecr.io/tic-tac-toe:latest \
  --docker-registry-server-url https://tictactoeacr123.azurecr.io
```

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
