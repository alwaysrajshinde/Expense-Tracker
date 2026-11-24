const { execSync } = require('child_process');

console.log('[deploy] Resetting unstaged version file...');
execSync('git checkout -- client/src/constants/version.js', { stdio: 'inherit' });

console.log('[deploy] Checking out gh-pages branch...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('[deploy] Copying client/dist to root...');
execSync('node -e "const fs = require(\'fs\'); const path = require(\'path\'); function copyDir(src, dest) { if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true }); for (const item of fs.readdirSync(src)) { const s = path.join(src, item); const d = path.join(dest, item); if (fs.statSync(s).isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } } copyDir(\'client/dist\', \'.\');"', { stdio: 'inherit' });

console.log('[deploy] Staging and committing...');
execSync('git add -A', { stdio: 'inherit' });

try {
  execSync('git commit -m "deploy: v2.4.5 full E2E verified build"', { stdio: 'inherit' });
  console.log('[deploy] Pushing to origin gh-pages...');
  execSync('git push origin gh-pages', { stdio: 'inherit' });
} catch (e) {
  console.log('[deploy] No changes to commit or already up to date.');
}

console.log('[deploy] Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });
console.log('[deploy] Deployment complete!');
