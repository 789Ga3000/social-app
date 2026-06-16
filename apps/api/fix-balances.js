const fs = require('fs');
const path = require('path');

const storePath = path.resolve(__dirname, '../../work/custom-store/social-store.json');

try {
  const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  let fixed = 0;

  for (const profile of data.profiles) {
    let expectedBalance = 0;
    let expectedLifetime = 0;

    const userTxs = data.transactions.filter(t => t.userId === profile.userId);
    for (const tx of userTxs) {
      expectedBalance += tx.amount;
      if (tx.amount > 0) {
        expectedLifetime += tx.amount;
      }
    }

    if (profile.starsBalance !== expectedBalance || profile.lifetimeStars !== expectedLifetime) {
      console.log(`Fixing user ${profile.userId}: balance ${profile.starsBalance} -> ${expectedBalance}`);
      profile.starsBalance = expectedBalance;
      profile.lifetimeStars = expectedLifetime;
      fixed++;
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    console.log(`Fixed balances for ${fixed} profiles.`);
  } else {
    console.log('All balances are correct.');
  }
} catch (e) {
  console.error('Error fixing balances:', e);
}
