// Signed-in test for the Kimkloset shared API.
// Run from the project folder:  node scripts/test-api.mjs
// (optional) test another site: node scripts/test-api.mjs http://localhost:3000
//
// Logs in with YOUR account (typed here, never saved), adds one item your cart doesn't have,
// changes its quantity, lists orders, then removes that item again so your cart is unchanged.
import fs from 'node:fs';
import readline from 'node:readline';

const BASE = (process.argv[2] || 'https://kimkloset.vercel.app').replace(/\/$/, '');
console.log(`\nKimkloset API test → ${BASE}\n`);

if (!fs.existsSync('.env.local')) {
  console.log('Could not find .env.local. Run this from the project folder: cd ~/Downloads/kimkloset-v3');
  process.exit(1);
}
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
);
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// One prompt reader for both questions; the password is typed without being shown
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let muted = false;
const write = rl._writeToOutput?.bind(rl);
if (write) rl._writeToOutput = (s) => { if (!muted) write(s); };
const lines = [];
const waiting = [];
rl.on('line', (l) => (waiting.length ? waiting.shift()(l) : lines.push(l)));
const nextLine = () => (lines.length ? Promise.resolve(lines.shift()) : new Promise((r) => waiting.push(r)));

process.stdout.write('Email: ');
const email = (await nextLine()).trim();
process.stdout.write('Password (hidden, press Enter when done): ');
muted = true;
const password = (await nextLine()).trim();
muted = false;
rl.close();
console.log('\n');

const auth = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
}).then((r) => r.json());
if (!auth.access_token) {
  console.log('✗ Sign-in failed:', auth.error_description || auth.msg || JSON.stringify(auth));
  console.log('  (If you only ever signed in with Google, this account has no password. See the note in chat.)');
  process.exit(1);
}
console.log('✓ signed in as', auth.user.email);

const H = { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' };
async function call(method, path, body) {
  const res = await fetch(BASE + path, { method, headers: H, body: body && JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  console.log(`${res.ok ? '✓' : '✗'} ${method} ${path} → ${res.status}${json.error ? ' ' + json.error : ''}`);
  return json;
}

const { items: before = [] } = await call('GET', '/api/cart');
console.log(`  cart has ${before.length} line(s)`);
const { products = [] } = await call('GET', '/api/products');
const p = products.find((x) => x.stock > 1 && x.sizes.length > 0 && !before.some((i) => i.product_id === x.id));
if (!p) {
  console.log('No suitable product to test with.');
  process.exit(1);
}

const added = await call('POST', '/api/cart', { productId: p.id, size: p.sizes[0], color: p.colors[0] ?? '', quantity: 1 });
const line = added.items?.find((i) => i.product_id === p.id);
if (!line) {
  console.log('✗ The item did not appear in the cart. Stopping here.');
  process.exit(1);
}
console.log(`  added "${p.name}" qty ${line.quantity}`);

const patched = await call('PATCH', `/api/cart/${line.key}`, { quantity: 999 });
console.log(`  asked for 999, capped to ${patched.items?.find((i) => i.key === line.key)?.quantity} (stock ${p.stock}, max 10)`);

console.log('  next line SHOULD fail (fake size):');
await call('POST', '/api/cart', { productId: p.id, size: 'NOT-A-SIZE', color: p.colors[0] ?? '' });

const { orders = [] } = await call('GET', '/api/orders');
console.log(`  you have ${orders.length} order(s)`);

console.log('  next line SHOULD fail (fake order reference):');
await call('GET', '/api/orders/verify?reference=KK-000000-NOPE');

const after = await call('DELETE', `/api/cart/${line.key}`);
console.log(`  removed test item; cart back to ${after.items?.length} line(s) (was ${before.length})\n`);
