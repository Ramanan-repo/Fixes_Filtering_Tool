const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            enableRemoteModule: false,
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('index.html');

    // Handle external links → open in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" }; // prevent opening inside Electron
    });

    mainWindow.webContents.on("will-navigate", (event, url) => {
        if (url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // Build custom app menu
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Refresh',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.loadFile('index.html')
                },
                { role: 'quit' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Fixes Filtering',
                            message: 'Fixes Filtering v1.1\n\nFor queries contact:\nramanan.raj@wipro.com & divyanshi.negi@wipro.com',
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

// IPC listener for Python script execution
ipcMain.on("run-jira", (event) => {
    const scriptPath = path.join(__dirname, "jira_login.py");

    execFile("python", [scriptPath], (error, stdout, stderr) => {
        if (error) {
            console.error("Error:", error);
            event.reply("jira-status", { success: false, message: error.message });
            return;
        }
        console.log("Output:", stdout);
        event.reply("jira-status", { success: true, message: "JIRA login executed." });
    });
});
