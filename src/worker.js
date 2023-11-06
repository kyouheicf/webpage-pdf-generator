/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import puppeteer from '@cloudflare/puppeteer'

export default {
	async fetch(request, env, ctx) {
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,OPTIONS",
			"Access-Control-Max-Age": "86400",
		};

		async function handleOptions(request) {
			if (
				request.headers.get('Origin') !== null &&
				request.headers.get('Access-Control-Request-Method') !== null &&
				request.headers.get('Access-Control-Request-Headers') !== null
			) {
				// Handle CORS preflight requests.
				return new Response(null, {
					headers: {
						...corsHeaders,
						'Access-Control-Allow-Headers': request.headers.get(
							'Access-Control-Request-Headers'
						),
					},
				});
			} else {
				// Handle standard OPTIONS request.
				return new Response(null, {
					headers: {
						Allow: 'GET, OPTIONS',
					},
				});
			}
		}

		if (request.method === 'OPTIONS') {
			// Handle CORS preflight requests
			return handleOptions(request);
		} else if (
			request.method === 'GET'
		) {
			// Handle requests to the API server
			const browser = await puppeteer.launch(env.MYBROWSER);
			const page = await browser.newPage();

			await page.setViewport({
				width: 1920,
				height: 1080,
				deviceScaleFactor: 1,
			});

			const url = new URL(request.url);
			const target_url = url.searchParams.get("target_url");

			//await page.goto("https://ifconfig.co/", {
			await page.goto(target_url, {
				waitUntil: "load",
			});
			/*
			await page.setContent(htmlTemplate)
			const buffer = await page.pdf({
				printBackground: true,
				format: 'A4',
				margin: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
				}
			})
			*/
			const pdf = await page.pdf({
				displayHeaderFooter: false,
				printBackground: true,
				landscape: true,
				height: 500 + 'mm',
				width: 1000 + 'mm',
				margin: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
				},
			});
			await browser.close();

			const base64 = pdf.toString("base64");

			return new Response(base64, {
				headers: {
					//'Content-Length': Buffer.byteLength(base64),
					'Content-Type': 'application/pdf',
					'Access-Control-Allow-Origin': '*',
					'Content-Disposition': 'inline; filename="sample.pdf"', // ファイル名を指定
					//'Content-disposition': 'attachment;filename=output.pdf'
				},
			});
		} else {
			return new Response(null, {
				status: 405,
				statusText: 'Method Not Allowed',
			});
		}
	},
};