const { app, Tray, Menu } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let phpServer;
let mysqlServer;
let tray = null;

const isDev = !app.isPackaged;
const resourcesPath = isDev 
  ? path.join(__dirname, '..', 'resources')
  : process.resourcesPath;

// Port configuration
const PORTS = {
  php: 8001,
  mysql: 3306
};

const APP_URL = `http://localhost:${PORTS.php}`;

function startMySQL() {
  return new Promise((resolve, reject) => {
    console.log('Starting MySQL...');
    
    const mysqldPath = path.join(resourcesPath, 'mysql', 'bin', 'mysqld.exe');
    const dataDir = path.join(resourcesPath, 'mysql', 'data');
    const myIni = path.join(resourcesPath, 'mysql', 'my.ini');
    
    // Initialize data directory if not exists
    if (!fs.existsSync(dataDir)) {
      console.log('Initializing MySQL data directory...');
      const initProcess = spawn(mysqldPath, [
        '--initialize-insecure',
        '--basedir=' + path.join(resourcesPath, 'mysql'),
        '--datadir=' + dataDir
      ]);
      
      initProcess.on('close', (code) => {
        if (code === 0) {
          startMySQLServer(mysqldPath, myIni, resolve, reject);
        } else {
          reject(new Error('MySQL initialization failed'));
        }
      });
    } else {
      startMySQLServer(mysqldPath, myIni, resolve, reject);
    }
  });
}

function startMySQLServer(mysqldPath, myIni, resolve, reject) {
  const args = fs.existsSync(myIni) 
    ? ['--defaults-file=' + myIni, '--console']
    : ['--port=' + PORTS.mysql, '--console'];
    
  mysqlServer = spawn(mysqldPath, args);
  
  mysqlServer.stdout.on('data', (data) => {
    console.log(`MySQL: ${data}`);
  });
  
  mysqlServer.stderr.on('data', (data) => {
    console.error(`MySQL: ${data}`);
  });
  
  setTimeout(() => {
    console.log(`MySQL server ready on port ${PORTS.mysql}`);
    resolve();
  }, 5000);
}

function startPHP() {
  return new Promise((resolve, reject) => {
    console.log('Starting Laravel server...');
    
    const phpPath = path.join(resourcesPath, 'php', 'php.exe');
    const laravelPath = path.join(resourcesPath, 'laravel');
    const artisanPath = path.join(laravelPath, 'artisan');
    
    // Check if artisan exists
    if (!fs.existsSync(artisanPath)) {
      reject(new Error('Laravel artisan not found'));
      return;
    }
    
    phpServer = spawn(phpPath, [
      artisanPath,
      'serve',
      '--host=127.0.0.1',
      '--port=' + PORTS.php
    ], {
      cwd: laravelPath
    });
    
    phpServer.stdout.on('data', (data) => {
      console.log(`Laravel: ${data}`);
    });
    
    phpServer.stderr.on('data', (data) => {
      console.error(`Laravel: ${data}`);
    });
    
    setTimeout(() => {
      console.log(`Laravel server ready on ${APP_URL}`);
      resolve();
    }, 3000);
  });
}

function openBrowser() {
  console.log('Opening browser...');
  
  // Open in default browser (Windows)
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${start} ${APP_URL}`, (error) => {
    if (error) {
      console.error('Failed to open browser:', error);
    }
  });
}

function createTray() {
  const iconPath = path.join(resourcesPath, 'icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open LMS', 
      click: () => openBrowser()
    },
    { type: 'separator' },
    { 
      label: 'Status',
      enabled: false
    },
    {
      label: `  MySQL: Running (Port ${PORTS.mysql})`,
      enabled: false
    },
    {
      label: `  Laravel: Running (Port ${PORTS.php})`,
      enabled: false
    },
    { type: 'separator' },
    { 
      label: 'Stop & Exit', 
      click: () => {
        stopServers();
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('LMS Application');
  tray.setContextMenu(contextMenu);
  
  // Double click to open browser
  tray.on('double-click', () => {
    openBrowser();
  });
}

function stopServers() {
  console.log('Stopping servers...');
  
  if (phpServer) {
    phpServer.kill();
    console.log('Laravel server stopped');
  }
  
  if (mysqlServer) {
    mysqlServer.kill();
    console.log('MySQL server stopped');
  }
}

async function startServers() {
  try {
    console.log('Resources path:', resourcesPath);
    console.log('Starting LMS Application...');
    
    // Start servers in sequence
    await startMySQL();
    await startPHP();
    
    // Create system tray icon
    createTray();
    
    // Open browser
    openBrowser();
    
    console.log('\n=================================');
    console.log('LMS Application is running!');
    console.log('URL: ' + APP_URL);
    console.log('=================================\n');
    
  } catch (error) {
    console.error('Failed to start servers:', error);
    
    const { dialog } = require('electron');
    dialog.showErrorBox('Startup Error', 
      'Failed to start application servers.\n\n' + error.message
    );
    
    app.quit();
  }
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, open browser instead
    openBrowser();
  });
  
  app.whenReady().then(startServers);
}

// macOS: Keep app running when all windows closed
app.on('window-all-closed', () => {
  // Don't quit, keep servers running
});

app.on('before-quit', () => {
  stopServers();
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
