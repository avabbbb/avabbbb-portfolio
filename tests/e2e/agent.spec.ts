import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('AI-native portfolio guide', () => {
  test('is useful without a key and exposes humane dialog behavior', async ({ page }, testInfo) => {
    await page.goto('/home');
    // On mobile the primary nav (and the AI Guide button inside it) is hidden
    // behind the menu toggle — open it first, mirroring the real user path.
    if (testInfo.project.name.includes('mobile')) {
      await page.getByRole('button', { name: /打开菜单|Open menu/i }).click();
    }
    await page.getByRole('button', { name: /打开 AI 导览|Open AI Guide/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /AI 作品导览|AI Portfolio Guide/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: '创作小白', pressed: true })).toBeVisible();
    await expect(dialog.getByText('本地工具已就绪 · Key 可选')).toBeVisible();

    const input = dialog.getByLabel('向 AI 作品导览提问');
    await input.fill('我是纯文科艺术生，想从 AI 视频入门');
    await input.press('Enter');
    await expect(dialog.getByText(/建议从「.*」开始/)).toBeVisible();
    await expect(dialog.getByText(/先看它的创作结果和制作步骤/)).toBeVisible();
    await expect(dialog.getByText(/查看 Agent 执行轨迹/)).toBeVisible();
    await expect(dialog.getByText(/请先.*API Key/i)).toHaveCount(0);

    if (!test.info().project.name.includes('mobile')) {
      await page.waitForTimeout(3_000);
      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('switches to a developer path with engineering evidence', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Audience contract needs one browser run.');
    await page.goto('/home');
    await page.getByRole('button', { name: '打开 AI 导览' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'AI 开发者' }).click();
    const input = dialog.getByLabel('向 AI 作品导览提问');
    await input.fill('我想看 Agent、MCP 和 React 的工程实现');
    await input.press('Enter');
    await expect(dialog.getByText(/技术栈、架构取舍与可运行链接/)).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Flovart' })).toBeVisible();
  });

  test('returns tool results to the model in a bounded loop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Model tool loop needs one browser run.');
    const requestBodies: Array<Record<string, any>> = [];
    await page.route('https://api.deepseek.com/**', async (route) => {
      const body = route.request().postDataJSON() as Record<string, any>;
      requestBodies.push(body);
      const response = requestBodies.length === 1
        ? { choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'find_projects', arguments: '{"query":"AI video","audience":"artist"}' } }] } }] }
        : { choices: [{ message: { role: 'assistant', content: '我为你找到一个适合创作新手的 AI 视频案例。' } }] };
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) });
    });

    await page.addInitScript(() => sessionStorage.setItem('avabbbb:deepseek-api-key:v1', 'test-key'));
    await page.goto('/home');
    await page.getByRole('button', { name: '打开 AI 导览' }).first().click();
    const dialog = page.getByRole('dialog');
    const input = dialog.getByLabel('向 AI 作品导览提问');
    await input.fill('给创作新手推荐一个 AI 视频项目');
    await input.press('Enter');
    await expect(dialog.getByText('我为你找到一个适合创作新手的 AI 视频案例。')).toBeVisible();

    expect(requestBodies).toHaveLength(2);
    expect(requestBodies[0].tools.some((tool: any) => tool.function?.name === 'find_projects')).toBe(true);
    expect(requestBodies[1].messages.some((message: any) => message.role === 'tool' && message.tool_call_id === 'call_1')).toBe(true);
    await expect(dialog.getByText('模型决策 + 站内工具')).toBeVisible();
  });
});
