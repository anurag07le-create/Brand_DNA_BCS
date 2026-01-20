const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'template icon');
const destDir = path.join(process.cwd(), 'src', 'assets', 'icons');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.readdir(srcDir, (err, files) => {
    if (err) {
        console.error("Could not list the directory.", err);
        process.exit(1);
    }

    files.forEach(file => {
        let newName = file;

        // Match "Property 2=Name, Property 1=Default.png"
        const prop2Match = file.match(/Property 2=(.*?),/);
        if (prop2Match) {
            newName = prop2Match[1].trim() + '.png';
        } else {
            // Match "Property 1=Default..."
            const prop1Match = file.match(/Property 1=(.*?)(\.png)/);
            if (prop1Match) {
                // Determine a safe name for default props, maybe keep original or simplify
                // For "Property 1=Default.png", lets call it "Default.png"
                // For "Property 1=Default (1).png", lets call it "Default_1.png"
                newName = file.replace('Property 1=', '').trim();
            }
        }

        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, newName);

        fs.copyFile(srcPath, destPath, (err) => {
            if (err) throw err;
            console.log(`Copied ${file} to ${newName}`);
        });
    });
});
