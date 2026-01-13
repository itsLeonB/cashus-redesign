// scripts/check-unused-components.ts
import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const uiComponentsDir = path.join(projectRoot, "src/components/ui");
const srcDir = path.join(projectRoot, "src");

// Get all UI components
const uiComponents = fs
  .readdirSync(uiComponentsDir)
  .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
  .map((file) => path.basename(file, path.extname(file)));

// Search for imports of these components
console.log("Checking unused UI components...\n");

const usedComponents: string[] = [];
const unusedComponents: string[] = [];

uiComponents.forEach((component) => {
  const componentName = component;
  const importPattern = `from ['"]@/components/ui/${componentName}['"]`;
  const importPatternAlt = `from ['"]\\.\\./ui/${componentName}['"]`;

  try {
    const grepCommand = `grep -r "${importPattern}" ${srcDir} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`;
    const grepCommandAlt = `grep -r "${importPatternAlt}" ${srcDir} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`;

    // Check both patterns
    const result = fs.readdirSync(srcDir).some(() => {
      // Simple check - you might want to use child_process for actual grep
      const files = getAllFiles(srcDir);
      return files.some((file) => {
        if (
          file.endsWith(".ts") ||
          file.endsWith(".tsx") ||
          file.endsWith(".js") ||
          file.endsWith(".jsx")
        ) {
          const content = fs.readFileSync(file, "utf8");
          return (
            content.includes(`@/components/ui/${componentName}`) ||
            content.includes(`../ui/${componentName}`) ||
            content.includes(`./ui/${componentName}`)
          );
        }
        return false;
      });
    });

    if (result) {
      usedComponents.push(componentName);
      console.log(`✓ ${componentName} - used`);
    } else {
      unusedComponents.push(componentName);
      console.log(`✗ ${componentName} - unused`);
    }
  } catch (error) {
    console.log(`? ${componentName} - error checking`);
  }
});

console.log(`\nSummary:`);
console.log(`Used: ${usedComponents.length} components`);
console.log(`Unused: ${unusedComponents.length} components`);

if (unusedComponents.length > 0) {
  console.log("\nUnused components:");
  unusedComponents.forEach((comp) => console.log(`  - ${comp}`));

  // Optionally create a cleanup script
  const cleanupScript = unusedComponents
    .map((comp) => `rm src/components/ui/${comp}.tsx`)
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
