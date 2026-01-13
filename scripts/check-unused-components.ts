// scripts/check-unused-components.ts
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const uiComponentsDir = path.join(projectRoot, "src/components/ui");
const srcDir = path.join(projectRoot, "src");

interface Component {
  name: string;
  ext: string;
}

// Get all UI components
const uiComponents: Component[] = fs
  .readdirSync(uiComponentsDir)
  .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
  .map((file) => ({
    name: path.basename(file, path.extname(file)),
    ext: path.extname(file),
  }));

// Search for imports of these components
console.log("Checking unused UI components...\n");

const usedComponents: Component[] = [];
const unusedComponents: Component[] = [];

uiComponents.forEach((component) => {
  try {
    // Check both patterns
    const files = getAllFiles(srcDir);
    const result = files.some((file) => {
      if (
        file.endsWith(".ts") ||
        file.endsWith(".tsx") ||
        file.endsWith(".js") ||
        file.endsWith(".jsx")
      ) {
        const content = fs.readFileSync(file, "utf8");
        return (
          content.includes(`@/components/ui/${component.name}`) ||
          content.includes(`../ui/${component.name}`) ||
          content.includes(`./ui/${component.name}`)
        );
      }
      return false;
    });

    if (result) {
      usedComponents.push(component);
      console.log(`✓ ${component.name} - used`);
    } else {
      unusedComponents.push(component);
      console.log(`✗ ${component.name} - unused`);
    }
  } catch (error) {
    console.log(`? ${component.name} - error checking: ${error}`);
  }
});

console.log(`\nSummary:`);
console.log(`Used: ${usedComponents.length} components`);
console.log(`Unused: ${unusedComponents.length} components`);

if (unusedComponents.length > 0) {
  console.log("\nUnused components:");
  unusedComponents.forEach((comp) => console.log(`  - ${comp.name}`));

  // Optionally create a cleanup script
  const cleanupScript = unusedComponents
    .map((comp) => `rm src/components/ui/${comp.name}${comp.ext}`)
    .join("\n");

  fs.writeFileSync("cleanup-unused-ui.sh", `#!/bin/bash\n${cleanupScript}\n`);
  console.log("\nCleanup script created: cleanup-unused-ui.sh");
  console.log("Run: chmod +x cleanup-unused-ui.sh && ./cleanup-unused-ui.sh");
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const items = fs.readdirSync(currentDir);

    items.forEach((item) => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    });
  }

  traverse(dir);
  return files;
}
