import {readFileSync, writeFileSync} from 'node:fs';
import fetch from 'node-fetch';

const data = JSON.parse(readFileSync('./data.json', 'utf8'));
const plopHeader = readFileSync('./plop-header.md', 'utf8');

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
				.map((repoData) => {
					let str = `- [${repoData.name}](${repoData.html_url}) - ${repoData.description}`
					if (repoData.image && !repoData.imageLink) {
						str += `\n\n![${repoData.imageAlt || ""}](${repoData.image})\n\n`
					} else if (repoData.image && repoData.imageLink) {
						str += `\n\n[![${repoData.imageAlt || ""}](${repoData.image})](${repoData.imageLink})\n\n`
					}
					return str;
				})
				.join('\n');
			return `## ${header}\n\n${headerItems}`;
		})
		.join('\n\n');

	writeFileSync('./README.md', [plopHeader, awesomeListData].join('\n'));
});
