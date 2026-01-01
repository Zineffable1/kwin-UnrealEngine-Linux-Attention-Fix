// Track the main UnrealEditor window
let mainUnrealWindow = null;

function blockUnrealWindow(client) {
    if (!client) return;
    
    if (client.resourceClass === "UnrealEditor") {
        // Track the main window: non-transient, not a type 8 menu
        if (!client.transient && client.windowType !== 8) {
            mainUnrealWindow = client;

            
            // Apply blocking properties to the main window
            mainUnrealWindow.demandsAttention = false;
            mainUnrealWindow.skipTaskbar = false; // main window stays in taskbar
            mainUnrealWindow.skipPager = false;
            mainUnrealWindow.skipSwitcher = false;
            mainUnrealWindow.focusable = true;
        }
        
        // Tooltips: non-transient, type 8
        if (!client.transient && client.windowType === 8) {
            client.demandsAttention = false;
            client.skipTaskbar = true;
            client.skipPager = true;
            client.skipSwitcher = true;
            client.focusable = false;

            return;
        }
        
        // Menus: type 8 + transient
        if (client.windowType === 8 && client.transient) {
            // Block the menu itself
            client.demandsAttention = false;
            client.skipTaskbar = true;
            client.skipPager = true;
            client.skipSwitcher = true;
            
            
            if (mainUnrealWindow) {
                // Prevent main window from demanding attention
                mainUnrealWindow.demandsAttention = false;
            }
            return;
        }
    }
}

// Additional handler for window property changes
function handleWindowChanged(client) {
    if (!client) return;
    
    if (client.resourceClass === "UnrealEditor") {
        // Continuously suppress demandsAttention for main window
        if (mainUnrealWindow && client === mainUnrealWindow) {
            mainUnrealWindow.demandsAttention = false;
        }
        
        // Suppress for menus
        if (client.windowType === 8 && client.transient) {
            client.demandsAttention = false;
            if (mainUnrealWindow) {
                mainUnrealWindow.demandsAttention = false;
            }
        }
    }
}

// Hook for new windows
workspace.windowAdded.connect(blockUnrealWindow);

// Hook for window activation
workspace.windowActivated.connect(blockUnrealWindow);

// Hook for window property changes (catches demandsAttention changes)
workspace.windowAdded.connect(function(client) {
    if (client && client.resourceClass === "UnrealEditor") {
        client.demandsAttentionChanged.connect(function() {
            handleWindowChanged(client);
        });
    }
});

// Process existing windows on script load
for (let i = 0; i < workspace.stackingOrder.length; i++) {
    blockUnrealWindow(workspace.stackingOrder[i]);
}