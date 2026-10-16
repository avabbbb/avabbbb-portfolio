// 信息解锁工具 —— 通过 POST /api/unlock 校验独立凭据,服务端下发 HttpOnly cookie
// 解锁凭据不写入前端；UI 状态用 localStorage 标记(仅用于显示锁/解锁图标)
// 真正的视频播放依赖 HttpOnly cookie,前端无法读取也无法伪造

const STORAGE_KEY = 'lkf-unlocked-ui';

// 仅为 UI 显示用,可能存在 localStorage 残留但 cookie 已过期的情况
// 关键校验在服务端,前端这层只是 UX
export function isUiUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setUiUnlocked(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function setUiLocked(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// 调用后端解锁接口。返回 true 表示解锁成功(cookie 已由浏览器写入)。
export async function requestUnlock(credential: string): Promise<boolean> {
  try {
    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
      credentials: 'same-origin',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

// 锁定视频的实际播放 URL(走 Pages Function 代理,携带 HttpOnly cookie)
export function lockedVideoUrl(videoId: string): string {
  return `/api/video?v=${encodeURIComponent(videoId)}`;
}
