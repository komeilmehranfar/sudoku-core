/* eslint-disable */
const fs = require('fs/promises');
const Path = require('path')
/* eslint-enable */

async function removeFolderRecursive(folderPath) {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    console.log(`Folder and its contents removed successfully: ${folderPath}`);
  } catch (err) {
    console.error(`Error removing folder: ${folderPath}`, err);
  }
}

const folder = process.argv.slice(2)[0]

if (folder) {
  removeFolderRecursive(Path.join(__dirname, '../dist', folder));
} else {
  removeFolderRecursive(Path.join(__dirname, '../dist'));
}
