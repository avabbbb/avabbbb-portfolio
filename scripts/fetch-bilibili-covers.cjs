/**
 * 从 Bilibili API 批量获取视频封面 URL
 * 
 * 用法：node scripts/fetch-bilibili-covers.cjs BV1pS411K7bF BV1xx...
 * 
 * 输出每个 BV 号对应的封面图 URL，可直接粘贴到 motion.ts 中
 */

const https = require('https');

function fetchCover(bvid) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 0 && json.data?.pic) {
            // 统一替换为 https
            const pic = json.data.pic.replace(/^http:/, 'https:');
            resolve({ bvid, title: json.data.title, cover: pic });
          } else {
            reject(new Error(`API error for ${bvid}: ${json.message}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const bvids = process.argv.slice(2);
  if (bvids.length === 0) {
    console.log('用法: node scripts/fetch-bilibili-covers.cjs BV1pS411K7bF [BV1xx...]');
    process.exit(0);
  }

  for (const bvid of bvids) {
    try {
      const result = await fetchCover(bvid);
      console.log(`\n${result.bvid} - ${result.title}`);
      console.log(`  封面: ${result.cover}`);
    } catch (err) {
      console.error(`\n${bvid} - 获取失败: ${err.message}`);
    }
  }
}

main();
