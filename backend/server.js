const supabase = require('./supabase');

app.get('/test', async (req, res) => {
  const { data, error } = await supabase.from('customers').select('*');
  res.json({ data, error });
});
