const nodes = {
	form: document.querySelector('#ip'),
	code: document.querySelector('#code'),
	view: document.querySelector('#view'),
	link: document.querySelector('a')
};
function parseJSON(str) {
	str = String(str).trim();
	if(str.length === 0) { return null; }
	try {
		return JSON.parse(str);
	} catch (error) {
		console.log('JSON.parse failed');
	}
	try {
		return PegJSON.parse(str);
	} catch (error) {
		console.log('PegJSON.parse failed');
	}
	console.log('Invalid JSON:', str);
	return null;
}
function getURLBase() {
	const base = String(nodes.form.url_base.value).trim();
	base ??= '../public/';

	return base.endsWith('/') ? base : `${base}/`;
}
function updateLink() {
	const link = `${getURLBase()}${nodes.form.url.value}`;
	nodes.link.setAttribute('href', link);
	nodes.link.textContent = link;
}
function updateOutput(code = null) {
	nodes.view.srcdoc = code ?? '<code>Loading...</code>';
	nodes.code.innerHTML = Prism.highlight(
		code ?? 'Loading...',
		Prism.languages.html,
		'html'
	);
}
async function fetchNDisplay() {
	console.group('Fetch');
	updateOutput();
	const ip = {};
	for(const k of ['url', 'post']) { ip[k] = nodes.form[k].value; }
	
	console.log('URL:', ip.url);

	if(ip.post !== null) {
		ip.post = parseJSON(ip.post);
	}
	const fetchConfig = { method: 'GET' };
	if(ip.post !== null) {
		fetchConfig.method = 'POST';
		fetchConfig.redirect = 'follow';
		if(nodes.form.url_encode.checked) {
			const data = new FormData;
			for(const [k, v] of Object.entries(ip.post)) {
				data.append(k, v);
			}
			fetchConfig.body = data;
			console.log('POST Encoding as FormData');
		} else {
			fetchConfig.headers = { 'Content-Type': 'application/json' };fetchConfig.body = JSON.stringify(ip.post);
			console.log('POST Encoding as application/json');
		}
		console.log('POST:', ip.post);
	}

	const fetched = await fetch(`${getURLBase()}${ip.url}`, fetchConfig).then(r => r.text()).catch(e => 'Load failed');

	updateOutput(fetched);
	console.groupEnd();
}
nodes.form.addEventListener('submit', (e) => {
	e.preventDefault();
	e.stopPropagation();
	fetchNDisplay();
	return false;
});
nodes.form.url.addEventListener('keyup', updateLink);
nodes.form.url_base.addEventListener('keyup', updateLink);
updateLink();