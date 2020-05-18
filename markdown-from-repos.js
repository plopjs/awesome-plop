const https = require('https');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

const cfg = { headers: { 'user-agent': 'Mozilla/5.0' } };

Promise.all(
	data.map(async (repoData) => {
		const res = await fetch(`https://api.github.com/repos/${repoData.repoUrl}`, cfg);
		const repoJSON = await res.json();

		const { description, html_url } = repoJSON;
		return {
			description,
			html_url,
			...repoData,
		};
	})
).then((repoDataArr) => {
	const reposObj = repoDataArr.reduce((prev, repoData) => {
		const cat = repoData.category;
		if (prev[cat]) {
			prev[cat].push(repoData);
		} else {
			prev[cat] = [repoData];
		}
		return prev;
	}, {});

	const headers = Object.keys(reposObj);

	const awesomeListData = headers
		.map((header) => {
			const repoArr = reposObj[header];
			const headerItems = repoArr
				.map((repoData) => `- [${repoData.name}](${repoData.html_url}) - ${repoData.description}`)
				.join('\n');
			return `# ${header}\n\n${headerItems}`;
		})
		.join('\n\n');

	fs.writeFileSync(
		'./awesomelist.md',
		['---', 'title: Awesome List', 'layout: awesomelist.hbs', '---', awesomeListData].join('\n')
	);
});
