import fs from 'fs';
import peggy from "peggy";
import phpeggy from "phpeggy";
import { exit } from 'process';

// Load Config
const config = ((file) => {
	try {
		const data = JSON.parse(fs.readFileSync(file));
		console.log(`Load config from: '${file}'; SUCCESS;`);
		return data;
	} catch (error) {
		console.error(`Load config from: '${file}'; FAILED;`);
		exit(1);
	}
})("./compiler.json");

// Load Grammer
const grammer = ((file) => {
	try {
		const txt = String(fs.readFileSync(file));
		console.log(`Load grammer from: '${file}'; SUCCESS;`);
		return txt;
	} catch (error) {
		console.error(`Load grammer from: '${file}'; FAILED;`);
		exit(1);
	}
})(`${config.dir}${config.ip}`);

// Generate Parser
const parser = (() => {
	try {
		const txt = peggy.generate(grammer, {
			// cache: false,
			plugins: [phpeggy],
			phpeggy: {
				parserNamespace: config.namespace,
				parserClassName: config.class
			}
		});
		console.log(`Generate parser; SUCCESS;`);
		return txt;
	} catch (error) {
		console.error(`Generate parser; FAILED;`);
		exit(1);
	}
})();

// Save parser
((file) => {
	try {
		fs.writeFileSync(file, parser);
		console.log(`Write parser file: '${file}'; SUCCESS;`);
	} catch (error) {
		console.error(`Write parser file: '${file}'; FAILED;`);
		exit(1);
	}
})(`${config.dir}${config.class}.php`);