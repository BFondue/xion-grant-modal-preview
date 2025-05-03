export default {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	fetch(request) {
		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
