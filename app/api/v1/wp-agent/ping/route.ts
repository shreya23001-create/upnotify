// Plugin self-test endpoint — called on plugin activation to verify connectivity
export async function GET(): Promise<Response> {
  return Response.json({ ok: true, service: 'Upnotify-wp-agent', version: '1.0' })
}
