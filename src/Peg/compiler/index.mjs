import fs from 'fs';
import peggy from "peggy";
import phpeggy from "phpeggy";
import { exit } from 'process';
import { dirname } from 'node:path';

console.log('OK');
class File {
	static read(filePath, title, isJSON = false) {
		try {
			console.log(`Load ${title} file from: '${filePath}';`);
			const txt = String(fs.readFileSync(filePath));
			console.log(`\tLoaded;`);
			if(isJSON) {
				console.log(`\tParsing JSON;`);
				const data = JSON.parse(txt);
				console.log(`\tParsed;`);
				return data;
			} else {
				return txt;
			}
		} catch (error) {
			console.log(`\tFailed;`, error.message);
			return null;
		}
	}
	static write(path, title, content) {
		try {
			console.log(`Writing ${title} file at: '${path}';`);
			fs.writeFileSync(path, content);
			console.log(`\tWritten;`);
		} catch (error) {
			console.log(`\tFailed;`, error.message);
		}
	}
}

// Load Config
const Config = File.read('./compiler/config.json', 'Configuration', true);
if(Config === null) { exit(1); }

for(const f of Config.files) {
	console.log('-----------------------------------------------');
	// Load Grammer
	const grammer = File.read(f.ip, 'Grammer');
	if(grammer === null) { continue; }
	const dir = dirname(f.ip);
	let parser = null;
	// Generate Parser
	try {
		console.log(`Generating parser ${Config.namespace}\\${f.class};`);
		parser = peggy.generate(grammer, {
			// cache: false,
			plugins: [phpeggy],
			phpeggy: {
				parserNamespace: Config.namespace,
				parserClassName: f.class
			}
		});
		console.log(`\tGenerated;`);
	} catch (error) {
		console.log(`\tFailed;`, error.message);
	}
	if(parser === null) { continue; }
	File.write(`${dir}/${f.class}.php`, `${Config.namespace}\\${f.class};`, parser);
}