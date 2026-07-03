const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

let masterSql = '';
let realtimeTables = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  masterSql += `\n\n-- MIGRATION: ${file}\n\n`;
  masterSql += content;
}

// Extract and remove realtime table additions
const regex = /ALTER PUBLICATION supabase_realtime ADD TABLE (?:public\.)?([^;]+);/g;
let match;
while ((match = regex.exec(masterSql)) !== null) {
  realtimeTables.add(match[1].trim());
}

// Remove all those lines
masterSql = masterSql.replace(/ALTER PUBLICATION supabase_realtime ADD TABLE [^;]+;/g, '');

// Safely add them back at the end
masterSql += `\n\n-- SAFE REALTIME BINDINGS\n`;
masterSql += `DO $$\nDECLARE\n  t text;\nBEGIN\n`;
for (const table of realtimeTables) {
  masterSql += `  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = '${table}') THEN\n`;
  masterSql += `    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.${table}';\n`;
  masterSql += `  END IF;\n`;
}
masterSql += `END $$;\n`;

fs.writeFileSync(path.join(__dirname, 'supabase', 'MASTER_SETUP.sql'), masterSql);
console.log('Successfully generated MASTER_SETUP.sql');
