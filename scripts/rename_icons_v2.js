const fs = require('fs');
const path = require('path');

const iconsDir = path.join(process.cwd(), 'src', 'assets', 'icons');

const map = {
    'Property 2=Home, Property 1=Default.png': 'home.png',
    'Property 2=Agents, Property 1=Default.png': 'agents.png',
    'Property 2=Chat, Property 1=Default.png': 'chat.png',
    'Property 2=Flows, Property 1=Default.png': 'flows.png',
    'Property 2=Activity, Property 1=Default.png': 'activity.png',
    'Property 2=MCP, Property 1=Default.png': 'mcp.png',
    'Property 2=Knowledge, Property 1=Default.png': 'knowledge.png',
    'Property 2=Tool, Property 1=Default.png': 'tools.png',
    'Property 2=Marketplace, Property 1=Default.png': 'marketplace.png',
    'Property 2=Sidebar, Property 1=Default.png': 'menu.png',
    'Property 2=Deep search, Property 1=Default.png': 'search.png',
    'Property 2=Conversation Flow, Property 1=Default.png': 'card_flow.png',
    // Bell ?? I will try "Property 2=Alert" if exists, or maybe "Union.png"
    // I will rename Union.png to bell.png just in case, typical for notification bell
    'Union.png': 'bell.png'
};

Object.entries(map).forEach(([oldName, newName]) => {
    const oldPath = path.join(iconsDir, oldName);
    const newPath = path.join(iconsDir, newName);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed ${oldName} -> ${newName}`);
    } else {
        console.log(`Skipped ${oldName} (not found)`);
    }
});
