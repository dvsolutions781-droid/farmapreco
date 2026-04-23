exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'ok',
    tokenConfigured: !!process.env.SEFAZ_APP_TOKEN,
    timestamp: new Date().toISOString()
  })
});
