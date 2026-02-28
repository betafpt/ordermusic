const { execSync } = require('child_process');

try {
    console.log('Adding URL...');
    execSync('npx vercel env add NEXT_PUBLIC_SUPABASE_URL production', { input: 'https://iurspwkuvqkgnugliytb.supabase.co', stdio: ['pipe', 'inherit', 'inherit'] });

    console.log('Adding KEY...');
    execSync('npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production', { input: 'sb_publishable_SyY1YfidVvH8sFDQwLC1bg_r2PwZyvm', stdio: ['pipe', 'inherit', 'inherit'] });

    console.log('Done.');
} catch (e) {
    console.error('Failed', e);
}
